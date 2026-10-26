import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useNavigate, useParams } from 'react-router-dom'

import { supabase } from '@/lib/supabase'
import { rememberNote } from '@/lib/recentNotes'
import type { Note } from '@/types'
import { formatSize } from '@/lib/formatFileSize'

import { ErrorDisplay, Loading } from '@/components'
import type { User } from '@supabase/supabase-js'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faExpand,
  faCompress,
  faEllipsisVertical,
  faStar as faStarSolid,
} from '@fortawesome/free-solid-svg-icons'
import { faStar } from '@fortawesome/free-regular-svg-icons'

import { usePageTitle } from '@/lib/usePageTitle'
import { useSavedNotes } from '@/lib/useSavedNotes'

import { formatNoteTime } from '@/lib/formatNoteTime'
import { useProfile } from '@/components/auth/ProtectedRoute'

function MetaRow({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-end gap-2 py-1">
      <dt className="text-slate-500">{label}</dt>
      <span className="mb-1 min-w-4 flex-1 border-b border-dotted border-slate-300" />
      <dd className="text-slate-700">{children}</dd>
    </div>
  )
}

type FetchState =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'not-found' }
  | { status: 'ready'; note: Note }

function NotePage() {
  const { id } = useParams()
  const navigate = useNavigate()

  const [state, setState] = useState<FetchState>({ status: 'loading' })
  const [user, setUser] = useState<User>()
  const [fileSize, setFileSize] = useState<number | null>(null)

  const [activeTab, setActiveTab] = useState<
    'details' | 'comments' | 'related'
  >('details')
  const [isExpanded, setIsExpanded] = useState(false)

  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  const { savedIds, toggleSave } = useSavedNotes()
  const [saveCount, setSaveCount] = useState(0)

  const { isAdmin } = useProfile()

  usePageTitle(
    state.status === 'ready'
      ? `${state.note.title} | The Raptor Nest`
      : 'Loading... | The Raptor Nest'
  )

  function handleReport() {
    // TODO: POST /api/notes/:id/report once the reports table exists
    alert('Sorry, report feature not implemented yet.')
  }

  async function handleDelete() {
    const confirmDelete = window.confirm(
      'Are you sure you want to delete this note?'
    )

    if (!confirmDelete) return

    const {
      data: { session },
    } = await supabase.auth.getSession()
    if (!session) return

    const res = await fetch(`${import.meta.env.VITE_API_URL}/api/notes/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${session.access_token}` },
    })

    if (!res.ok) {
      alert('Failed to delete note.')
      return
    }

    navigate('/')
  }

  useEffect(() => {
    if (state.status === 'ready') setSaveCount(state.note.saves)
  }, [state])

  function handleToggleSave() {
    if (state.status !== 'ready') return
    const isSaved = savedIds.has(state.note.id)
    setSaveCount((prev) => prev + (isSaved ? -1 : 1))
    toggleSave(state.note.id, isSaved)
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  useEffect(() => {
    if (state.status !== 'ready') return

    fetch(state.note.content_url, { method: 'HEAD' })
      .then((r) => setFileSize(Number(r.headers.get('content-length')) || null))
      .catch(() => setFileSize(null))
  }, [state])

  useEffect(() => {
    async function fetchNote() {
      setState({ status: 'loading' })

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser()

      if (!user) {
        setState({ status: 'error', message: userError!.message })
        return
      }

      setUser(user)

      const { data, error } = await supabase
        .from('notes')
        .select('*, subject:subjects(id, name, category)')
        .eq('id', id)
        .maybeSingle()

      if (error) {
        setState({ status: 'error', message: error.message })
        console.log('error!')
        return
      }

      if (!data) {
        setState({ status: 'not-found' })
        return
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.user_id)
        .single()

      setState({
        status: 'ready',
        note: { ...data, author: profile?.display_name ?? 'Unknown User' },
      })
      rememberNote(data.id)
    }

    fetchNote()
  }, [id])

  function renderContent() {
    switch (state.status) {
      case 'loading':
        return <Loading />
      case 'not-found':
        return (
          <div className="w-full p-4">
            <ErrorDisplay message="This note doesn't exist or has been deleted." />
          </div>
        )
      case 'error':
        return (
          <div className="w-full p-4">
            <ErrorDisplay message={state.message}></ErrorDisplay>
          </div>
        )
      case 'ready': {
        const { note } = state
        const publishedDate = formatNoteTime(new Date(note.created_at))
        const editedDate = note.updated_at
          ? formatNoteTime(new Date(note.updated_at))
          : null

        const isOwner = note.user_id === user?.id

        return (
          <div className="flex h-full w-full gap-2">
            {/* PDF viewer on the left */}
            <div
              className={`overflow-hidden bg-black transition-all duration-200 ${
                isExpanded
                  ? 'fixed inset-0 z-50 h-screen w-screen'
                  : 'sticky h-full w-[70%]'
              }`}
            >
              <button
                onClick={() => setIsExpanded((prev) => !prev)}
                aria-label={isExpanded ? 'Exit fullscreen' : 'Expand preview'}
                className="absolute right-8 bottom-4 z-10 flex h-9 w-9 cursor-pointer items-center justify-center rounded-full bg-black/50 text-gray-100 hover:bg-black/70"
              >
                <FontAwesomeIcon icon={isExpanded ? faCompress : faExpand} />
              </button>

              {note.content_url ? (
                <iframe
                  src={note.content_url}
                  title={note.title}
                  className="h-full w-full"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-slate-400">
                  No content attached.
                </div>
              )}
            </div>

            {!isExpanded && (
              // Tabs
              <div className="journal-grid flex flex-1 flex-col gap-3 px-6 py-5 shadow-md">
                <div className="flex gap-4 border-b border-slate-200">
                  {(['details', 'related'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`cursor-pointer border-b-2 px-1 pb-1 font-serif text-[15px] capitalize ${
                        activeTab === tab
                          ? 'border-sea-teal text-slate-900'
                          : 'border-transparent text-slate-400 hover:text-slate-600'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}

                  <div className="mb-1 ml-auto flex items-center">
                    <button
                      onClick={handleToggleSave}
                      title={
                        savedIds.has(note.id)
                          ? 'Unsave this note'
                          : 'Save this note'
                      }
                      className={`flex h-8 cursor-pointer items-center gap-2 rounded-full px-2 text-sm transition-all active:text-[13px] ${
                        savedIds.has(note.id)
                          ? 'text-amber-500'
                          : 'text-slate-500 hover:text-amber-500'
                      }`}
                    >
                      <span className="text-[14px]">{saveCount}</span>
                      <FontAwesomeIcon
                        icon={savedIds.has(note.id) ? faStarSolid : faStar}
                        size="lg"
                      />
                    </button>

                    {/* Kebab menu */}
                    <div className="relative" ref={menuRef}>
                      <button
                        onClick={() => setShowMenu((prev) => !prev)}
                        aria-label="Note options"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-slate-500 hover:bg-slate-100"
                      >
                        <FontAwesomeIcon icon={faEllipsisVertical} size="lg" />
                      </button>

                      {showMenu && (
                        <div className="absolute right-0 z-10 mt-0 w-36 overflow-hidden rounded-md border border-slate-200 bg-white shadow-lg">
                          {isOwner && (
                            <button
                              onClick={() => {
                                setShowMenu(false)
                                navigate(`/notes/${id}/edit`)
                              }}
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                            >
                              Edit Note
                            </button>
                          )}
                          {(isOwner || isAdmin) && (
                            <button
                              onClick={() => {
                                setShowMenu(false)
                                handleDelete()
                              }}
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                            >
                              Delete Note
                            </button>
                          )}
                          {!isOwner && (
                            <button
                              onClick={() => {
                                setShowMenu(false)
                                handleReport()
                              }}
                              className="block w-full cursor-pointer px-4 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                            >
                              Report Note
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {activeTab === 'details' && (
                  <div className="flex flex-col gap-3 pt-1">
                    <h1 className="font-serif text-3xl font-medium text-slate-900">
                      {note.title}
                    </h1>

                    {note.subject && (
                      <span className="w-fit rounded-sm border border-slate-300 bg-white px-3 py-1 text-sm text-slate-600">
                        {note.subject.name}
                      </span>
                    )}

                    {/* Details as a table-of-contents style list with dotted leaders */}
                    <dl className="text-sm">
                      <MetaRow label="Author">{note.author}</MetaRow>
                      <MetaRow label="Published">{publishedDate}</MetaRow>
                      {editedDate && (
                        <MetaRow label="Edited">{editedDate}</MetaRow>
                      )}
                      {fileSize !== null && (
                        <MetaRow label="File size">
                          {formatSize(fileSize)}
                        </MetaRow>
                      )}
                    </dl>

                    <p className="mt-2 whitespace-pre-line text-slate-800">
                      {note.description}
                    </p>
                  </div>
                )}

                {activeTab === 'comments' && (
                  <p className="font-hand pt-6 text-xl text-slate-500">
                    comments coming soon...
                  </p>
                )}

                {activeTab === 'related' && (
                  <p className="font-hand pt-6 text-xl text-slate-500">
                    related notes coming soon...
                  </p>
                )}
              </div>
            )}
          </div>
        )
      }
    }
  }

  return <div className="flex flex-1 bg-slate-50">{renderContent()}</div>
}

export default NotePage
