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
  created_at: string
}
