import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'

import { ErrorDisplay, Loading, Post } from '@/components'
import PostModal from '@/components/bulletin/PostModal'
import UpcomingList from '@/components/bulletin/UpcomingList'
import { useProfile, useSession } from '@/components/auth/ProtectedRoute'
import { deletePost, setPinned, upcomingEvents, useBulletin } from '@/lib/bulletin'
import { POST_CATEGORIES, SCHOOL, categoryStyle, type PostCategory } from '@/lib/school'
import { usePageTitle } from '@/lib/usePageTitle'
import type { PostType } from '@/types'

type Filter = 'All' | PostCategory

const FILTER_LABELS: Record<Filter, string> = {
  All: 'Everything',
  School: 'School',
  Club: 'Clubs',
  Event: 'Events',
}

function Bulletin() {
  usePageTitle(`Bulletin | ${SCHOOL.appName}`)
  const { posts, loading, error } = useBulletin()
  const { isAdmin } = useProfile()
  const userId = useSession().user.id
  const [filter, setFilter] = useState<Filter>('All')
  const [composing, setComposing] = useState(false)

  // Coming from a Home-page headline: scroll to that post once it's loaded
  const { hash } = useLocation()
  useEffect(() => {
    if (loading || !hash) return
    const el = document.querySelector(hash)
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' })
    el?.classList.add('flash-highlight')
  }, [loading, hash])

  const shown = filter === 'All' ? posts : posts.filter((p) => (p.category ?? 'School') === filter)

  async function handleDelete(post: PostType) {
    if (!window.confirm(`Delete "${post.title}"?`)) return
    await deletePost(post.id).catch((e) => alert(e.message))
  }

  async function handleTogglePin(post: PostType) {
    await setPinned(post.id, !post.pinned).catch((e) => alert(e.message))
  }

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="journal-paper scrollbar-thin scrollbar-thumb-slate-300 scrollbar-gutter-stable min-w-0 flex-1 overflow-y-auto py-8 pr-8 pl-20">
        <header className="mb-6 flex max-w-2xl items-end justify-between gap-4">
          <div>
            <h1 className="font-serif text-4xl font-medium text-slate-800">Bulletin</h1>
            <p className="font-hand text-sea-teal mt-1 -rotate-1 text-2xl">
              announcements, clubs &amp; events
            </p>
          </div>
          {isAdmin && (
            <button
              onClick={() => setComposing(true)}
              className="bg-lasa-navy text-lasa-white hover:bg-lasa-navy-deep flex shrink-0 cursor-pointer items-center gap-2 rounded-full px-4 py-2 text-sm font-medium shadow-sm transition dark:ring-1 dark:ring-slate-300"
            >
              <FontAwesomeIcon icon={faPlus} /> New post
            </button>
          )}
        </header>

        <div className="mb-6 flex max-w-2xl flex-wrap gap-2">
          {(['All', ...POST_CATEGORIES] as Filter[]).map((f) => {
            const count = f === 'All' ? posts.length : posts.filter((p) => (p.category ?? 'School') === f).length
            const active = f === filter
            return (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`flex cursor-pointer items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                  active
                    ? 'bg-lasa-navy border-lasa-navy text-lasa-white dark:bg-slate-800 dark:border-slate-800 dark:text-slate-50'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                {f !== 'All' && <span className={`size-2 rounded-full ${categoryStyle(f).dot}`} />}
                {FILTER_LABELS[f]}
                <span className={active ? 'opacity-70' : 'text-slate-400'}>{count}</span>
              </button>
            )
          })}
        </div>

        {error && <ErrorDisplay message={error} />}

        {loading ? (
          <div className="flex h-50 max-w-2xl items-center justify-center">
            <Loading />
          </div>
        ) : shown.length === 0 ? (
          <p className="font-hand text-xl text-slate-500">nothing posted here yet...</p>
        ) : (
          <div className="flex max-w-2xl flex-col gap-6 pb-10">
            {shown.map((post) => (
              <Post
                key={post.id}
                post={post}
                canManage={isAdmin || post.user_id === userId}
                onDelete={handleDelete}
                onTogglePin={handleTogglePin}
              />
            ))}
          </div>
        )}
      </div>

      <aside className="hidden w-80 shrink-0 overflow-y-auto border-l border-slate-200 bg-white px-6 py-8 lg:block">
        <h2 className="font-serif text-xl font-medium text-slate-800">Coming up</h2>
        <p className="mt-0.5 mb-3 text-xs text-slate-500">Everything with a date, soonest first</p>
        <UpcomingList events={upcomingEvents(posts, 10)} />
      </aside>

      <PostModal
        open={composing}
        userId={userId}
        onClose={() => setComposing(false)}
        onPosted={() => setComposing(false)}
      />
    </div>
  )
}

export default Bulletin
