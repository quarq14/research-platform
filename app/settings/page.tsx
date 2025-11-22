export const dynamic = "force-dynamic"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { AISettings } from "@/components/ai-settings"
import { AIModelSettings } from "@/components/ai-model-settings"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default async function SettingsPage() {
  const supabase = await createServerClient()

  let user = null
  let profile = null

  // Allow access without authentication for local development
  if (supabase) {
    const {
      data: { user: authUser },
    } = await supabase.auth.getUser()
    user = authUser

    if (user) {
      const { data: profileData } = await supabase.from("profiles").select("*").eq("id", user.id).single()
      profile = profileData
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-purple-900 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Settings
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Manage your account, AI preferences, and integrations</p>
        </div>

        <Tabs defaultValue="ai-models" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="ai-models">AI Models</TabsTrigger>
            <TabsTrigger value="ai">Legacy AI</TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="usage">Usage</TabsTrigger>
          </TabsList>

          <TabsContent value="ai-models">
            <AIModelSettings />
          </TabsContent>

          <TabsContent value="ai">
            <AISettings />
          </TabsContent>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>Profile Information</CardTitle>
                <CardDescription>Update your account details</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={user?.email || "guest@local.dev"} disabled />
                </div>
                <div>
                  <Label htmlFor="plan">Current Plan</Label>
                  <Input id="plan" value={profile?.plan || "free"} disabled />
                </div>
                {user ? (
                  <Button>Update Profile</Button>
                ) : (
                  <p className="text-sm text-gray-500">Login to update your profile</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="usage">
            <Card>
              <CardHeader>
                <CardTitle>Usage Statistics</CardTitle>
                <CardDescription>Your current usage this month</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900 dark:to-blue-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Documents Created</p>
                    <p className="text-3xl font-bold text-blue-600 dark:text-blue-400">{profile?.documents_count || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900 dark:to-purple-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Pages Uploaded</p>
                    <p className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                      {profile?.pages_uploaded || 0}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900 dark:to-green-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Searches</p>
                    <p className="text-3xl font-bold text-green-600 dark:text-green-400">{profile?.searches_count || 0}</p>
                  </div>
                  <div className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900 dark:to-orange-800 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Words Written</p>
                    <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{profile?.words_count || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
