import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe, StripeService } from '@/lib/payments/stripe'
import { createClient } from '@/lib/supabase/server'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature) {
      return NextResponse.json(
        { error: 'No signature provided' },
        { status: 400 }
      )
    }

    const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || ''

    // Verify webhook signature
    let event
    try {
      event = StripeService.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object

        // Get user ID from metadata
        const userId = session.metadata?.userId

        if (!userId) {
          console.error('No userId in session metadata')
          break
        }

        // Get subscription details
        if (session.subscription) {
          const subscription = await StripeService.getSubscription(
            session.subscription as string
          )

          if (subscription) {
            // Find plan by price ID
            const priceId = subscription.items.data[0]?.price.id

            // For now, map to pro plan (you'd look this up from your plans table)
            const { data: plan } = await supabase
              .from('plans')
              .select('id')
              .eq('name', 'pro')
              .single()

            if (plan) {
              // Create or update subscription
              await supabase.from('subscriptions').upsert({
                user_id: userId,
                plan_id: plan.id,
                stripe_subscription_id: subscription.id,
                stripe_customer_id: subscription.customer as string,
                status: subscription.status,
                current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
                current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
                cancel_at_period_end: subscription.cancel_at_period_end,
              })

              // Update user's plan
              await supabase
                .from('profiles')
                .update({ plan: 'pro' })
                .eq('id', userId)
            }
          }
        }

        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object

        // Find subscription in database
        const { data: dbSubscription } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (dbSubscription) {
          // Update subscription status
          await supabase
            .from('subscriptions')
            .update({
              status: subscription.status,
              current_period_start: new Date(subscription.current_period_start * 1000).toISOString(),
              current_period_end: new Date(subscription.current_period_end * 1000).toISOString(),
              cancel_at_period_end: subscription.cancel_at_period_end,
            })
            .eq('stripe_subscription_id', subscription.id)

          // If canceled, downgrade to free
          if (subscription.status === 'canceled') {
            await supabase
              .from('profiles')
              .update({ plan: 'free' })
              .eq('id', dbSubscription.user_id)
          }
        }

        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object

        // Find subscription in database
        const { data: dbSubscription } = await supabase
          .from('subscriptions')
          .select('user_id')
          .eq('stripe_subscription_id', subscription.id)
          .single()

        if (dbSubscription) {
          // Mark as canceled
          await supabase
            .from('subscriptions')
            .update({ status: 'canceled' })
            .eq('stripe_subscription_id', subscription.id)

          // Downgrade to free plan
          await supabase
            .from('profiles')
            .update({ plan: 'free' })
            .eq('id', dbSubscription.user_id)
        }

        break
      }

      case 'invoice.payment_succeeded': {
        const invoice = event.data.object

        // Record invoice
        await supabase.from('invoices').insert({
          user_id: invoice.metadata?.userId || '',
          stripe_invoice_id: invoice.id,
          amount: invoice.amount_paid / 100, // Convert from cents
          currency: invoice.currency.toUpperCase(),
          status: 'paid',
          invoice_url: invoice.hosted_invoice_url,
          paid_at: new Date(invoice.status_transitions.paid_at! * 1000).toISOString(),
        })

        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object

        // Find subscription
        if (invoice.subscription) {
          const { data: dbSubscription } = await supabase
            .from('subscriptions')
            .select('user_id')
            .eq('stripe_subscription_id', invoice.subscription as string)
            .single()

          if (dbSubscription) {
            // Mark subscription as past_due
            await supabase
              .from('subscriptions')
              .update({ status: 'past_due' })
              .eq('stripe_subscription_id', invoice.subscription as string)
          }
        }

        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: error.message || 'Webhook failed' },
      { status: 500 }
    )
  }
}
