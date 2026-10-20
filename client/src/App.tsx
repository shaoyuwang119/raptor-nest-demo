import { createBrowserRouter, RouterProvider } from 'react-router-dom'
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

const router = createBrowserRouter([
  // Public routes
  { path: '/login', element: <Login /> },

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
