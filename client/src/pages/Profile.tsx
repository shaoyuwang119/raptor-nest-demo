import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

import { faPencil } from '@fortawesome/free-solid-svg-icons'

import type { Note, Subject } from '@/types'
import { NoteCard, ErrorDisplay, SubjectCombobox } from '@/components'
import { useProfile, useSession } from '@/components/auth/ProtectedRoute'
import { getCategoryColor } from '@/lib/categoryColors'
import { usePageTitle } from '@/lib/usePageTitle'
import { useSavedNotes } from '@/lib/useSavedNotes'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'

function Profile() {
  // Both come from ProtectedRoute, so no auth round trip is needed here
  const userId = useSession().user.id
  const { name: displayName } = useProfile()

  const [notes, setNotes] = useState<Note[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [bio, setBio] = useState('')
  const [bioDraft, setBioDraft] = useState('')
  const [isEditingBio, setIsEditingBio] = useState(false)
  const [subjects, setSubjects] = useState<Subject[]>([])
  const [subjectsPublic, setSubjectsPublic] = useState(false)

  const { savedIds, toggleSave } = useSavedNotes()

  usePageTitle('Profile | The Raptor Nest')

  useEffect(() => {
    async function fetchProfile() {
      setLoading(true)

      const [
        { data: profile },
        { data: userNotes, error: notesError },
        { data: subjectRows },
      ] = await Promise.all([
        supabase
          .from('profiles')
          .select('bio, subjects_public')
          .eq('id', userId)
          .single(),
        supabase
          .from('notes')
          .select('*, subject:subjects(id, name, category)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false }),
        supabase
          .from('user_subjects')
          .select('subject:subjects(id, name, category)')
          .eq('user_id', userId),
      ])

      if (notesError) {
        setError(notesError.message)
        setLoading(false)
        return
      }

      setNotes(userNotes ?? [])
      setLoading(false)

      setBio(profile?.bio ?? '')
      setSubjectsPublic(profile?.subjects_public ?? false)
      setSubjects(
        (subjectRows ?? []).map((r) => r.subject as unknown as Subject)
      )
    }

    fetchProfile()
  }, [userId])

  async function addSubject(subjectId: number) {
    if (subjects.some((s) => s.id === subjectId)) return

    const { data, error } = await supabase
      .from('user_subjects')
      .insert({ user_id: userId, subject_id: subjectId })
      .select('subject:subjects(id, name, category)')
      .single()

    if (error) {
      return setError(error.message)
    }

    setSubjects((prev) => [...prev, data.subject as unknown as Subject])
  }

  async function removeSubject(subjectId: number) {
    const { error } = await supabase
      .from('user_subjects')
      .delete()
      .eq('user_id', userId)
      .eq('subject_id', subjectId)

    if (error) {
      return setError(error.message)
    }

    setSubjects((prev) => prev.filter((s) => s.id !== subjectId))
  }

  async function toggleSubjectsPublic() {
    const { data, error } = await supabase
      .from('profiles')
      .update({ subjects_public: !subjectsPublic })
      .eq('id', userId)

    if (error) {
      return setError(error.message)
    }

    setSubjectsPublic(!subjectsPublic)
  }

  async function saveBio() {
    const trimmed = bioDraft.trim()
    const { data, error } = await supabase
      .from('profiles')
      .update({ bio: trimmed })
      .eq('id', userId)

    if (error) {
      return setError(error.message)
    }

    setBio(trimmed)
    setIsEditingBio(false)
  }

  return (
    <div className="journal-paper flex-1 overflow-y-auto py-8 pr-8 pl-20">
      <div className="max-w-6xl space-y-6">
        {/* Header card: banner + avatar, name, stats, edit link */}
        <section className="journal-card overflow-hidden border border-slate-200">
          {/* LASA banner: navy with the raptor peeking in from the right */}
          <div className="bg-lasa-navy dark:bg-lasa-navy-deep relative h-32 overflow-hidden border-b-[3px] border-lasa-silver sm:h-36">
            <div
              aria-hidden
              className="absolute inset-0 opacity-[0.07]"
              style={{
                backgroundImage:
                  'linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)',
                backgroundSize: '24px 24px',
              }}
            />
            <img
              src="/brand/raptor.png"
              alt=""
              className="absolute -right-6 -bottom-16 h-56 w-auto opacity-25"
            />
            <span className="font-brand text-lasa-white/80 absolute top-5 right-44 hidden text-xl tracking-widest sm:block">
              LASA RAPTORS
            </span>
          </div>

          <div className="flex flex-col gap-4 px-6 pb-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="flex items-end gap-4">
              <div className="bg-sea-sky text-sea-teal-dark relative -mt-12 flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 border-white text-4xl font-semibold shadow-sm">
                {displayName ? displayName.charAt(0).toUpperCase() : '?'}
              </div>
              <div className="pb-1">
                <h1 className="pt-2 font-serif text-2xl font-semibold whitespace-nowrap text-slate-900">
                  {displayName || (loading ? 'Loading...' : 'Unknown User')}
                </h1>
                <p className="text-sm text-slate-500">LASA Student</p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-6">
              <div className="text-center">
                <p className="text-2xl font-semibold text-slate-900">
                  {notes.length}
                </p>
                <p className="text-xs tracking-wide text-slate-500 uppercase">
                  Note{notes.length === 1 ? '' : 's'} created
                </p>
              </div>

              <Link
                to="/saved"
                className="rounded-lg px-2 py-1 text-center transition-colors hover:bg-slate-100"
              >
                <p className="text-2xl font-semibold text-slate-900">
                  {savedIds.size}
                </p>
                <p className="text-xs tracking-wide text-slate-500 uppercase">
                  Saved
                </p>
              </Link>

              <Link
                to="/settings"
                className="bg-sea-teal hover:bg-sea-teal-dark rounded-lg px-4 py-2 text-sm font-medium text-white transition-colors"
              >
                Edit account
              </Link>
            </div>
          </div>
        </section>

        {error && <ErrorDisplay message={error} />}

        <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
          {/* Left column: about + subjects */}
          <aside className="space-y-6">
            <section className="journal-card border border-slate-200 p-5">
              <div className="mb-2 flex items-center">
                <h2 className="font-serif text-lg font-semibold text-slate-900">
                  About
                </h2>
                {!isEditingBio && (
                  <button
                    onClick={() => {
                      setIsEditingBio(true)
                      setBioDraft(bio)
                    }}
                    aria-label="Edit bio"
                    title="Edit bio"
                    className="hover:bg-sea-sky hover:text-sea-teal-dark ml-1 h-8 w-8 rounded-full text-slate-400 transition-colors hover:cursor-pointer"
                  >
                    <FontAwesomeIcon icon={faPencil} size="sm" />
                  </button>
                )}
              </div>
              {isEditingBio ? (
                <div className="space-y-1">
                  <textarea
                    value={bioDraft}
                    onChange={(e) => setBioDraft(e.target.value)}
                    maxLength={300}
                    rows={4}
                    className="w-full resize-none rounded-lg border border-slate-300 p-2 text-sm text-slate-800 focus:outline-none"
                  />
                  <div className="-mb-1 flex items-center justify-between">
                    <span className="text-xs text-slate-400">
                      {bioDraft.length}/300
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setIsEditingBio(false)}
                        className="text-sm text-slate-500 hover:cursor-pointer hover:text-slate-700"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={saveBio}
                        className="bg-sea-teal hover:bg-sea-teal-dark rounded-lg px-3 py-1 text-sm text-white hover:cursor-pointer"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
              ) : bio ? (
                <p className="text-sm whitespace-pre-line text-slate-600">
                  {bio}
                </p>
              ) : (
                <p className="font-hand text-lg text-slate-500">
                  You haven't written a bio yet.
                </p>
              )}
            </section>

            <section className="journal-card border border-slate-200 p-5">
              <div className="mb-1 flex items-center justify-between">
                <h2 className="font-serif text-lg font-semibold text-slate-900">
                  My subjects
                </h2>
                <button
                  onClick={toggleSubjectsPublic}
                  className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors hover:cursor-pointer ${
                    subjectsPublic
                      ? 'bg-sea-sky text-sea-teal-dark'
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {subjectsPublic ? 'Public' : 'Private'}
                </button>
              </div>
              <p className="mb-4 text-xs text-slate-500">
                Only you can see your subjects unless you make them public.
              </p>
              <div className="mb-3 flex flex-col gap-2">
                {subjects.map((s) => {
                  const color = getCategoryColor(s.category)
                  return (
                    <span
                      key={s.id}
                      className={`flex items-center gap-1 rounded-sm px-2.5 py-1 text-xs font-medium ${color.bg} ${color.text}`}
                    >
                      {s.name}
                      <button
                        onClick={() => removeSubject(s.id)}
                        aria-label={`Remove ${s.name}`}
                        className="-m-2 ml-auto p-2 text-sm opacity-60 hover:cursor-pointer hover:opacity-100"
                      >
                        ×
                      </button>
                    </span>
                  )
                })}
              </div>
              <SubjectCombobox
                value={null}
                onChange={addSubject}
                placeholder="Add a subject…"
              />
            </section>
          </aside>

          {/* Right column: notes */}
          <section className="journal-card border border-slate-200 p-5">
            <h2 className="mb-4 font-serif text-lg font-semibold text-slate-900">
              My notes
            </h2>

            {!loading && !error && notes.length === 0 && (
              <p className="font-hand text-lg text-slate-500">
                You haven't created any notes yet.
              </p>
            )}

            <div className="grid gap-3 xl:grid-cols-2">
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
          </section>
        </div>
      </div>
    </div>
  )
}

export default Profile
