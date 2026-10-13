import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { NoteCard, ErrorDisplay, Loading } from '@/components'
import { useProfile, useSession } from '@/components/auth/ProtectedRoute'

import { supabase } from '@/lib/supabase'
import type { Note, Subject } from '@/types'
import { usePageTitle } from '@/lib/usePageTitle'
import { useSavedNotes } from '@/lib/useSavedNotes'
import { resolveAuthors } from '@/lib/resolveAuthors'
import { getCategoryColor } from '@/lib/categoryColors'
import { formatNoteTime } from '@/lib/formatNoteTime'

function SectionHeader({
  title,
  note,
  to,
}: {
  title: ReactNode
  note?: string
  to?: string
}) {
  return (
    <div className="mb-4 flex items-baseline gap-3">
      <h2 className="font-serif text-2xl font-medium text-slate-800">
        {title}
      </h2>
      {note && (
        <span className="font-hand text-sea-teal -rotate-2 text-xl">
          {note}
        </span>
      )}
      {to && (
        <Link
          to={to}
          className="hover:text-sea-teal font-hand ml-auto text-xl text-slate-500 transition-colors"
        >
          more ↗
        </Link>
      )}
    </div>
  )
}

function EmptyNote({ children }: { children: ReactNode }) {
  return <p className="font-hand text-xl text-slate-500">{children}</p>
}

// Index card taped to the page, showing the note's first-page preview
function FeaturedNoteCard({ note }: { note: Note }) {
  const color = getCategoryColor(note.subject?.category)
  const isOwnNote = note.user_id === useSession()?.user.id
  const displayTime = formatNoteTime(
    new Date(note.updated_at ?? note.created_at)
  )

  return (
    <Link
      to={`/notes/${note.id}`}
      className="relative flex h-43 min-w-0 flex-1 -rotate-[0.6deg] gap-4 rounded-sm bg-white p-3 shadow-[0_1px_2px_rgb(0_0_0/0.08),0_12px_24px_-16px_rgb(0_0_0/0.4)] transition-transform duration-200 hover:rotate-0"
    >
      <span
        aria-hidden
        className="bg-sea-sky/70 absolute -top-2.5 left-1/2 h-5 w-20 -translate-x-1/2 rotate-[-4deg]"
      />
      <div
        className={`h-full w-28 shrink-0 overflow-hidden rounded-sm border border-slate-200 ${color.wash}`}
      >
        {note.preview_url && (
          <img
            src={note.preview_url}
            alt=""
            className="h-full w-full object-cover object-top"
          />
        )}
      </div>
      <div className="flex min-w-0 flex-1 flex-col py-1">
        <span
          className={`w-fit rounded-md px-2.5 py-0.5 text-xs font-medium ${color.bg} ${color.text}`}
        >
          {note.subject?.name}
        </span>
        <p className="mt-2 line-clamp-2 font-serif text-xl leading-snug font-medium text-slate-800">
          {note.title}
        </p>
        <p className="mt-1 line-clamp-2 text-sm text-slate-500">
          {note.description}
        </p>
        <p className="mt-auto text-xs font-semibold text-slate-600">
          {isOwnNote ? 'You' : note.author}
          <span className="text-slate-400"> • {displayTime}</span>
        </p>
      </div>
    </Link>
  )
}

// Ruled list of entries, like lines in a notebook
function NoteList({
  notes,
  showSaves,
}: {
  notes: Note[]
  showSaves?: boolean
}) {
  return (
    <ul>
      {notes.map((note) => {
        const color = getCategoryColor(note.subject?.category)
        return (
          <li key={note.id}>
            <Link
              to={`/notes/${note.id}`}
              className="group flex items-baseline gap-3 border-b border-dashed border-slate-300 py-2.5"
            >
              <span className="decoration-sea-teal-light min-w-0 truncate font-medium text-slate-800 underline-offset-4 group-hover:underline">
                {note.title}
              </span>
              <span className={`shrink-0 text-xs font-medium ${color.text}`}>
                {note.subject?.name}
              </span>
              <span className="ml-auto shrink-0 text-xs text-slate-400 tabular-nums">
                {showSaves
                  ? `★ ${note.saves}`
                  : formatNoteTime(new Date(note.created_at))}
              </span>
            </Link>
          </li>
        )
      })}
    </ul>
  )
}

