import { redirect } from "next/navigation"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { ChatInterface } from "@/components/chat-interface"
import { SetupRequired } from "@/components/setup-required"

export const dynamic = "force-dynamic"

export default async function ChatPage() {
  if (!isSupabaseConfigured()) {
    return <SetupRequired />
  }

  const supabase = await createClient()

  if (!supabase) {
    return <SetupRequired />
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()
  if (error || !user) {
    redirect("/auth/login")
  }

  // Load user files
  const { data: files } = await supabase
    .from("files")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "completed")
    .order("created_at", { ascending: false })

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <ChatInterface userId={user.id} initialFiles={files || []} />
    </div>
  )
}
