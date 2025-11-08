import Stripe from 'stripe'

// Initialize Stripe
const stripe = process.env.STRIPE_SECRET_KEY
  ? new Stripe(process.env.STRIPE_SECRET_KEY, {
      apiVersion: '2024-12-18.acacia',
      typescript: true,
    })
  : null

export interface CreateCheckoutSessionParams {
  priceId: string
  userId: string
  email: string
  successUrl: string
  cancelUrl: string
  mode?: 'subscription' | 'payment'
}

export interface CreateCustomerParams {
  email: string
  name?: string
  metadata?: Record<string, string>
}

export class StripeService {
  private stripe: Stripe | null

  constructor() {
    this.stripe = stripe
  }

  isConfigured(): boolean {
    return this.stripe !== null
  }

  async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer | null> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured')
    }

    try {
      const customer = await this.stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata || {},
      })

      return customer
    } catch (error) {
      console.error('Error creating Stripe customer:', error)
      return null
    }
  }

  async createCheckoutSession(params: CreateCheckoutSessionParams): Promise<Stripe.Checkout.Session | null> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured')
    }

    try {
      const session = await this.stripe.checkout.sessions.create({
        customer_email: params.email,
        client_reference_id: params.userId,
        payment_method_types: ['card'],
        mode: params.mode || 'subscription',
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        metadata: {
          userId: params.userId,
        },
      })

      return session
    } catch (error) {
      console.error('Error creating checkout session:', error)
      return null
    }
  }

  async createPortalSession(customerId: string, returnUrl: string): Promise<Stripe.BillingPortal.Session | null> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured')
    }

    try {
      const session = await this.stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })

      return session
    } catch (error) {
      console.error('Error creating portal session:', error)
      return null
    }
  }

  async cancelSubscription(subscriptionId: string): Promise<boolean> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured')
    }

    try {
      await this.stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: true,
      })

      return true
    } catch (error) {
      console.error('Error canceling subscription:', error)
      return false
    }
  }

  async retrieveSubscription(subscriptionId: string): Promise<Stripe.Subscription | null> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured')
    }

    try {
      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId)
      return subscription
    } catch (error) {
      console.error('Error retrieving subscription:', error)
      return null
    }
  }

  async constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Promise<Stripe.Event | null> {
    if (!this.stripe) {
      throw new Error('Stripe is not configured')
    }

    try {
      const event = this.stripe.webhooks.constructEvent(payload, signature, secret)
      return event
    } catch (error) {
      console.error('Error constructing webhook event:', error)
      return null
    }
  }

  async handleWebhookEvent(event: Stripe.Event): Promise<void> {
    switch (event.type) {
      case 'checkout.session.completed':
        await this.handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session)
        break
      case 'customer.subscription.updated':
        await this.handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break
      case 'customer.subscription.deleted':
        await this.handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break
      case 'invoice.payment_succeeded':
        await this.handleInvoicePaymentSucceeded(event.data.object as Stripe.Invoice)
        break
      case 'invoice.payment_failed':
        await this.handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break
      default:
        console.log(`Unhandled event type: ${event.type}`)
    }
  }

  private async handleCheckoutSessionCompleted(session: Stripe.Checkout.Session): Promise<void> {
    console.log('Checkout session completed:', session.id)
    // Implement logic to update database
  }

  private async handleSubscriptionUpdated(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription updated:', subscription.id)
    // Implement logic to update database
  }

  private async handleSubscriptionDeleted(subscription: Stripe.Subscription): Promise<void> {
    console.log('Subscription deleted:', subscription.id)
    // Implement logic to update database
  }

  private async handleInvoicePaymentSucceeded(invoice: Stripe.Invoice): Promise<void> {
    console.log('Invoice payment succeeded:', invoice.id)
    // Implement logic to update database
  }

  private async handleInvoicePaymentFailed(invoice: Stripe.Invoice): Promise<void> {
    console.log('Invoice payment failed:', invoice.id)
    // Implement logic to update database
  }
}

export const stripeService = new StripeService()
