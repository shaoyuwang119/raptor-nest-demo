export type Subject = {
  id: number
  name: string
  category: string
}

export type Note = {
  id: number
  user_id: string
  title: string
  subject_id: number
  subject?: Subject | null
  description: string
  author?: string // display name of the author
  content_url: string
  preview_url?: string
  saves: number
  created_at: string
  updated_at: string
}

export type PostType = {
  id: number
  user_id: string
  title: string
  description: string
  image_url?: string | null
  author?: string // display name of the author
  category?: 'School' | 'Club' | 'Event' | null
  pinned?: boolean | null
  event_date?: string | null // 'YYYY-MM-DD' - set for anything happening on a specific day
  event_time?: string | null // free text, e.g. '3:45 PM' or 'Lunch'
  location?: string | null
  created_at: string
}

export type Todo = {
  id: number
  user_id: string
  title: string
  due_date?: string | null // 'YYYY-MM-DD'
  done: boolean
  created_at: string
}
