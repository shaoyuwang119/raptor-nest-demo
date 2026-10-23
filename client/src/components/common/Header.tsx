import { useEffect, useRef, useState } from 'react'
import { NavLink, useLocation, useNavigate } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faMagnifyingGlass,
  faBell,
  faRightFromBracket,
} from '@fortawesome/free-solid-svg-icons'
import { faSquarePlus } from '@fortawesome/free-regular-svg-icons'
import { faBullhorn, faFileArrowUp } from '@fortawesome/free-solid-svg-icons'
import type { IconDefinition } from '@fortawesome/fontawesome-svg-core'

import { useBulletin } from '@/lib/bulletin'
import { categoryStyle } from '@/lib/school'
import { formatNoteTime } from '@/lib/formatNoteTime'

import { supabase } from '@/lib/supabase'
import { useSubjects } from '@/lib/subjects'
import { isDemo } from '@/lib/supabase'

type HeaderProps = {
  profileName: string
  onUploadNotes: () => void
  onNewPost?: () => void // only passed for people allowed to post
}

type NoteSuggestion = {
  id: number
  title: string
  author: string | null
}

const LAST_SEEN_KEY = 'raptor-nest-bulletin-seen'

export default function Header({ profileName, onUploadNotes, onNewPost }: HeaderProps) {
  const { posts } = useBulletin()
  const [showCreateMenu, setShowCreateMenu] = useState(false)
  const [showBell, setShowBell] = useState(false)
  const [lastSeen, setLastSeen] = useState(() => {
    try {
      return localStorage.getItem(LAST_SEEN_KEY) ?? ''
    } catch {
      return ''
    }
  })
  const menusRef = useRef<HTMLDivElement>(null)
  const latest = [...posts].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 6)
  const unread = latest.filter((p) => p.created_at > lastSeen).length

  function openBell() {
    setShowBell((open) => !open)
    setShowCreateMenu(false)
    const newest = latest[0]?.created_at
    if (newest) {
      setLastSeen(newest)
      try {
        localStorage.setItem(LAST_SEEN_KEY, newest)
      } catch {
        /* fine - the dot just comes back next visit */
      }
    }
  }

  useEffect(() => {
    function close(e: MouseEvent) {
      if (menusRef.current && !menusRef.current.contains(e.target as Node)) {
        setShowCreateMenu(false)
        setShowBell(false)
      }
    }
    document.addEventListener('mousedown', close)
    return () => document.removeEventListener('mousedown', close)
  }, [])

  const navigate = useNavigate()
  const subjects = useSubjects()
  const location = useLocation()

  const [query, setQuery] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [noteSuggestions, setNoteSuggestions] = useState<NoteSuggestion[]>([])
  const containerRef = useRef<HTMLDivElement>(null)

  const [showProfileMenu, setShowProfileMenu] = useState(false)
  const profileMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setQuery('')
    setIsOpen(false)
  }, [location.pathname])

  useEffect(() => {
    function handleClickOutsideProfile(event: MouseEvent) {
      if (
        profileMenuRef.current &&
        !profileMenuRef.current.contains(event.target as Node)
      ) {
        setShowProfileMenu(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutsideProfile)
    return () =>
      document.removeEventListener('mousedown', handleClickOutsideProfile)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!query.trim()) {
      setNoteSuggestions([])
      return
    }

    const timeout = setTimeout(async () => {
      const { data } = await supabase
        .from('notes')
        .select('id, title, author')
        .ilike('title', `%${query}%`)
        .limit(5)

      setNoteSuggestions(data ?? [])
    }, 250)

    return () => clearTimeout(timeout)
  }, [query])

  const subjectSuggestions = query.trim()
    ? subjects
        .filter((s) => s.name.toLowerCase().includes(query.toLowerCase()))
        .slice(0, 6)
    : []

  const runSearch = () => {
    if (!query.trim()) return
    navigate(`/search?q=${encodeURIComponent(query.trim())}`)
    setIsOpen(false)
  }

  const showDropdown =
    isOpen &&
    query.trim() &&
    (noteSuggestions.length > 0 || subjectSuggestions.length > 0)

  return (
    <header className="bg-lasa-navy dark:bg-lasa-navy-deep border-lasa-silver flex h-16 w-full shrink-0 items-center gap-4 border-b-[3px] px-6">
      <NavLink
        to={'/'}
        className="flex shrink-0 items-center gap-2.5 select-none"
      >
        <img
          src="/brand/raptor-shield.png"
          alt=""
          className="h-10 w-auto drop-shadow"
        />
        <span className="font-brand text-[22px] leading-none tracking-wide text-lasa-white">
          The Raptor Nest
        </span>
        {isDemo && (
          <span className="border-lasa-silver-light/60 text-lasa-silver-light rounded-full border px-2 py-0.5 text-[11px] font-semibold tracking-wider uppercase">
            Demo version
          </span>
        )}
      </NavLink>

      <div className="flex flex-1 justify-center">
        <div className="relative w-full max-w-150" ref={containerRef}>
          <FontAwesomeIcon
            icon={faMagnifyingGlass}
            className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-lasa-white/60"
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsOpen(true)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') runSearch()
            }}
            placeholder="Search notes, classes, subjects..."
            className="focus:ring-lasa-silver-light/50 w-full rounded-full border border-lasa-white/15 bg-lasa-white/10 py-2 pr-3 pl-9 text-sm text-lasa-white placeholder:text-lasa-white/55 focus:bg-lasa-white/15 focus:ring-2 focus:outline-none"
          />

          {showDropdown && (
            <div className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
              {noteSuggestions.length > 0 && (
                <div>
                  <div className="px-3 pt-2 text-xs font-medium text-slate-400">
                    Notes
                  </div>
                  {noteSuggestions.map((note) => (
                    <button
                      key={note.id}
                      type="button"
                      onClick={() => {
                        navigate(`/notes/${note.id}`)
                        setIsOpen(false)
                        setQuery('')
                      }}
                      className="flex w-full flex-col px-3 py-2 text-left hover:bg-slate-100"
                    >
                      <span className="text-sm font-medium text-slate-800">
                        {note.title}
                      </span>
                      {note.author && (
                        <span className="text-xs text-slate-400">
                          {note.author}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {subjectSuggestions.length > 0 && (
                <div className="border-t border-slate-100">
                  <div className="px-3 pt-2 text-xs font-medium text-slate-400">
                    Subjects
                  </div>
                  {subjectSuggestions.map((subject) => (
                    <button
                      key={subject.id}
                      type="button"
                      onClick={() => {
                        navigate(`/search?subject=${subject.id}`)
                        setIsOpen(false)
                        setQuery('')
                      }}
                      className="flex w-full items-center justify-between px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
                    >
                      <span>{subject.name}</span>
                      <span className="text-xs text-slate-400">
                        {subject.category}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-3">
        <div ref={menusRef} className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => {
                setShowCreateMenu((open) => !open)
                setShowBell(false)
              }}
              className="hover:text-lasa-navy flex h-10 cursor-pointer items-center gap-2 rounded-full border border-lasa-white/70 px-4 text-base font-medium text-lasa-white transition-all duration-200 hover:bg-lasa-white"
            >
              <FontAwesomeIcon icon={faSquarePlus} />
              Create
            </button>
            {showCreateMenu && (
              <div className="absolute right-0 z-30 mt-2 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg">
                <MenuItem
                  icon={faFileArrowUp}
                  title="Upload notes"
                  hint="Share a PDF or photos of your notes"
                  onClick={() => {
                    setShowCreateMenu(false)
                    onUploadNotes()
                  }}
                />
                {onNewPost && (
                  <MenuItem
                    icon={faBullhorn}
                    title="New announcement"
                    hint="Post to the bulletin"
                    onClick={() => {
                      setShowCreateMenu(false)
                      onNewPost()
                    }}
                  />
                )}
              </div>
            )}
          </div>

          <div className="relative">
            <button
              title="Notifications"
              onClick={openBell}
              className="relative flex size-10 cursor-pointer items-center justify-center rounded-full text-base text-lasa-white/70 hover:bg-lasa-white/10 hover:text-lasa-white"
            >
              <FontAwesomeIcon icon={faBell} />
              {unread > 0 && (
                <span className="bg-lasa-silver-light text-lasa-navy absolute top-1 right-1 flex size-4 items-center justify-center rounded-full text-[10px] font-bold">
                  {unread}
                </span>
              )}
            </button>
            {showBell && (
              <div className="absolute right-0 z-30 mt-2 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-800">
                  Latest on the bulletin
                </div>
                {latest.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-slate-500">Nothing yet.</p>
                ) : (
                  latest.map((post) => (
                    <button
                      key={post.id}
                      onClick={() => {
                        setShowBell(false)
                        navigate(`/bulletin#post-${post.id}`)
                      }}
                      className="flex w-full cursor-pointer items-start gap-2.5 px-4 py-2.5 text-left hover:bg-slate-50"
                    >
                      <span className={`mt-1.5 size-2 shrink-0 rounded-full ${categoryStyle(post.category).dot}`} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-medium text-slate-800">{post.title}</span>
                        <span className="block text-xs text-slate-500">
                          {categoryStyle(post.category).label} · {formatNoteTime(new Date(post.created_at))}
                        </span>
                      </span>
                    </button>
                  ))
                )}
                <button
                  onClick={() => {
                    setShowBell(false)
                    navigate('/bulletin')
                  }}
                  className="text-sea-teal w-full cursor-pointer border-t border-slate-200 px-4 py-2 text-center text-sm font-medium hover:bg-slate-50"
                >
                  Open the bulletin
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="relative" ref={profileMenuRef}>
          <div
            onClick={() => setShowProfileMenu((prev) => !prev)}
            className="flex h-10 cursor-pointer items-center gap-3 rounded-full px-1 transition-colors duration-200 hover:bg-lasa-white/10"
          >
            <div className="bg-lasa-silver-light text-lasa-navy flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold">
              {profileName ? profileName.charAt(0).toUpperCase() : '?'}
            </div>
            <span className="mr-2 text-sm font-medium whitespace-nowrap text-lasa-white">
              {profileName || 'Loading...'}
            </span>
          </div>

          {showProfileMenu && (
            <div className="absolute right-0 z-20 mt-2 w-40 overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
              <button
                onClick={handleLogout}
                className="flex w-full cursor-pointer items-center gap-2 px-3 py-2 text-left text-sm text-slate-700 hover:bg-slate-100"
              >
                <FontAwesomeIcon icon={faRightFromBracket} />
                Log out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

function MenuItem({
  icon,
  title,
  hint,
  onClick,
}: {
  icon: IconDefinition
  title: string
  hint: string
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full cursor-pointer items-start gap-3 px-4 py-2.5 text-left hover:bg-slate-50"
    >
      <FontAwesomeIcon icon={icon} className="text-sea-teal mt-1 w-4" />
      <span>
        <span className="block text-sm font-medium text-slate-800">{title}</span>
        <span className="block text-xs text-slate-500">{hint}</span>
      </span>
    </button>
  )
}
