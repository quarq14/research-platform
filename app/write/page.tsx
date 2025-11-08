import { redirect } from "next/navigation"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { AIWritingWorkspace } from "@/components/ai-writing/advanced-writing-workspace"
import { SetupRequired } from "@/components/setup-required"

export const dynamic = "force-dynamic"

export default async function WritePage() {
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100">
      <main className="container mx-auto px-4 py-8">
        <AIWritingWorkspace userId={user.id} />
      </main>
    </div>
  )
}
