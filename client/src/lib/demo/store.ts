// In-browser stand-in for the Supabase database + storage buckets, used by
// the demo build. Table rows live in localStorage and uploaded/generated
// PDFs + previews live in IndexedDB, so a visitor's changes survive a
// refresh but never leave their browser.
import { makeNotePdf, renderPreview } from './demoPdf'
import {
  ago,
  seedBulletin,
  seedNotes,
  seedProfiles,
  seedSaves,
  seedSubjects,
  seedTodos,
  seedUserSubjects,
} from './seed'

export type Row = Record<string, any>

// Bump the version whenever the sample data changes, so returning visitors
// get the new data instead of their old saved copy
const STORAGE_KEY = 'raptor-nest-demo-v3'
const DB_NAME = 'raptor-nest-demo-files'

let tables: Record<string, Row[]> = {}
const fileUrls = new Map<string, string>()
const memoryFiles = new Map<string, Blob>() // fallback when IndexedDB is unavailable

// ---------- IndexedDB (files) ----------

let dbPromise: Promise<IDBDatabase | null> | null = null
function openDb(): Promise<IDBDatabase | null> {
  dbPromise ??= new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, 1)
      req.onupgradeneeded = () => req.result.createObjectStore('files')
      req.onsuccess = () => resolve(req.result)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
  return dbPromise
}

async function getFile(key: string): Promise<Blob | null> {
  if (memoryFiles.has(key)) return memoryFiles.get(key)!
  const db = await openDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const req = db.transaction('files').objectStore('files').get(key)
      req.onsuccess = () => resolve((req.result as Blob) ?? null)
      req.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function putFile(key: string, blob: Blob): Promise<string> {
  memoryFiles.set(key, blob)
  const db = await openDb()
  if (db) {
    try {
      db.transaction('files', 'readwrite').objectStore('files').put(blob, key)
    } catch {
      /* memory copy is enough for this session */
    }
  }
  const old = fileUrls.get(key)
  if (old) URL.revokeObjectURL(old)
  const url = URL.createObjectURL(blob)
  fileUrls.set(key, url)
  return url
}

export function newFileKey(prefix: string) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
}

// Look up the stored bytes behind a note's content_url (used when editing)
export async function getFileByUrl(url: string): Promise<Blob | null> {
  for (const [key, u] of fileUrls) if (u === url) return getFile(key)
  return null
}

// ---------- tables ----------

export function table(name: string): Row[] {
  return (tables[name] ??= [])
}

export function nextId(name: string) {
  return table(name).reduce((max, r) => Math.max(max, Number(r.id) || 0), 0) + 1
}

export function persist() {
  try {
    // content_url / preview_url are blob URLs that die with the tab, so
    // only the file keys get saved; they're re-hydrated on load
    const snapshot = {
      ...tables,
      notes: table('notes').map(({ content_url, preview_url, ...rest }) => rest),
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot))
  } catch {
    /* storage blocked or full - demo still works for this session */
  }
}

function seedTables() {
  const authorName = (id: string) =>
    seedProfiles.find((p) => p.id === id)?.display_name ?? null

  tables = {
    profiles: seedProfiles.map((p) => ({ ...p })),
    subjects: seedSubjects.map((s) => ({ ...s })),
    user_subjects: seedUserSubjects.map((r) => ({ ...r })),
    note_saves: seedSaves.map((r) => ({ ...r })),
    notes: seedNotes.map(({ lines: _lines, ageMs, ...n }) => ({
      ...n,
      author: authorName(n.user_id),
      created_at: ago(ageMs),
      updated_at: null,
      _file: `seed-note-${n.id}`,
      _preview: `seed-preview-${n.id}`,
    })),
    bulletin: seedBulletin.map((p) => ({ ...p, author: authorName(p.user_id) })),
    todos: seedTodos.map((t) => ({ ...t })),
  }
}

// Make sure a note row has working blob URLs, generating seed PDFs and
// previews the first time they're needed
async function hydrateNote(row: Row) {
  let pdf = await getFile(row._file)

  if (!pdf && String(row._file).startsWith('seed-note-')) {
    const seed = seedNotes.find((n) => `seed-note-${n.id}` === row._file)
    if (seed) {
      const bytes = await makeNotePdf({
        title: seed.title,
        subject: seedSubjects.find((s) => s.id === seed.subject_id)?.name ?? '',
        author: seedProfiles.find((p) => p.id === seed.user_id)?.display_name ?? '',
        lines: seed.lines,
      })
      pdf = new Blob([bytes as BlobPart], { type: 'application/pdf' })
      await putFile(row._file, pdf)
    }
  }
  if (!pdf) return

  row.content_url = fileUrls.get(row._file) ?? (await putFile(row._file, pdf))

  if (row._preview) {
    let preview = await getFile(row._preview)
    if (!preview) {
      try {
        preview = await renderPreview(new Uint8Array(await pdf.arrayBuffer()))
        await putFile(row._preview, preview)
      } catch {
        return
      }
    }
    row.preview_url = fileUrls.get(row._preview) ?? (await putFile(row._preview, preview))
  }
}

let readyPromise: Promise<void> | null = null

export function ready(): Promise<void> {
  readyPromise ??= (async () => {
    let loaded = false
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        tables = JSON.parse(raw)
        loaded = true
      }
    } catch {
      /* fall through to a fresh seed */
    }
    if (!loaded) {
      seedTables()
      persist()
    }
    await Promise.all(table('notes').map(hydrateNote))
  })()
  return readyPromise
}

// Wipes the visitor's changes and starts over from the sample data
export async function resetDemo() {
  try {
    localStorage.removeItem(STORAGE_KEY)
    const db = await openDb()
    db?.transaction('files', 'readwrite').objectStore('files').clear()
  } catch {
    /* ignore */
  }
  location.reload()
}

export { hydrateNote }
