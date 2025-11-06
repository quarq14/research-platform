import { NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

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

  if (profile?.plan !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const [{ count: totalUsers }, { count: totalDocuments }, { count: totalFiles }, { count: totalChats }] =
    await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("documents").select("*", { count: "exact", head: true }),
      supabase.from("files").select("*", { count: "exact", head: true }),
      supabase.from("chats").select("*", { count: "exact", head: true }),
    ])

  return NextResponse.json({
    totalUsers: totalUsers || 0,
    totalDocuments: totalDocuments || 0,
    totalFiles: totalFiles || 0,
    totalChats: totalChats || 0,
  })
}
