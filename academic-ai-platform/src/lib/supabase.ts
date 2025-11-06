import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Supabase URL ve Anon Key gerekli!')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database Types
export type Profile = {
  id: string
  name: string | null
  locale: string
  plan: string
  created_at: string
  updated_at: string
  word_count_used: number
  documents_used: number
  pages_uploaded: number
  searches_used: number
}

export type Document = {
  id: string
  user_id: string
  title: string
  content: string | null
  language: string
  type: string
  status: string
  created_at: string
  updated_at: string
}

export type File = {
  id: string
  user_id: string
  document_id: string | null
  storage_path: string
  original_name: string
  mime_type: string | null
  file_size: number | null
  pages: number
  status: string
  created_at: string
}
