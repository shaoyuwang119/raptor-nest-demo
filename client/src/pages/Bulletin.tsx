import { use, useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'

import { NoteCard, ErrorDisplay, Loading, Post } from '@/components'
import { useProfile, useSession } from '@/components/auth/ProtectedRoute'

import { supabase } from '@/lib/supabase'
import type { PostType } from '@/types'
import { usePageTitle } from '@/lib/usePageTitle'
import { useSavedNotes } from '@/lib/useSavedNotes'
import { resolveAuthors } from '@/lib/resolveAuthors'
import { getCategoryColor } from '@/lib/categoryColors'
import { formatNoteTime } from '@/lib/formatNoteTime'

function Bulletin() {
  usePageTitle('Bulletin Posts | StudyNote')
  const [posts, setPosts] = useState<PostType[]>([])

  useEffect(() => {
    const fetchPosts = async () => {
      try {
        const { data, error } = await supabase
          .from('bulletin')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(30)
        if (error) throw error
        console.log('Fetched posts:', data)
        setPosts(data)
      } catch (error) {
        console.error('Error fetching posts:', error)
      }
    }
    fetchPosts()
  }, [])

  return (
    <div className="flex h-full min-w-0 flex-1">
      <div className="journal-paper min-w-0 flex-1 scrollbar-thin scrollbar-thumb-slate-300 scrollbar-gutter-stable overflow-y-auto py-8 pr-8 pl-20">
        <header className="mb-10">
          <h1 className="font-serif text-4xl font-medium text-slate-800">
            Bulletin Posts
          </h1>
        </header>
        {posts.length === 0 ? (
          <p className="text-slate-500">No posts available.</p>
        ) : (
          <div className="space-y-6">
            {posts.map((post) => (
              <Post key={post.id} post={post} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default Bulletin
