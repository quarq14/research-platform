import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { plan } = await req.json()

    // In production, integrate with PayPal SDK
    // For now, return a mock approval URL
    const mockApprovalUrl = `https://www.paypal.com/checkoutnow?token=MOCK_${plan.toUpperCase()}_${user.id}`

    // Log the checkout attempt
    await supabase.from("usage_events").insert({
      user_id: user.id,
      type: "checkout_initiated",
      amount: plan === "pro" ? 19 : 49,
      unit: "usd",
    })

    return NextResponse.json({ approvalUrl: mockApprovalUrl })
  } catch (error) {
    console.error("[v0] PayPal checkout error:", error)
    return NextResponse.json({ error: "Failed to create checkout" }, { status: 500 })
  }
}
