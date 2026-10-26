import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faCalendarDay,
  faLocationDot,
  faThumbtack,
  faTrashCan,
} from '@fortawesome/free-solid-svg-icons'

import type { PostType } from '@/types'
import { useSession } from '@/components/auth/ProtectedRoute'
import { formatNoteTime } from '@/lib/formatNoteTime'
import { categoryStyle } from '@/lib/school'
import { formatEventDay } from '@/lib/bulletin'

type PostProps = {
  post: PostType
  canManage?: boolean
  onTogglePin?: (post: PostType) => void
  onDelete?: (post: PostType) => void
}

function Post({ post, canManage, onTogglePin, onDelete }: PostProps) {
  const session = useSession()
  const isOwnPost = post.user_id === session?.user.id
  const author = isOwnPost ? 'You' : post.author

  // Hide the image slot entirely if the URL is broken, instead of showing
  // the browser's broken-image icon
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = post.image_url && !imageFailed

  const created = new Date(post.created_at)
  const style = categoryStyle(post.category)

  return (
    <article
      id={`post-${post.id}`}
      className={`journal-card group scroll-mt-6 w-full overflow-hidden border ${
        post.pinned ? 'border-sea-teal/40 ring-sea-teal/15 ring-2' : 'border-slate-200'
      }`}
    >
      {showImage && (
        <img
          src={post.image_url!}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="aspect-[32/9] w-full border-b border-slate-200 object-cover"
        />
      )}

      <div className="p-5">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-0.5 text-xs font-semibold ${style.badge}`}>
            {style.label}
          </span>
          {post.pinned && (
            <span className="text-sea-teal flex items-center gap-1 text-xs font-semibold tracking-wide uppercase">
              <FontAwesomeIcon icon={faThumbtack} className="text-[10px]" />
              Pinned
            </span>
          )}

          {canManage && (
            <div className="ml-auto flex gap-1 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
              <button
                onClick={() => onTogglePin?.(post)}
                title={post.pinned ? 'Unpin' : 'Pin to top'}
                className="hover:text-sea-teal flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-slate-100"
              >
                <FontAwesomeIcon icon={faThumbtack} className={post.pinned ? 'rotate-45' : ''} />
              </button>
              <button
                onClick={() => onDelete?.(post)}
                title="Delete post"
                className="flex size-8 cursor-pointer items-center justify-center rounded-full text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/10"
              >
                <FontAwesomeIcon icon={faTrashCan} />
              </button>
            </div>
          )}
        </div>

        <h2 className="mt-2 font-serif text-2xl leading-snug font-medium text-slate-800">
          {post.title}
        </h2>

        <p className="mt-1 text-xs font-semibold text-slate-600">
          {author ?? 'Unknown'}
          <span className="font-normal text-slate-400">
            {' • '}
            <time dateTime={post.created_at} title={created.toLocaleString()}>
              {formatNoteTime(created)}
            </time>
          </span>
        </p>

        {(post.event_date || post.location) && (
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-700">
            {post.event_date && (
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faCalendarDay} className="text-sea-teal text-xs" />
                {formatEventDay(post.event_date)}
                {post.event_time && <span className="text-slate-500">· {post.event_time}</span>}
              </span>
            )}
            {post.location && (
              <span className="flex items-center gap-1.5">
                <FontAwesomeIcon icon={faLocationDot} className="text-sea-teal text-xs" />
                {post.location}
              </span>
            )}
          </div>
        )}

        {post.description && (
          <p className="mt-4 border-t border-dashed border-slate-200 pt-4 text-sm leading-relaxed whitespace-pre-line text-slate-700">
            {post.description}
          </p>
        )}
      </div>
    </article>
  )
}

export default Post
