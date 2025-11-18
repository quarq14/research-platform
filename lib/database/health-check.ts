import type { SupabaseClient } from "@supabase/supabase-js"

import type { Database } from "@/lib/supabase/types"
import { getServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/service-role"

const REQUIRED_TABLES: Array<keyof Database["public"]["Tables"]> = [
  "profiles",
  "user_settings",
  "api_keys",
  "projects",
  "documents",
  "files",
  "chunks",
  "chats",
  "messages",
  "sources",
  "citations",
  "plans",
  "subscriptions",
  "invoices",
  "usage_events",
  "rate_limits",
  "audit_logs",
  "organizations",
  "memberships",
]

export interface DatabaseHealth {
  checkedAt: string
  config: {
    url: boolean
    anonKey: boolean
    serviceRoleKey: boolean
  }
  connectivity: {
    ok: boolean
    message: string
  }
  tables: {
    checked: number
    missing: string[]
  }
  storage: {
    pdfBucket: boolean
    error?: string
  }
}

async function tableExists(client: SupabaseClient<Database>, table: keyof Database["public"]["Tables"]) {
  try {
    const { error } = await client.from(table).select("*", { head: true }).limit(1)
    if (error) {
      if ((error as { code?: string }).code === "42P01") {
        return false
      }
      throw error
    }
    return true
  } catch (error) {
    console.error(`[db] Table check failed for ${table}:`, error)
    return false
  }
}

export async function getDatabaseHealth(): Promise<DatabaseHealth> {
  const config = {
    url: Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL),
    anonKey: Boolean(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY),
    serviceRoleKey: Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY),
  }

  const health: DatabaseHealth = {
    checkedAt: new Date().toISOString(),
    config,
    connectivity: {
      ok: false,
      message: "",
    },
    tables: {
      checked: 0,
      missing: [],
    },
    storage: {
      pdfBucket: false,
    },
  }

  if (!config.url || !config.anonKey) {
    health.connectivity.message = "Supabase URL or anon key missing"
    return health
  }

  if (!isServiceRoleConfigured()) {
    health.connectivity.message = "Service role key not configured"
    return health
  }

  const client = getServiceRoleClient()

  if (!client) {
    health.connectivity.message = "Unable to initialize service role client"
    return health
  }

  try {
    const { error } = await client.from("profiles").select("id", { head: true }).limit(1)
    if (error) {
      throw error
    }
    health.connectivity = {
      ok: true,
      message: "Connected successfully",
    }
  } catch (error) {
    health.connectivity = {
      ok: false,
      message: error instanceof Error ? error.message : "Connection test failed",
    }
  }

  const tableResults = await Promise.all(REQUIRED_TABLES.map(async (table) => ({
    table,
    exists: await tableExists(client, table),
  })))

  health.tables = {
    checked: tableResults.length,
    missing: tableResults.filter((result) => !result.exists).map((result) => result.table),
  }

  try {
    const { data, error } = await client.storage.listBuckets()
    if (error) {
      throw error
    }
    health.storage.pdfBucket = Boolean(data?.some((bucket) => bucket.name === "pdfs"))
  } catch (error) {
    health.storage.error = error instanceof Error ? error.message : "Storage check failed"
  }

  return health
}
