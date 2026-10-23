import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import { NoteCard, Title, ErrorDisplay, Loading } from '@/components'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types'
import { usePageTitle } from '@/lib/usePageTitle'
import { useSavedNotes } from '@/lib/useSavedNotes'
import { resolveAuthors } from '@/lib/resolveAuthors'

const NOTES_PER_SECTION = 8

function Explore() {
  const [popularNotes, setPopularNotes] = useState<Note[]>([])
  const [newNotes, setNewNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { savedIds, toggleSave } = useSavedNotes()

  usePageTitle('Explore | The Raptor Nest')

  useEffect(() => {
    async function loadNotes() {
      setLoading(true)

      const [popularRes, newRes] = await Promise.all([
        supabase
          .from('notes')
          .select('*, subject:subjects(id, name, category)')
          .order('saves', { ascending: false })
          .limit(NOTES_PER_SECTION),
        supabase
          .from('notes')
          .select('*, subject:subjects(id, name, category)')
          .order('created_at', { ascending: false })
          .limit(NOTES_PER_SECTION),
      ])

      if (popularRes.error || newRes.error) {
        setError(
          popularRes.error?.message ??
            newRes.error?.message ??
            'Failed to load notes'
        )
        setLoading(false)
        return
      }

      const [resolvedPopular, resolvedNew] = await Promise.all([
        resolveAuthors(popularRes.data ?? []),
        resolveAuthors(newRes.data ?? []),
      ])

      setPopularNotes(resolvedPopular)
      setNewNotes(resolvedNew)
      setLoading(false)
    }

    loadNotes()
  }, [])

  function renderSection(title: string, notes: Note[]) {
    console.log(savedIds)
    return (
      <section className="mb-12">
        <h2 className="mb-4 font-serif text-2xl font-medium text-slate-800">
          <span className="journal-highlight">{title}</span>
        </h2>
        {notes.length === 0 ? (
          <p className="font-hand text-xl text-slate-500">no notes yet...</p>
        ) : (
          <div className="grid grid-cols-2 gap-4">
            {notes.map((note) => (
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
    )
  }

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="journal-paper scrollbar-thin scrollbar-thumb-slate-300 scrollbar-gutter-stable min-w-0 flex-1 overflow-y-auto py-8 pr-8 pl-20">
        <Title
          title="Explore"
          description="Discover notes made by your school community"
        />

        {error && (
          <div className="mb-4">
            <ErrorDisplay message={error} />
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loading />
          </div>
        ) : (
          <>
            {renderSection('Popular', popularNotes)}
            {renderSection('New', newNotes)}
          </>
        )}
      </div>
    </div>
  )
}

export default Explore
