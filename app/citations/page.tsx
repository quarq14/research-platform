export const dynamic = "force-dynamic"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { SetupRequired } from "@/components/setup-required"
import { CitationManager } from "@/components/citation-manager"

export default async function CitationsPage() {
  const supabase = await createServerClient()

  if (!supabase) {
    return <SetupRequired />
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/login")
  }

  const { data: sources } = await supabase
    .from("sources")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Citation Manager</h1>
        <p className="text-gray-600">Manage your sources and generate citations in APA, MLA, and Chicago styles</p>
      </div>

      <CitationManager initialSources={sources || []} userId={user.id} />
    </div>
  )
}
