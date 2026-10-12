import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { NoteCard, ErrorDisplay, Loading } from '@/components'
import { useProfile, useSession } from '@/components/auth/ProtectedRoute'

import { supabase } from '@/lib/supabase'
import type { Note, Subject } from '@/types'
import { usePageTitle } from '@/lib/usePageTitle'
import { useSavedNotes } from '@/lib/useSavedNotes'
import { resolveAuthors } from '@/lib/resolveAuthors'
import { getCategoryColor } from '@/lib/categoryColors'
import { formatNoteTime } from '@/lib/formatNoteTime'
import Title from '@/components/common/Title'

function getGreeting() {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}

function SectionHeader({ title, to }: { title: string; to?: string }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <h2 className="font-serif text-xl font-medium text-slate-800">{title}</h2>
      {to && (
        <Link
          to={to}
          className="hover:text-sea-teal text-sm text-slate-500 transition-colors"
        >
          See all →
        </Link>
      )}
    </div>
  )
}

function FeaturedNoteCard({ note }: { note: Note }) {
  const color = getCategoryColor(note.subject?.category)
  const isOwnNote = note.user_id === useSession()?.user.id
  const displayTime = formatNoteTime(
    new Date(note.updated_at ?? note.created_at)
  )

  return (
    <Link
      to={`/notes/${note.id}`}
      className={`flex h-43 min-w-0 flex-1 flex-col rounded-lg border border-slate-200 p-4 transition-colors duration-200 ${color.wash} ${color.hoverBg}`}
    >
      <span
        className={`w-fit rounded-md px-3 py-1 text-xs font-medium ${color.bg} ${color.text}`}
      >
        {note.subject?.name}
      </span>
      <p className="mt-3 line-clamp-1 font-serif text-xl font-medium text-slate-800">
        {note.title}
      </p>
      <p className="mt-1 line-clamp-2 text-sm text-slate-500">
        {note.description}
      </p>
      <p className="mt-auto text-xs font-semibold text-slate-600">
        {isOwnNote ? 'You' : note.author}
        <span className="text-slate-400"> • {displayTime}</span>
      </p>
    </Link>
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

  const renderRow = (rowNotes: Note[], emptyMessage: string) =>
    rowNotes.length === 0 ? (
      <p className="text-sm text-slate-500">{emptyMessage}</p>
    ) : (
      <div className="flex scrollbar-thin scrollbar-thumb-slate-300 gap-3 overflow-x-auto pb-2">
        {rowNotes.map((note) => (
          <div key={note.id} className="w-90 shrink-0">
            <NoteCard
              note={note}
              isSaved={savedIds.has(note.id)}
              onToggleSave={toggleSave}
              stretch={1}
            />
          </div>
        ))}
      </div>
    )

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="min-w-0 flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-gutter-stable flex-col overflow-y-auto bg-slate-50 p-6">
        <Title
          title={firstName ? `${getGreeting()}, ${firstName}` : getGreeting()}
          description="Here's what's going on in your classes."
        />

        {error && <ErrorDisplay message={error} />}

        {loading ? (
          <div className="flex h-50 w-full items-center justify-center">
            <Loading />
          </div>
        ) : (
          <div className="flex flex-col gap-y-10">
            <section>
              <SectionHeader title="Pick up where you left off" />
              {recentNotes.length === 0 ? (
                <p className="text-sm text-slate-500">
                  Notes you open will show up here.
                </p>
              ) : (
                <div className="flex gap-3">
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

            <section>
              <SectionHeader title="New in your subjects" to="/explore" />
              {renderRow(newNotes, 'No new notes in your subjects yet.')}
            </section>

            <section>
              <SectionHeader title="My saved" to="/saved" />
              {renderRow(savedNotes, 'Star a note to save it here.')}
            </section>

            <section>
              <SectionHeader title="Popular" to="/explore" />
              {renderRow(popularNotes, 'Nothing popular yet.')}
            </section>
          </div>
        )}
      </div>

      <aside className="w-72 shrink-0 overflow-y-auto border-l border-slate-200 bg-slate-50 px-4 py-6">
        <h2 className="font-serif text-lg font-medium text-slate-800">
          My subjects
        </h2>
        {subjects.length === 0 ? (
          <div className="mt-3 rounded-lg border border-dashed border-slate-300 p-4 text-center">
            <p className="text-sm text-slate-500">
              Add your classes to get a feed built around them.
            </p>
            <Link
              to="/profile"
              className="bg-sea-teal hover:bg-sea-teal-dark mt-3 inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm text-white transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="text-xs" />
              Add subject
            </Link>
          </div>
        ) : (
          <div className="mt-3 flex flex-col gap-1">
            {subjects.map((subject) => {
              const color = getCategoryColor(subject.category)
              return (
                <Link
                  key={subject.id}
                  to={`/search?subject=${subject.id}`}
                  className="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-700 transition-colors hover:bg-slate-100"
                >
                  <span
                    className={`h-2.5 w-2.5 shrink-0 rounded-full ${color.bg}`}
                  />
                  <span className="truncate">{subject.name}</span>
                </Link>
              )
            })}
            <Link
              to="/profile"
              className="hover:text-sea-teal mt-1 flex items-center gap-2.5 rounded-md px-2 py-1.5 text-sm text-slate-500 transition-colors"
            >
              <FontAwesomeIcon icon={faPlus} className="w-2.5 text-xs" />
              Add subject
            </Link>
          </div>
        )}

        <hr className="my-6 border-slate-200" />

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
