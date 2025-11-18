export const dynamic = "force-dynamic"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, FileText, DollarSign, Activity, Database } from "lucide-react"
import { getDatabaseHealth } from "@/lib/database/health-check"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default async function AdminPage() {
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

  if (!profile || profile.role !== "admin") {
    redirect("/dashboard")
  }

  const [usersResult, documentsResult, subscriptionsResult, databaseHealth] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact" }),
    supabase.from("documents").select("*", { count: "exact" }),
    supabase.from("subscriptions").select("*").eq("status", "active"),
    getDatabaseHealth(),
  ])

  const totalUsers = usersResult.count || 0
  const totalDocuments = documentsResult.count || 0
  const activeSubscriptions = subscriptionsResult.data?.length || 0
  const monthlyRevenue = activeSubscriptions * 29

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalUsers}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Documents</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalDocuments}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscriptions</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeSubscriptions}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${monthlyRevenue}</div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Recent Users</CardTitle>
            <CardDescription>Latest registered users</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {usersResult.data?.slice(0, 10).map((user: any) => (
                <div key={user.id} className="flex items-center justify-between border-b pb-2">
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-gray-500">Plan: {user.plan || "free"}</p>
                  </div>
                  <div className="text-sm text-gray-500">{new Date(user.created_at).toLocaleDateString()}</div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="mt-8">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Database Health</CardTitle>
              <CardDescription>Configuration & connection checks</CardDescription>
            </div>
            <Database className="h-5 w-5 text-muted-foreground" />
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-3">
                <p className="text-sm font-medium text-muted-foreground">Environment variables</p>
                {[
                  { label: "Project URL", ok: databaseHealth.config.url },
                  { label: "Anon key", ok: databaseHealth.config.anonKey },
                  { label: "Service role key", ok: databaseHealth.config.serviceRoleKey },
                ].map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-lg border bg-white px-3 py-2 text-sm dark:bg-gray-900">
                    <span className="text-muted-foreground">{item.label}</span>
                    <Badge
                      variant={item.ok ? "secondary" : "destructive"}
                      className={item.ok ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100" : undefined}
                    >
                      {item.ok ? "Configured" : "Missing"}
                    </Badge>
                  </div>
                ))}
              </div>

              <div className="space-y-4">
                <div className="rounded-lg border bg-white px-4 py-3 shadow-sm dark:bg-gray-900">
                  <p className="text-sm font-medium text-muted-foreground">Connection test</p>
                  <p className={`text-lg font-semibold ${databaseHealth.connectivity.ok ? "text-green-600" : "text-red-600"}`}>
                    {databaseHealth.connectivity.ok ? "Connected" : "Unavailable"}
                  </p>
                  <p className="text-xs text-muted-foreground">{databaseHealth.connectivity.message || "Status unknown"}</p>
                </div>
                <div className="rounded-lg border bg-white px-4 py-3 shadow-sm dark:bg-gray-900">
                  <p className="text-sm font-medium text-muted-foreground">PDF Storage Bucket</p>
                  <Badge
                    variant={databaseHealth.storage.pdfBucket ? "secondary" : "destructive"}
                    className={databaseHealth.storage.pdfBucket ? "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-100" : undefined}
                  >
                    {databaseHealth.storage.pdfBucket ? "Found" : "Not Found"}
                  </Badge>
                  {databaseHealth.storage.error && (
                    <p className="mt-1 text-xs text-muted-foreground">{databaseHealth.storage.error}</p>
                  )}
                </div>
              </div>
            </div>

            {databaseHealth.tables.missing.length === 0 ? (
              <Alert>
                <AlertTitle>Schema looks good</AlertTitle>
                <AlertDescription>
                  Checked {databaseHealth.tables.checked} tables at {new Date(databaseHealth.checkedAt).toLocaleString()}.
                </AlertDescription>
              </Alert>
            ) : (
              <Alert variant="destructive">
                <AlertTitle>Missing tables detected</AlertTitle>
                <AlertDescription>
                  The following tables could not be queried: {databaseHealth.tables.missing.join(", ")}. Re-run the Supabase migrations
                  in `SUPABASE_SETUP.md`.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
