// Demo-mode replacement for the Supabase client + Express API.
// `lib/supabase.ts` swaps this in when the app is built with `--mode demo`,
// so every page keeps calling `supabase.from(...)` and `fetch(API_URL/...)`
// exactly as before - they just get answered from in-browser sample data.
import type { SupabaseClient } from '@supabase/supabase-js'

import { findUnsupported, mergeUploads, rebuildFromSpec, renderPreview } from './demoPdf'
import { DemoQuery } from './query'
import { DEMO_EMAIL, DEMO_USER_ID } from './seed'
import { getFileByUrl, newFileKey, persist, putFile, ready, table, type Row } from './store'

const TITLE_MAX_LENGTH = 70
const DESCRIPTION_MAX_LENGTH = 1000
const MAX_PDF_SIZE = 50 * 1024 * 1024

function demoUser() {
  const profile = table('profiles').find((p) => p.id === DEMO_USER_ID)
  return {
    id: DEMO_USER_ID,
    email: DEMO_EMAIL,
    aud: 'authenticated',
    role: 'authenticated',
    app_metadata: {},
    user_metadata: { display_name: profile?.display_name ?? '' },
    created_at: new Date().toISOString(),
  }
}

function demoSession() {
  return {
    access_token: 'demo-access-token',
    refresh_token: 'demo-refresh-token',
    token_type: 'bearer',
    expires_in: 3600,
    expires_at: Math.floor(Date.now() / 1000) + 3600,
    user: demoUser(),
  }
}

const demoAuth = {
  async getSession() {
    await ready()
    return { data: { session: demoSession() }, error: null }
  },
  async getUser() {
    await ready()
    return { data: { user: demoUser() }, error: null }
  },
  onAuthStateChange(callback: (event: string, session: unknown) => void) {
    ready().then(() => callback('INITIAL_SESSION', demoSession()))
    return { data: { subscription: { unsubscribe() {} } } }
  },
  async signInWithPassword() {
    await ready()
    return { data: { session: demoSession(), user: demoUser() }, error: null }
  },
  async signUp() {
    await ready()
    return { data: { session: demoSession(), user: { ...demoUser(), identities: [{}] } }, error: null }
  },
  // There's no real account to leave in the demo; the app's /login route
  // sends visitors straight back to the dashboard
  async signOut() {
    return { error: null }
  },
}

// ---------- fake Express API ----------

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })
const empty = (status: number) => new Response(null, { status })
const fail = (status: number, error: string) => json({ error }, status)

const publicRow = (row: Row) =>
  Object.fromEntries(Object.entries(row).filter(([k]) => !k.startsWith('_')))

function checkFields(title: string, description?: string) {
  if (title && title.length > TITLE_MAX_LENGTH)
    return fail(400, `Title must be ${TITLE_MAX_LENGTH} characters or fewer`)
  if (description && description.length > DESCRIPTION_MAX_LENGTH)
    return fail(400, `Description must be ${DESCRIPTION_MAX_LENGTH} characters or fewer`)
  return null
}

// Stores a PDF for a note and kicks off its preview image in the
// background, like the server does after responding
async function attachPdf(note: Row, bytes: Uint8Array) {
  note._file = newFileKey('note')
  note.content_url = await putFile(note._file, new Blob([bytes as BlobPart], { type: 'application/pdf' }))
  persist()

  renderPreview(bytes)
    .then(async (png) => {
      note._preview = newFileKey('preview')
      note.preview_url = await putFile(note._preview, png)
      persist()
    })
    .catch((err) => console.error('Failed to generate note preview:', err))
}

