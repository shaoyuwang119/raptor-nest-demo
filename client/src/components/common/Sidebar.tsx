import { NavLink, useNavigate, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import {
  faBookBookmark,
  faGear,
  faHouse,
  faCompass,
  faRightFromBracket,
  faBookOpen,
  faSun,
  faMoon,
  faCircleUser,
} from '@fortawesome/free-solid-svg-icons'

import { supabase } from '@/lib/supabase'
import type { Profile } from '@/components/auth/ProtectedRoute'

type SidebarItem = {
  label: string
  page: string
  icon: typeof faHouse
}

type SidebarProps = {
  profile: Profile
}

const sidebarItems: SidebarItem[] = [
  { label: 'Home', page: '/', icon: faHouse },
  { label: 'Explore', page: '/explore', icon: faCompass },
  { label: 'Library', page: '/library', icon: faBookOpen },
  { label: 'Settings', page: '/settings', icon: faGear },
]

function Sidebar({ profile }: SidebarProps) {
  const navigate = useNavigate()
  const location = useLocation()
  const [isHovered, setIsHovered] = useState(false)
  const [isProfileHovered, setIsProfileHovered] = useState(false)

  const canMinimize = location.pathname.startsWith('/notes/')
  const isMinimized = canMinimize && !isHovered

  const [isDarkMode, setIsDarkMode] = useState(() =>
    document.documentElement.classList.contains('dark')
  )

  function toggleTheme() {
    const root = document.documentElement
    const next = !isDarkMode

    // Momentarily disable every transition in the app so nothing gets stuck
    // mid-transition when the sea-*/slate-*/white variables swap under
    // .dark - then re-enable once the new colors have actually painted.
    root.classList.add('theme-transitioning')
    root.classList.toggle('dark', next)
    localStorage.setItem('theme', next ? 'dark' : 'light')
    setIsDarkMode(next)

    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        root.classList.remove('theme-transitioning')
      })
    })
  }

  const handleLogout = async () => {
    await supabase.auth.signOut()
    navigate('/login')
  }

  return (
    <div
      onMouseLeave={() => setIsHovered(false)}
      className={`h-[calc(100vh-4rem)] shrink-0 ${canMinimize ? 'w-16' : `w-56`} transition-all duration-200`}
    >
      <aside
        className={`journal-binding fixed top-16 z-20 flex h-[calc(100vh-4rem)] shrink-0 flex-col overflow-hidden border-r border-slate-200 bg-white px-3 py-5 text-nowrap transition-all duration-200 ${
          isMinimized ? 'w-16' : canMinimize ? `w-60 shadow-lg` : `w-60`
        } `}
      >
        {/* Name label on the notebook's cover */}
        <NavLink
          to="/profile"
          title="Profile"
          onMouseEnter={() => {
            setIsHovered(true)
            setIsProfileHovered(true)
          }}
          onMouseLeave={() => setIsProfileHovered(false)}
          className="group flex items-center gap-3 rounded-md px-0.5 py-1 transition-colors duration-200"
        >
          {({ isActive }) => (
            <>
              <span
                className={`bg-sea-sky text-sea-teal-dark flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-sm font-semibold transition-shadow ${
                  isActive
                    ? 'ring-sea-teal ring-2 ring-offset-2 ring-offset-white'
                    : ''
                }`}
              >
                {profile.name ? (
                  profile.name.charAt(0).toUpperCase()
                ) : (
                  <FontAwesomeIcon icon={faCircleUser} />
                )}
              </span>

              <div
                className={`min-w-0 overflow-hidden whitespace-nowrap transition-opacity duration-100 ${
                  isMinimized ? 'opacity-0' : 'opacity-100'
                }`}
              >
                <div className="font-hand text-base leading-none text-slate-400">
                  this notebook belongs to
                </div>
                <div className="truncate font-serif text-[15px] text-slate-800">
                  <span
                    className={
                      isActive
                        ? 'journal-highlight'
                        : 'decoration-sea-teal-light underline-offset-4 group-hover:underline'
                    }
                  >
                    {profile.name || 'Profile'}
                  </span>
                </div>
              </div>
            </>
          )}

          {/* {isProfileHovered && !isMinimized && (
            <button
              onClick={async (e) => {
                e.stopPropagation()
                await handleLogout()
              }}
              title="Log out"
              className="ml-auto flex shrink-0 items-center justify-center rounded-full text-slate-500 hover:bg-slate-200 hover:text-slate-900"
            >
              <FontAwesomeIcon icon={faRightFromBracket} size="sm" />
            </button>
          )} */}
        </NavLink>

        <hr className="my-4 border-dashed border-slate-300" />

        <div
          className={`font-hand mb-1 px-2 text-lg leading-none text-slate-400 transition-opacity duration-100 ${
            isMinimized ? 'opacity-0' : 'opacity-100'
          }`}
        >
          contents
        </div>

        <nav onMouseEnter={() => setIsHovered(true)} className="space-y-0.5">
          {sidebarItems.map((item) => (
            <NavLink
              key={item.page}
              to={item.page}
              title={item.label}
              className={({ isActive }) =>
                // Active page gets a ribbon bookmark poking out of the left edge
                `relative flex h-10 items-center gap-4 rounded-md px-2 py-2 transition-colors duration-200 before:absolute before:top-2 before:bottom-2 before:-left-3 before:w-1 before:rounded-r before:transition-opacity ${
                  isActive
                    ? 'before:bg-sea-teal text-slate-900 before:opacity-100'
                    : 'text-slate-600 before:opacity-0 hover:bg-slate-100 hover:text-slate-900'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <FontAwesomeIcon
                    size="lg"
                    icon={item.icon}
                    className={`-ml-1 w-4 shrink-0 transition-colors ${
                      isActive ? 'text-sea-teal' : ''
                    }`}
                  />
                  <span
                    className={`overflow-hidden font-serif text-[15px] whitespace-nowrap transition-opacity duration-100 ${
                      isMinimized ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    <span className={isActive ? 'journal-highlight' : ''}>
                      {item.label}
                    </span>
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={toggleTheme}
          title="Toggle light/dark theme"
          className="mt-auto flex h-10 w-full cursor-pointer items-center gap-4 border-t border-dashed border-slate-300 px-2 pt-3 pb-2 font-serif text-[15px] text-slate-600 transition-colors duration-100 hover:text-slate-900"
        >
          <FontAwesomeIcon
            size="lg"
            icon={isDarkMode ? faMoon : faSun}
            className="w-4 shrink-0"
          />
          <span
            className={`flex-1 overflow-hidden text-left whitespace-nowrap transition-opacity duration-100 ${
              isMinimized ? 'opacity-0' : 'opacity-100'
            }`}
          >
            Theme
          </span>
          <span
            className={`relative h-5 w-9 shrink-0 rounded-full transition-all duration-200 ${
              isDarkMode ? 'bg-sea-teal' : 'bg-slate-300'
            } ${isMinimized ? 'opacity-0' : 'opacity-100'}`}
          >
            <span
              className={`absolute top-0.5 left-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform duration-200 ${
                isDarkMode ? 'translate-x-4' : 'translate-x-0'
              }`}
            />
          </span>
        </button>
      </aside>
    </div>
  )
}

export default Sidebar
