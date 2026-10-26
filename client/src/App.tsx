import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom'
import { ProtectedRoute } from '@/components'

import {
  Explore,
  Home,
  Library,
  Login,
  NoteEditPage,
  NotePage,
  NotFound,
  Profile,
  Saved,
  Search,
  Settings,
  Bulletin,
} from '@/pages'
import { isDemo } from '@/lib/supabase'

const router = createBrowserRouter([
  // Public routes
  // The demo has no accounts, so the login page just leads to the dashboard
  { path: '/login', element: isDemo ? <Navigate to="/" replace /> : <Login /> },

  // Protected routes
  {
    element: <ProtectedRoute />,
    children: [
      { path: '/', element: <Home /> },
      { path: '/explore', element: <Explore /> },
      { path: '/profile', element: <Profile /> },
      { path: '/library', element: <Library /> },
      { path: '/saved', element: <Saved /> },
      { path: '/notes/:id/edit', element: <NoteEditPage /> },
      { path: '/notes/:id', element: <NotePage /> },
      { path: '/search', element: <Search /> },
      { path: '/settings', element: <Settings /> },
      { path: '/bulletin', element: <Bulletin /> },
      { path: '*', element: <NotFound /> },
    ],
  },
])

function App() {
  return <RouterProvider router={router} />
}

export default App
