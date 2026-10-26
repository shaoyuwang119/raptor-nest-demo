import { Link } from 'react-router-dom'

import { usePageTitle } from '@/lib/usePageTitle'

function NotFound() {
  usePageTitle('404 Not Found | The Raptor Nest')
  return (
    <div className="journal-paper flex h-full min-w-0 flex-1 items-center gap-12 py-8 pr-8 pl-20">
      <div>
      <p className="font-serif text-7xl font-medium text-slate-800">404</p>
      <p className="font-hand text-sea-teal mt-2 w-fit -rotate-1 text-2xl">
        This raptor looked everywhere. Nothing here.
      </p>
      <Link
        to="/"
        className="decoration-sea-teal-light hover:text-sea-teal mt-6 w-fit text-sm text-slate-600 underline underline-offset-4 transition-colors"
      >
        Back to home
      </Link>
      </div>
      <img src="/brand/raptor.png" alt="" className="hidden w-64 -scale-x-100 opacity-90 md:block" />
    </div>
  )
}

export default NotFound
