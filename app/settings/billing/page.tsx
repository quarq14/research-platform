export const dynamic = "force-dynamic"

import { createServerClient } from "@/lib/supabase/server"
import { redirect } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function BillingPage() {
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

  const { data: profile } = await supabase.from("profiles").select("plan").eq("user_id", user.id).single()

  const currentPlan = profile?.plan || "free"

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <h1 className="text-3xl font-bold mb-6">Billing & Subscription</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Current Plan</CardTitle>
          <CardDescription>Manage your subscription</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-bold capitalize">{currentPlan} Plan</h3>
              <p className="text-gray-600">
                {currentPlan === "free" ? "Free forever" : `$${currentPlan === "pro" ? "19" : "49"}/month`}
              </p>
            </div>
            <Badge variant={currentPlan === "free" ? "secondary" : "default"}>
              {currentPlan === "free" ? "Free" : "Active"}
            </Badge>
          </div>
          {currentPlan === "free" && (
            <div className="mt-4">
              <Button asChild>
                <Link href="/pricing">Upgrade Plan</Link>
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Payment Methods</CardTitle>
          <CardDescription>Manage your payment methods</CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600 mb-4">No payment methods on file</p>
          <Button variant="outline">Add Payment Method</Button>
        </CardContent>
      </Card>
    </div>
  )
}