async function handleApi(method: string, path: string, init?: RequestInit): Promise<Response> {
  await ready()
  const notes = table('notes')

  if (method === 'GET' && path === '/api/me') return json({ isAdmin: true })

  if (method === 'GET' && path.startsWith('/api/notes/search')) {
    const params = new URL(path, location.origin).searchParams
    const q = params.get('q')?.toLowerCase()
    const author = params.get('author')?.toLowerCase()
    return json(
      notes
        .filter((n) => !q || n.title.toLowerCase().includes(q))
        .filter((n) => !author || String(n.author ?? '').toLowerCase().includes(author))
        .map(publicRow)
    )
  }

  if (method === 'POST' && path === '/api/notes') {
    const form = init?.body as FormData
    const title = String(form.get('title') ?? '')
    const subjectId = form.get('subject_id')
    const description = String(form.get('description') ?? '')
    const files = form.getAll('files') as File[]

    const bad = checkFields(title, description)
    if (bad) return bad
    if (!title || !subjectId) return fail(400, 'Fields missing')
    if (files.length === 0) return fail(400, 'No files provided')
    const unsupported = findUnsupported(files)
    if (unsupported)
      return fail(400, `Unsupported file type: ${unsupported.name}. Only PDF, PNG, and JPEG are supported right now.`)

    let bytes: Uint8Array
    try {
      bytes = await mergeUploads(files)
    } catch {
      return fail(400, 'Could not merge files into a PDF')
    }
    if (bytes.length > MAX_PDF_SIZE) return fail(400, 'The combined PDF exceeds the 50MB upload limit.')

    const profile = table('profiles').find((p) => p.id === DEMO_USER_ID)
    const note: Row = {
      id: notes.reduce((m, n) => Math.max(m, n.id), 0) + 1,
      user_id: DEMO_USER_ID,
      title,
      subject_id: Number(subjectId),
      description,
      author: profile?.display_name ?? null,
      saves: 0,
      created_at: new Date().toISOString(),
      updated_at: null,
      content_url: '',
      preview_url: null,
    }
    notes.push(note)
    await attachPdf(note, bytes)
    return json(publicRow(note), 201)
  }

  const editMatch = path.match(/^\/api\/notes\/(\d+)\/edit$/)
  if (method === 'POST' && editMatch) {
    const note = notes.find((n) => n.id === Number(editMatch[1]))
    if (!note) return fail(404, 'Note not found!')
    if (note.user_id !== DEMO_USER_ID) return fail(403, 'You do not have permission to edit this note.')

    const form = init?.body as FormData
    const data = JSON.parse(String(form.get('newNoteData') ?? '{}'))
    const files = form.getAll('files') as File[]
    const bad = checkFields(data.title, data.description)
    if (bad) return bad

    let spec
    try {
      spec = JSON.parse(String(form.get('pages')))
    } catch {
      return fail(400, 'Pages must be valid JSON')
    }
    if (!Array.isArray(spec) || spec.length === 0) return fail(400, 'Pages must be a non-empty array')

    let bytes: Uint8Array
    try {
      const original = await getFileByUrl(note.content_url)
      if (!original) throw new Error('Original PDF missing')
      bytes = await rebuildFromSpec(await original.arrayBuffer(), spec, files)
    } catch (err) {
      console.error(err)
      return fail(400, 'Could not build PDF from the requested pages')
    }

    Object.assign(note, {
      title: data.title ?? note.title,
      subject_id: data.subject_id ?? note.subject_id,
      description: data.description ?? note.description,
      updated_at: new Date().toISOString(),
    })
    await attachPdf(note, bytes)
    return empty(201)
  }

  const idMatch = path.match(/^\/api\/notes\/(\d+)$/)
  if (idMatch) {
    const note = notes.find((n) => n.id === Number(idMatch[1]))
    if (!note) return fail(404, 'Note not found')

    if (method === 'PATCH') {
      if (note.user_id !== DEMO_USER_ID) return fail(403, 'You do not have permission to edit this note.')
      const { title, subject_id, description } = JSON.parse(String(init?.body ?? '{}'))
      if (!title || !subject_id) return fail(400, 'Fields missing')
      const bad = checkFields(title, description)
      if (bad) return bad
      Object.assign(note, { title, subject_id, description, updated_at: new Date().toISOString() })
      persist()
      return empty(204)
    }

    if (method === 'DELETE') {
      // The demo visitor is an admin, so they can remove any note
      notes.splice(notes.indexOf(note), 1)
      const saves = table('note_saves')
      const kept = saves.filter((s) => s.note_id !== note.id)
      saves.length = 0
      saves.push(...kept)
      persist()
      return empty(204)
    }
  }

  return fail(404, `Demo API has no route for ${method} ${path}`)
}

let fetchInstalled = false

function installDemoFetch() {
  if (fetchInstalled) return
  fetchInstalled = true

  const realFetch = window.fetch.bind(window)
  const apiBase = `${import.meta.env.VITE_API_URL}`

  window.fetch = async (input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === 'string' ? input : input instanceof URL ? input.href : input.url
    const method = (init?.method ?? (input instanceof Request ? input.method : 'GET')).toUpperCase()

    if (url.startsWith(`${apiBase}/api/`)) {
      try {
        return await handleApi(method, url.slice(apiBase.length), init)
      } catch (err) {
        console.error('[demo api]', err)
        return fail(500, 'Something went wrong in the demo')
      }
    }

    // Browsers refuse HEAD requests on blob: URLs; the note page uses one
    // to read the file size, so answer it from the blob instead
    if (url.startsWith('blob:') && method === 'HEAD') {
      const blob = await realFetch(url).then((r) => r.blob())
      return new Response(null, { status: 200, headers: { 'content-length': String(blob.size) } })
    }

    return realFetch(input, init)
  }
}

export function createDemoClient(): SupabaseClient {
  installDemoFetch()
  ready() // start seeding right away so the first page loads faster

  const client = {
    from: (tableName: string) => new DemoQuery(tableName),
    auth: demoAuth,
  }
  return client as unknown as SupabaseClient
}
