import { useEffect, useState } from 'react'

import { NoteCard, ErrorDisplay, Loading, Title } from '@/components'
import { useSession } from '@/components/auth/ProtectedRoute'
import { supabase } from '@/lib/supabase'
import type { Note, Subject } from '@/types'
import { usePageTitle } from '@/lib/usePageTitle'
import { useSavedNotes } from '@/lib/useSavedNotes'
import { resolveAuthors } from '@/lib/resolveAuthors'
import { getCategoryColor } from '@/lib/categoryColors'

function Saved() {
  const userId = useSession().user.id
  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [subjectFilter, setSubjectFilter] = useState<number | null>(null)

  const { toggleSave } = useSavedNotes()

  usePageTitle('My saved | StudyNote')

  useEffect(() => {
    async function fetchSaved() {
      const { data, error } = await supabase
        .from('note_saves')
        .select('note:notes(*, subject:subjects(id, name, category))')
        .eq('user_id', userId)

      if (error) {
        setError(error.message)
        setLoading(false)
        return
      }

      const savedNotes = (data ?? []).map((r) => r.note as unknown as Note)
      setNotes(await resolveAuthors(savedNotes))
      setLoading(false)
    }

    fetchSaved()
  }, [userId])

  // One chip per subject that appears in the saved notes
  const subjects = [
    ...new Map(
      notes
        .filter((n) => n.subject)
        .map((n) => [n.subject!.id, n.subject as Subject])
    ).values(),
  ]
  const visibleNotes =
    subjectFilter === null
      ? notes
      : notes.filter((n) => n.subject_id === subjectFilter)

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="journal-paper scrollbar-thin scrollbar-thumb-slate-300 scrollbar-gutter-stable min-w-0 flex-1 overflow-y-auto py-8 pr-8 pl-20">
        <Title
          title={
            <>
              <span className="journal-highlight">Saved</span> for later
            </>
          }
          description="Notes you've starred"
        />

        {error && <ErrorDisplay message={error} />}

        {loading ? (
          <div className="flex h-50 w-full items-center justify-center">
            <Loading />
          </div>
        ) : notes.length === 0 ? (
          <p className="font-hand text-xl text-slate-500">
            nothing saved yet — star a note to keep it here ☆
          </p>
        ) : (
          <>
            {subjects.length > 1 && (
              <div className="mb-4 flex flex-wrap gap-2">
                <button
                  onClick={() => setSubjectFilter(null)}
                  className={`cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition ${
                    subjectFilter === null
                      ? 'bg-sea-teal-dark text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  All
                </button>
                {subjects.map((subject) => {
                  const color = getCategoryColor(subject.category)
                  const isActive = subjectFilter === subject.id
                  return (
                    <button
                      key={subject.id}
                      onClick={() => setSubjectFilter(subject.id)}
                      className={`cursor-pointer rounded-sm px-3 py-1.5 text-sm font-medium transition ${color.bg} ${color.text} ${
                        isActive
                          ? 'ring-2 ring-current'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                    >
                      {subject.name}
                    </button>
                  )
                })}
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              {visibleNotes.map((note) => (
                <NoteCard
                  key={note.id}
                  note={note}
                  isSaved={true}
                  onToggleSave={toggleSave}
                  stretch={1}
                />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default Saved
