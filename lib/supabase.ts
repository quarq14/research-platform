import { createBrowserClient } from "@supabase/ssr"

let supabaseInstance: ReturnType<typeof createBrowserClient> | null = null
let initializationAttempted = false

export function isSupabaseConfigured(): boolean {
  if (typeof window === "undefined") return false

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  return !!(url && key)
}

export function getSupabase() {
  if (typeof window === "undefined") {
    return null
  }

  if (!initializationAttempted) {
    initializationAttempted = true

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !key) {
      console.warn(
        "[v0] Supabase is not configured. Please add NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables.",
      )
      supabaseInstance = null
      return null
    }

    try {
      supabaseInstance = createBrowserClient(url, key)
    } catch (error) {
      console.error("[v0] Failed to create Supabase client:", error)
      supabaseInstance = null
    }
  }

  return supabaseInstance
}

export const supabase = null
