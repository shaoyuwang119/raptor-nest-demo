import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faSpinner, faXmark } from '@fortawesome/free-solid-svg-icons'

import { createPost } from '@/lib/bulletin'
import { POST_CATEGORIES, categoryStyle, type PostCategory } from '@/lib/school'

const TITLE_MAX = 80
const BODY_MAX = 1000

type PostModalProps = {
  open: boolean
  userId: string
  onClose: () => void
  onPosted: () => void
}

const inputClass =
  'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-800 placeholder:text-slate-400 focus:border-sea-teal focus:outline-none'

function PostModal({ open, userId, onClose, onPosted }: PostModalProps) {
  const [title, setTitle] = useState('')
  const [category, setCategory] = useState<PostCategory>('School')
  const [description, setDescription] = useState('')
  const [eventDate, setEventDate] = useState('')
  const [eventTime, setEventTime] = useState('')
  const [location, setLocation] = useState('')
  const [pinned, setPinned] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  function reset() {
    setTitle('')
    setCategory('School')
    setDescription('')
    setEventDate('')
    setEventTime('')
    setLocation('')
    setPinned(false)
    setError(null)
  }

  function close() {
    if (submitting) return
    reset()
    onClose()
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (!title.trim()) return setError('Give your post a title.')
    if (category === 'Event' && !eventDate) return setError('Events need a date.')

    setSubmitting(true)
    setError(null)
    try {
      await createPost(userId, {
        title: title.trim(),
        description: description.trim(),
        category,
        pinned,
        event_date: eventDate || null,
        event_time: eventTime.trim() || null,
        location: location.trim() || null,
      })
      reset()
      onPosted()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not post that.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-30 flex items-center justify-center bg-black/50 p-4"
      onMouseDown={(e) => e.target === e.currentTarget && close()}
    >
      <form
        onSubmit={submit}
        className="flex max-h-full w-full max-w-xl flex-col gap-4 overflow-y-auto rounded-2xl bg-slate-100 p-6 shadow-xl"
      >
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-2xl font-bold text-slate-800">New announcement</h2>
          <button
            type="button"
            onClick={close}
            className="cursor-pointer text-xl text-slate-500 hover:text-slate-900"
            aria-label="Close"
          >
            <FontAwesomeIcon icon={faXmark} />
          </button>
        </div>

        <div className="flex gap-2">
          {POST_CATEGORIES.map((c) => {
            const active = c === category
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCategory(c)}
                className={`flex-1 cursor-pointer rounded-lg border px-3 py-2 text-sm font-medium transition ${
                  active
                    ? `${categoryStyle(c).badge} border-transparent ring-2 ring-current/30`
                    : 'border-slate-300 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {c}
              </button>
            )
          })}
        </div>

        <div className="relative">
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={TITLE_MAX}
            placeholder="Title (required)"
            className={`${inputClass} pr-14 font-medium`}
          />
          <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-xs text-slate-400">
            {title.length}/{TITLE_MAX}
          </span>
        </div>

        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={BODY_MAX}
          rows={5}
          placeholder="Details - what, who it's for, how to sign up..."
          className={`${inputClass} resize-none`}
        />

        <div className="grid grid-cols-3 gap-3">
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Date {category === 'Event' ? '(required)' : '(optional)'}
            <input
              type="date"
              value={eventDate}
              onChange={(e) => setEventDate(e.target.value)}
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Time
            <input
              value={eventTime}
              onChange={(e) => setEventTime(e.target.value)}
              placeholder="3:45 PM, Lunch..."
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs font-medium text-slate-600">
            Location
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="Library..."
              className={inputClass}
            />
          </label>
        </div>

        <label className="flex cursor-pointer items-center gap-2 text-sm text-slate-700">
          <input
            type="checkbox"
            checked={pinned}
            onChange={(e) => setPinned(e.target.checked)}
            className="accent-lasa-navy size-4"
          />
          Pin to the top of the bulletin and everyone's home page
        </label>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={submitting}
          className="bg-lasa-navy text-lasa-white hover:bg-lasa-navy-deep flex cursor-pointer items-center justify-center gap-2 rounded-lg p-3 font-medium transition disabled:cursor-not-allowed disabled:opacity-60 dark:ring-1 dark:ring-slate-300"
        >
          {submitting ? (
            <>
              <FontAwesomeIcon icon={faSpinner} spin /> Posting...
            </>
          ) : (
            'Post announcement'
          )}
        </button>
      </form>
    </div>
  )
}

export default PostModal
