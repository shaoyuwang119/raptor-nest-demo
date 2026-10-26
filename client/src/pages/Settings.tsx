import { useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faMoon, faRotateLeft, faSun } from '@fortawesome/free-solid-svg-icons'

import { NestLogo, Title } from '@/components'
import { useProfile } from '@/components/auth/ProtectedRoute'
import { isDemo } from '@/lib/supabase'
import { SCHOOL } from '@/lib/school'
import { usePageTitle } from '@/lib/usePageTitle'

function Card({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="journal-card border border-slate-200 p-6">
      <h2 className="mb-4 font-serif text-xl font-medium text-slate-800">{title}</h2>
      {children}
    </section>
  )
}

// Same switch the sidebar uses; tells the sidebar so its toggle stays in sync
export function setTheme(dark: boolean) {
  const root = document.documentElement
  root.classList.add('theme-transitioning')
  root.classList.toggle('dark', dark)
  try {
    localStorage.setItem('theme', dark ? 'dark' : 'light')
  } catch {
    /* theme still applies for this visit */
  }
  window.dispatchEvent(new Event('theme-changed'))
  requestAnimationFrame(() =>
    requestAnimationFrame(() => root.classList.remove('theme-transitioning'))
  )
}

function Settings() {
  usePageTitle(`Settings | ${SCHOOL.appName}`)
  const profile = useProfile()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))

  function pickTheme(next: boolean) {
    setDark(next)
    setTheme(next)
  }

  async function reset() {
    if (!window.confirm('Reset the demo? Your posts, uploads and to-dos will be cleared.')) return
    const { resetDemo } = await import('@/lib/demo/store')
    resetDemo()
  }

  return (
    <div className="journal-paper h-full min-w-0 flex-1 overflow-y-auto py-8 pr-8 pl-20">
      <Title title="Settings" description="Your account, appearance, and info about the app" />

      <div className="flex max-w-2xl flex-col gap-6 pb-10">
        <Card title="Account">
          <dl className="grid grid-cols-[8rem_1fr] gap-y-2 text-sm">
            <dt className="text-slate-500">Name</dt>
            <dd className="text-slate-800">{profile.name || '—'}</dd>
            <dt className="text-slate-500">Email</dt>
            <dd className="text-slate-800">{profile.email || '—'}</dd>
            <dt className="text-slate-500">Role</dt>
            <dd className="text-slate-800">
              {profile.isAdmin ? 'Admin (can post announcements)' : 'Student'}
            </dd>
          </dl>
          <Link to="/profile" className="text-sea-teal mt-4 inline-block text-sm font-medium hover:underline">
            Edit your profile and classes →
          </Link>
        </Card>

        <Card title="Appearance">
          <div className="flex gap-3">
            {[
              { value: false, label: 'Light', icon: faSun },
              { value: true, label: 'Dark', icon: faMoon },
            ].map((opt) => (
              <button
                key={opt.label}
                onClick={() => pickTheme(opt.value)}
                className={`flex flex-1 cursor-pointer items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-medium transition ${
                  dark === opt.value
                    ? 'border-sea-teal bg-sea-sky text-sea-teal-dark ring-sea-teal/30 ring-2'
                    : 'border-slate-300 bg-white text-slate-600 hover:border-slate-400'
                }`}
              >
                <FontAwesomeIcon icon={opt.icon} />
                {opt.label}
              </button>
            ))}
          </div>
        </Card>

        {isDemo && (
          <Card title="Demo">
            <p className="text-sm text-slate-600">
              This is a demo with sample data. Anything you post, upload or check off is saved only in
              this browser. Reset to start over with the original sample data.
            </p>
            <button
              onClick={reset}
              className="mt-4 flex cursor-pointer items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:border-red-300 hover:text-red-700"
            >
              <FontAwesomeIcon icon={faRotateLeft} />
              Reset demo data
            </button>
          </Card>
        )}

        <Card title={`About ${SCHOOL.appName}`}>
          <div className="flex gap-5">
            <NestLogo className="text-sea-navy h-20" />
            <div className="text-sm leading-relaxed text-slate-600">
              <p>
                {SCHOOL.appName} is the home page {SCHOOL.schoolName} lost: announcements, club news,
                upcoming dates, your to-dos, and shared class notes in one place.
              </p>
              <p className="mt-2">
                Built by {SCHOOL.schoolName} students Clint Lee and Shaoyu Wang for the 2026
                Congressional App Challenge.
              </p>
              <p className="mt-2 text-xs text-slate-500">
                A student-made project. Not an official {SCHOOL.schoolName} or {SCHOOL.district} website.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}

export default Settings
