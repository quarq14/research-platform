import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { checkUsageLimit } from "@/lib/usage-tracker"

export async function GET() {
  const supabase = await createServerClient()
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 })
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single()

  const usageData = await checkUsageLimit(user.id, profile?.plan || "free")

  return NextResponse.json(usageData)
}