function Home() {
  const [notes, setNotes] = useState<Note[]>([])
  const [savedNotes, setSavedNotes] = useState<Note[]>([])
  const [error, setError] = useState<string | null>()
  const [loading, setLoading] = useState(true)
  const [subjects, setSubjects] = useState<Subject[]>([])

  const { savedIds, toggleSave } = useSavedNotes()
  const userId = useSession().user.id
  const profile = useProfile()
  const firstName = profile.name.split(' ')[0]

  usePageTitle('Home | StudyNote')

  useEffect(() => {
    const fetchNotes = async () => {
      const { data, error } = await supabase
        .from('notes')
        .select('*, subject:subjects(id, name, category)')
      if (error) {
        setError(error.message)
        return
      }

      setNotes(await resolveAuthors(data))
      setLoading(false)
    }

    fetchNotes()
  }, [])

  useEffect(() => {
    async function fetchSavedNotes() {
      if (savedIds.size === 0) {
        setSavedNotes([])
        return
      }

      const { data, error } = await supabase
        .from('notes')
        .select('*, subject:subjects(id, name, category)')
        .in('id', [...savedIds])

      if (error || !data) return

      setSavedNotes(await resolveAuthors(data))
    }

    fetchSavedNotes()
  }, [savedIds])

  // fetch user's subjects
  useEffect(() => {
    async function fetchSubjects() {
      const { data, error } = await supabase
        .from('user_subjects')
        .select('subject:subjects(id, name, category)')
        .eq('user_id', userId)

      if (error) {
        setError(error.message)
        return
      }

      setSubjects((data ?? []).map((r) => r.subject as unknown as Subject))
    }

    fetchSubjects()
  }, [userId])

  // TODO: replace with the user's recently viewed notes (note_views)
  const recentNotes = notes.slice(0, 3)
  const subjectIds = new Set(subjects.map((s) => s.id))
  const newNotes = notes
    .filter((n) => subjectIds.has(n.subject_id))
    .sort((a, b) => b.created_at.localeCompare(a.created_at))
  const popularNotes = [...notes].sort((a, b) => b.saves - a.saves).slice(0, 8)

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="journal-paper min-w-0 flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-gutter-stable overflow-y-auto py-8 pr-8 pl-20">
        <header className="mb-10">
          <h1 className="font-serif text-4xl font-medium text-slate-800">
            {today}
          </h1>
          <p className="font-hand text-sea-teal mt-1 w-fit -rotate-1 text-2xl">
            {firstName ? `back at it, ${firstName}` : 'back at it'}
          </p>
        </header>

        {error && <ErrorDisplay message={error} />}

        {loading ? (
          <div className="flex h-50 w-full items-center justify-center">
            <Loading />
          </div>
        ) : (
          <div className="flex flex-col gap-y-12">
            <section>
              <SectionHeader
                title={
                  <>
                    <span className="journal-highlight">Last</span> time…
                  </>
                }
                note="↓ where you left off"
              />
              {recentNotes.length === 0 ? (
                <EmptyNote>notes you open will show up here</EmptyNote>
              ) : (
                <div className="flex gap-4">
                  <FeaturedNoteCard note={recentNotes[0]} />
                  <div className="flex min-w-0 flex-1 flex-col gap-3">
                    {recentNotes.slice(1).map((note) => (
                      <NoteCard
                        key={note.id}
                        note={note}
                        isSaved={savedIds.has(note.id)}
                        onToggleSave={toggleSave}
                        stretch={1}
                      />
                    ))}
                  </div>
                </div>
              )}
            </section>

            <div className="grid gap-12 xl:grid-cols-2">
              <section>
                <SectionHeader
                  title={
                    <>
                      New in <span className="journal-highlight">your</span>{' '}
                      subjects
                    </>
                  }
                  to="/explore"
                />
                {newNotes.length === 0 ? (
                  <EmptyNote>nothing new in your subjects yet...</EmptyNote>
                ) : (
                  <NoteList notes={newNotes.slice(0, 6)} />
                )}
              </section>

              <section>
                <SectionHeader title="Currently popular" to="/explore" />
                {popularNotes.length === 0 ? (
                  <EmptyNote>nothing popular yet...</EmptyNote>
                ) : (
                  <NoteList notes={popularNotes.slice(0, 6)} showSaves />
                )}
              </section>
            </div>

            <section>
              <SectionHeader
                title={
                  <>
                    <span className="journal-highlight">Saved</span> for later
                  </>
                }
                to="/saved"
              />
              {savedNotes.length === 0 ? (
                <EmptyNote>star a note to keep it here ☆</EmptyNote>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {savedNotes.slice(0, 4).map((note) => (
                    <NoteCard
                      key={note.id}
                      note={note}
                      isSaved={savedIds.has(note.id)}
                      onToggleSave={toggleSave}
                      stretch={1}
                    />
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-white px-6 py-8">
        <h2 className="font-serif text-xl font-medium text-slate-800">
          My subjects
        </h2>

        {subjects.length === 0 ? (
          <div className="mt-6 space-y-2">
            <p className="font-hand text-lg leading-snug text-slate-500">
              no classes yet — add yours to get a personalized feed of notes!
            </p>
            <Link
              to="/profile"
              className="text-sea-teal text-md mt-2 inline-block font-sans hover:underline"
            >
              + add a subject
            </Link>
          </div>
        ) : (
          <>
            <ol className="mt-5 flex flex-col">
              {subjects.map((subject) => {
                const color = getCategoryColor(subject.category)
                const count = notes.filter(
                  (n) => n.subject_id === subject.id
                ).length
                return (
                  <li key={subject.id}>
                    <Link
                      to={`/search?subject=${subject.id}`}
                      className="group flex items-end gap-2 py-1.5 text-sm text-slate-700"
                    >
                      <span
                        className={`h-4 w-1.5 shrink-0 self-center rounded-sm bg-current opacity-70 ${color.text}`}
                      />
                      <span className="group-hover:text-sea-teal truncate transition-colors">
                        {subject.name}
                      </span>
                      <span className="mb-1 min-w-4 flex-1 border-b border-dotted border-slate-300" />
                      <span className="font-sans text-slate-500 tabular-nums">
                        {count}
                      </span>
                    </Link>
                  </li>
                )
              })}
            </ol>
            <Link
              to="/profile"
              className="font-hand hover:text-sea-teal mt-3 inline-block text-lg text-slate-500 transition-colors"
            >
              + add a subject
            </Link>
          </>
        )}

        {/* <h2 className="font-serif text-lg font-medium text-slate-800">Clubs</h2> */}
        {/* TODO: list the user's clubs once the club board exists */}
        {/* <p className="mt-3 text-sm text-slate-500">
          You haven't joined any clubs yet.
        </p> */}
      </aside>
    </div>
  )
}

export default Home
