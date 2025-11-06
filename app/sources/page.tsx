import { redirect } from "next/navigation"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { AcademicSearch } from "@/components/academic-search"
import { SetupRequired } from "@/components/setup-required"

export const dynamic = "force-dynamic"

export default async function SourcesPage() {
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
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AcademicSearch userId={user.id} />
      </main>
    </div>
  )
}
