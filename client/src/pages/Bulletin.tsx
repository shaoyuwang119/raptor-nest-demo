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

function Bulletin() {
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
      <div className="journal-paper min-w-0 flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-gutter-stable overflow-y-auto py-8 pr-8 pl-20"></div>
    </div>
  )
}

export default Bulletin
