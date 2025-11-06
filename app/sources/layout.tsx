import type React from "react"
import { DashboardHeader } from "@/components/dashboard-header"
import { createClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"

export const dynamic = "force-dynamic"

export default async function SourcesLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()

  if (!supabase) {
    redirect("/auth/login")
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser()

  if (error || !user) {
    redirect("/auth/login")
  }

  return (
    <>
      <DashboardHeader user={user} />
      {children}
    </>
  )
}
