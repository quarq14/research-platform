import type React from "react"
import { redirect } from "next/navigation"
import { createClient, isSupabaseConfigured } from "@/lib/supabase/server"
import { Card } from "@/components/ui/card"
import { FileText, Upload, Search, BookOpen, CheckCircle, MessageSquare } from "lucide-react"
import Link from "next/link"
import { SetupRequired } from "@/components/setup-required"

export const dynamic = "force-dynamic"

export default async function DashboardPage() {
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

  // Load profile
  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-gray-50">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Welcome, {profile?.full_name || user.email}!</h2>
          <p className="text-gray-600">Your academic writing and research platform</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Documents</div>
            <div className="text-3xl font-bold text-blue-600">{profile?.documents_used || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Pages Uploaded</div>
            <div className="text-3xl font-bold text-green-600">{profile?.pages_analyzed || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Word Count</div>
            <div className="text-3xl font-bold text-purple-600">{profile?.tokens_used || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">Searches</div>
            <div className="text-3xl font-bold text-orange-600">{profile?.searches_used || 0}</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            title="Upload & Analyze PDFs"
            description="Upload PDF files and chat with AI"
            Icon={Upload}
            href="/upload"
            active
          />
          <FeatureCard
            title="PDF Chat"
            description="Chat with your PDF documents using AI"
            Icon={MessageSquare}
            href="/chat"
            active
          />
          <FeatureCard
            title="Academic Writing"
            description="Write articles and documents with AI assistance"
            Icon={FileText}
            href="/write"
            active
          />
          <FeatureCard
            title="Literature Search"
            description="Search and manage academic sources"
            Icon={Search}
            href="/sources"
            active
          />
          <FeatureCard
            title="Citation Manager"
            description="Create citations in APA, MLA, Chicago formats"
            Icon={BookOpen}
            href="/citations"
            active
          />
          <FeatureCard
            title="Writing Tools"
            description="Plagiarism check, AI detection, paraphrasing"
            Icon={CheckCircle}
            href="/tools"
            active
          />
        </div>

        {/* Profile Info */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Email:</span>
              <span className="font-medium">{user.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Plan:</span>
              <span className="font-medium uppercase">{profile?.plan || "FREE"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Language:</span>
              <span className="font-medium uppercase">{profile?.locale || "EN"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Member Since:</span>
              <span className="font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString("en-US") : "-"}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function FeatureCard({
  title,
  description,
  Icon,
  status,
  href,
  active,
}: {
  title: string
  description: string
  Icon: React.ComponentType<{ className?: string }>
  status?: string
  href?: string
  active?: boolean
}) {
  const content = (
    <>
      <Icon className="w-10 h-10 text-blue-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {status && (
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">{status}</span>
      )}
      {active && !status && (
        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">✓ Active</span>
      )}
    </>
  )

  if (active && href) {
    return (
      <Link href={href}>
        <Card className="p-6 transition-all hover:shadow-lg cursor-pointer hover:scale-105">{content}</Card>
      </Link>
    )
  }

  return <Card className="p-6 opacity-75">{content}</Card>
}
