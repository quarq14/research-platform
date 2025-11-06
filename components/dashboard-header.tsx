"use client"

import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { BookOpen, LogOut, Settings } from "lucide-react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"
import type { User } from "@supabase/supabase-js"

export function DashboardHeader({ user }: { user: User }) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleSignOut = async () => {
    setIsLoading(true)
    const supabase = createClient()
    if (supabase) {
      await supabase.auth.signOut()
    }
    router.push("/auth/login")
    router.refresh()
  }

  return (
    <header className="bg-white shadow-sm border-b sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
        <Link href="/dashboard" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <BookOpen className="h-6 w-6 text-blue-600" />
          <h1 className="text-2xl font-bold text-gray-900">Academic AI</h1>
        </Link>

        <nav className="hidden md:flex items-center gap-6">
          <Link href="/dashboard" className="text-gray-600 hover:text-gray-900 transition-colors">
            Dashboard
          </Link>
          <Link href="/upload" className="text-gray-600 hover:text-gray-900 transition-colors">
            Upload
          </Link>
          <Link href="/chat" className="text-gray-600 hover:text-gray-900 transition-colors">
            Chat
          </Link>
          <Link href="/write" className="text-gray-600 hover:text-gray-900 transition-colors">
            Write
          </Link>
          <Link href="/sources" className="text-gray-600 hover:text-gray-900 transition-colors">
            Sources
          </Link>
          <Link href="/tools" className="text-gray-600 hover:text-gray-900 transition-colors">
            Tools
          </Link>
          <Link href="/pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
            Pricing
          </Link>
        </nav>

        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" asChild>
            <Link href="/settings">
              <Settings className="w-4 h-4 mr-2" />
              Settings
            </Link>
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut} disabled={isLoading}>
            <LogOut className="w-4 h-4 mr-2" />
            {isLoading ? "Signing out..." : "Sign Out"}
          </Button>
        </div>
      </div>
    </header>
  )
}
