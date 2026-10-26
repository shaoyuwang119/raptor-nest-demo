import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

import { NoteCard, ErrorDisplay, Loading, Title } from '@/components'
import { supabase } from '@/lib/supabase'
import type { Note } from '@/types'
import { usePageTitle } from '@/lib/usePageTitle'
import { useSavedNotes } from '@/lib/useSavedNotes'
import { resolveAuthors } from '@/lib/resolveAuthors'

function Search() {
  const [searchParams] = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const subjectId = searchParams.get('subject')

  const [results, setResults] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { savedIds, toggleSave } = useSavedNotes()

  usePageTitle(q ? `"${q}" | Search | The Raptor Nest` : 'Search | The Raptor Nest')

  useEffect(() => {
    async function runSearch() {
      setLoading(true)
      setError(null)

      if (!q && !subjectId) {
        setResults([])
        setLoading(false)
        return
      }

      if (!q) {
        // Subject-only filter, no text to match against
        const { data, error } = await supabase
          .from('notes')
          .select('*, subject:subjects(id, name, category)')
          .eq('subject_id', Number(subjectId))

        if (error) {
          setError(error.message)
          setLoading(false)
          return
        }

        setResults(await resolveAuthors(data ?? []))
        setLoading(false)
        return
      }

      // Text search across title and subject name, optionally narrowed to one subject
      let byTitleQuery = supabase
        .from('notes')
        .select('*, subject:subjects(id, name, category)')
        .ilike('title', `%${q}%`)

      let bySubjectQuery = supabase
        .from('notes')
        .select('*, subject:subjects!inner(id, name, category)')
        .ilike('subject.name', `%${q}%`)

      if (subjectId) {
        byTitleQuery = byTitleQuery.eq('subject_id', Number(subjectId))
        bySubjectQuery = bySubjectQuery.eq('subject_id', Number(subjectId))
      }

      const [byTitle, bySubject] = await Promise.all([
        byTitleQuery,
        bySubjectQuery,
      ])

      if (byTitle.error || bySubject.error) {
        setError(
          byTitle.error?.message ?? bySubject.error?.message ?? 'Search failed'
        )
        setLoading(false)
        return
      }

      const merged = new Map<number, Note>()
      for (const note of [...(byTitle.data ?? []), ...(bySubject.data ?? [])]) {
        merged.set(note.id, note)
      }

      setResults(await resolveAuthors([...merged.values()]))
      setLoading(false)
    }

    runSearch()
  }, [q, subjectId])

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="journal-paper scrollbar-thin scrollbar-thumb-slate-300 scrollbar-gutter-stable min-w-0 flex-1 overflow-y-auto py-8 pr-8 pl-20">
        <Title
          title={q ? `Results for "${q}"` : 'Search results'}
          description={
            loading
              ? 'Searching...'
              : `${results.length} note${results.length === 1 ? '' : 's'} found`
          }
        />

        {error && <ErrorDisplay message={error} />}

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loading />
          </div>
        ) : results.length === 0 ? (
          <div>
            <p className="font-hand text-xl text-slate-500">
              sorry, no notes found...
            </p>
            <p className="mt-1 text-sm text-slate-400">
              Try a different search term!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 gap-4">
            {results.map((note) => (
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
      </div>
    </div>
  )
}

export default Search
