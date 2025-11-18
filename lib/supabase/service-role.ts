import { createClient, type SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "./types"

let serviceClient: SupabaseClient<Database> | null = null

function getConfig() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
  }
}

export function isServiceRoleConfigured() {
  const { url, serviceRoleKey } = getConfig()
  return Boolean(url && serviceRoleKey)
}

export function getServiceRoleClient() {
  if (typeof window !== 'undefined') {
    console.warn("[db] Service role client should only be used server-side")
    return null
  }

  if (!isServiceRoleConfigured()) {
    return null
  }

  if (!serviceClient) {
    const { url, serviceRoleKey } = getConfig()
    serviceClient = createClient<Database>(url!, serviceRoleKey!, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    })
  }

  return serviceClient
}
