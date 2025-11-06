export const dynamic = "force-dynamic"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"

export default async function SettingsPage() {
  const supabase = await createServerClient()
  if (!supabase) {
    redirect("/auth/login")
  }

  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) {
    redirect("/auth/login")
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single()

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Settings</h1>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile Information</CardTitle>
              <CardDescription>Update your account details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="email">Email</Label>
                <Input id="email" type="email" value={user.email || ""} disabled />
              </div>
              <div>
                <Label htmlFor="plan">Current Plan</Label>
                <Input id="plan" value={profile?.plan || "free"} disabled />
              </div>
              <Button>Update Profile</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>API Keys</CardTitle>
              <CardDescription>Manage your API integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="groq">Groq API Key (Optional)</Label>
                <Input id="groq" type="password" placeholder="Enter your Groq API key" />
                <p className="text-sm text-gray-500 mt-1">Add your own Groq API key for unlimited AI features</p>
              </div>
              <Button>Save API Keys</Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Usage Statistics</CardTitle>
              <CardDescription>Your current usage this month</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-500">Documents Created</p>
                  <p className="text-2xl font-bold">{profile?.documents_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Pages Uploaded</p>
                  <p className="text-2xl font-bold">{profile?.pages_uploaded || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Searches</p>
                  <p className="text-2xl font-bold">{profile?.searches_count || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Words Written</p>
                  <p className="text-2xl font-bold">{profile?.words_count || 0}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
