import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"

export async function POST(req: NextRequest) {
  const supabase = await createServerClient()
  if (!supabase) {
    return NextResponse.json({ error: "Service unavailable" }, { status: 503 })
  }

  try {
    const body = await req.json()
    const eventType = body.event_type

    if (eventType === "BILLING.SUBSCRIPTION.CREATED") {
      const subscription = body.resource
      const userId = subscription.custom_id

      await supabase.from("subscriptions").insert({
        user_id: userId,
        plan: subscription.plan_id,
        status: "active",
        payment_provider: "paypal",
        external_id: subscription.id,
        current_period_start: subscription.start_time,
        current_period_end: subscription.billing_info.next_billing_time,
      })

      await supabase.from("profiles").update({ plan: subscription.plan_id }).eq("id", userId)
    } else if (eventType === "BILLING.SUBSCRIPTION.CANCELLED") {
      const subscription = body.resource

      await supabase
        .from("subscriptions")
        .update({ status: "cancelled", cancel_at_period_end: true })
        .eq("external_id", subscription.id)
    } else if (eventType === "PAYMENT.SALE.COMPLETED") {
      const sale = body.resource

      await supabase.from("payments").insert({
        user_id: sale.custom,
        amount: Number.parseFloat(sale.amount.total),
        currency: sale.amount.currency,
        status: "completed",
        provider: "paypal",
        external_id: sale.id,
        metadata: sale,
      })
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error("[v0] PayPal webhook error:", error)
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 })
  }
}
