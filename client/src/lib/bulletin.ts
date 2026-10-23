import { useCallback, useEffect, useState } from 'react'

import { supabase } from '@/lib/supabase'
import { toDateKey } from '@/lib/school'
import type { PostType } from '@/types'

// Pinned posts first, then newest first
export function sortPosts(posts: PostType[]) {
  return [...posts].sort((a, b) => {
    if (!!a.pinned !== !!b.pinned) return a.pinned ? -1 : 1
    return b.created_at.localeCompare(a.created_at)
  })
}

// Posts tied to a date that hasn't passed yet, soonest first
export function upcomingEvents(posts: PostType[], limit?: number) {
  const today = toDateKey(new Date())
  const upcoming = posts
    .filter((p) => p.event_date && p.event_date >= today)
    .sort((a, b) => a.event_date!.localeCompare(b.event_date!))
  return limit ? upcoming.slice(0, limit) : upcoming
}

async function attachAuthors(posts: PostType[]): Promise<PostType[]> {
  const ids = [...new Set(posts.map((p) => p.user_id))]
  if (ids.length === 0) return posts
  const { data } = await supabase.from('profiles').select('id, display_name').in('id', ids)
  const names = new Map(data?.map((p) => [p.id, p.display_name]))
  return posts.map((p) => ({ ...p, author: names.get(p.user_id) ?? p.author }))
}

// Loads every bulletin post; `reload` re-fetches after a change
export function useBulletin() {
  const [posts, setPosts] = useState<PostType[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const reload = useCallback(async () => {
    const { data, error } = await supabase
      .from('bulletin')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(100)
    if (error) {
      setError(error.message)
    } else {
      setPosts(sortPosts(await attachAuthors(data ?? [])))
      setError(null)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    reload()
    // Lets the header's "New announcement" refresh any open bulletin view
    window.addEventListener('bulletin-changed', reload)
    return () => window.removeEventListener('bulletin-changed', reload)
  }, [reload])

  return { posts, loading, error, reload }
}

export function announceBulletinChange() {
  window.dispatchEvent(new Event('bulletin-changed'))
}

export type NewPost = {
  title: string
  description: string
  category: 'School' | 'Club' | 'Event'
  pinned: boolean
  event_date: string | null
  event_time: string | null
  location: string | null
}

export async function createPost(userId: string, post: NewPost) {
  const { error } = await supabase.from('bulletin').insert({ user_id: userId, ...post })
  if (error) throw new Error(error.message)
  announceBulletinChange()
}

export async function deletePost(id: number) {
  const { error } = await supabase.from('bulletin').delete().eq('id', id)
  if (error) throw new Error(error.message)
  announceBulletinChange()
}

export async function setPinned(id: number, pinned: boolean) {
  const { error } = await supabase.from('bulletin').update({ pinned }).eq('id', id)
  if (error) throw new Error(error.message)
  announceBulletinChange()
}

// "Oct 24" style label, plus "Today" / "Tomorrow"
export function formatEventDay(dateKey: string) {
  const today = new Date()
  const tomorrow = new Date()
  tomorrow.setDate(today.getDate() + 1)
  if (dateKey === toDateKey(today)) return 'Today'
  if (dateKey === toDateKey(tomorrow)) return 'Tomorrow'
  return new Date(`${dateKey}T12:00:00`).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })
}
