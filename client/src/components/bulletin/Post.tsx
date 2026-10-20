import { useState } from 'react'
import type { PostType } from '@/types'

import { useSession } from '@/components/auth/ProtectedRoute'

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faThumbtack } from '@fortawesome/free-solid-svg-icons'

import { formatNoteTime } from '@/lib/formatNoteTime'

type PostProps = {
  post: PostType
  authorLabel?: string
}

function Post({ post, authorLabel }: PostProps) {
  const session = useSession()
  const isOwnPost = post.user_id === session?.user.id
  const author = isOwnPost ? 'You' : (authorLabel ?? post.author)

  // Hide the image slot entirely if the URL is broken, instead of showing
  // the browser's broken-image icon
  const [imageFailed, setImageFailed] = useState(false)
  const showImage = post.image_url && !imageFailed

  const created = new Date(post.created_at)

  return (
    <article className="journal-card w-full max-w-2xl overflow-hidden border border-slate-200">
      {showImage && (
        <img
          src={post.image_url!}
          alt=""
          loading="lazy"
          onError={() => setImageFailed(true)}
          className="aspect-[16/9] w-full border-b border-slate-200 object-cover"
        />
      )}

      <div className="p-5">
        <div className="text-sea-teal flex items-center gap-1.5 text-xs font-semibold tracking-wide uppercase">
          <FontAwesomeIcon icon={faThumbtack} className="text-[10px]" />
          Announcement
        </div>

        <h2 className="mt-1.5 font-serif text-2xl leading-snug font-medium text-slate-800">
          {post.title}
        </h2>

        <p className="mt-1 text-xs font-semibold text-slate-600">
          {author ?? 'Unknown'}
          <span className="text-slate-400">
            {' '}
            •{' '}
            <time dateTime={post.created_at} title={created.toLocaleString()}>
              {formatNoteTime(created)}
            </time>
          </span>
        </p>

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
