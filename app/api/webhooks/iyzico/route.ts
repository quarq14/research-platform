import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  try {
    const body = await req.json()
    const { status, paymentId, conversationId, paidPrice, currency } = body

    if (status === "success") {
      const userId = conversationId

      await supabase.from("payments").insert({
        user_id: userId,
        amount: Number.parseFloat(paidPrice),
        currency: currency || "TRY",
        status: "completed",
        provider: "iyzico",
        external_id: paymentId,
        metadata: body,
      })

      const { data: payment } = await supabase
        .from("payments")
        .select("subscription_id")
        .eq("external_id", paymentId)
        .single()

      if (payment?.subscription_id) {
        await supabase.from("subscriptions").update({ status: "active" }).eq("id", payment.subscription_id)
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] iyzico webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
