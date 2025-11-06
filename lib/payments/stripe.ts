import Stripe from 'stripe'

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  apiVersion: '2024-12-18.acacia',
})

export interface CreateCheckoutSessionParams {
  priceId: string
  userId: string
  userEmail: string
  successUrl: string
  cancelUrl: string
  mode?: 'subscription' | 'payment'
}

export interface CreateCustomerParams {
  email: string
  name?: string
  metadata?: Record<string, string>
}

/**
 * Stripe Payment Service
 */
export class StripeService {
  /**
   * Create a new Stripe customer
   */
  static async createCustomer(params: CreateCustomerParams): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email: params.email,
        name: params.name,
        metadata: params.metadata,
      })

      return customer
    } catch (error: any) {
      throw new Error(`Failed to create Stripe customer: ${error.message}`)
    }
  }

  /**
   * Create a checkout session for subscription or one-time payment
   */
  static async createCheckoutSession(
    params: CreateCheckoutSessionParams
  ): Promise<Stripe.Checkout.Session> {
    try {
      const session = await stripe.checkout.sessions.create({
        mode: params.mode || 'subscription',
        payment_method_types: ['card'],
        line_items: [
          {
            price: params.priceId,
            quantity: 1,
          },
        ],
        success_url: params.successUrl,
        cancel_url: params.cancelUrl,
        customer_email: params.userEmail,
        metadata: {
          userId: params.userId,
        },
      })

      return session
    } catch (error: any) {
      throw new Error(`Failed to create checkout session: ${error.message}`)
    }
  }

  /**
   * Create a billing portal session
   */
  static async createBillingPortalSession(
    customerId: string,
    returnUrl: string
  ): Promise<Stripe.BillingPortal.Session> {
    try {
      const session = await stripe.billingPortal.sessions.create({
        customer: customerId,
        return_url: returnUrl,
      })

      return session
    } catch (error: any) {
      throw new Error(`Failed to create billing portal session: ${error.message}`)
    }
  }

  /**
   * Get subscription details
   */
  static async getSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription | null> {
    try {
      const subscription = await stripe.subscriptions.retrieve(subscriptionId)
      return subscription
    } catch (error: any) {
      console.error('Failed to get subscription:', error.message)
      return null
    }
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(
    subscriptionId: string,
    cancelAtPeriodEnd = true
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: cancelAtPeriodEnd,
      })

      return subscription
    } catch (error: any) {
      throw new Error(`Failed to cancel subscription: ${error.message}`)
    }
  }

  /**
   * Reactivate a canceled subscription
   */
  static async reactivateSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.update(subscriptionId, {
        cancel_at_period_end: false,
      })

      return subscription
    } catch (error: any) {
      throw new Error(`Failed to reactivate subscription: ${error.message}`)
    }
  }

  /**
   * Create a price for a product
   */
  static async createPrice(params: {
    productId: string
    unitAmount: number
    currency: string
    recurring?: {
      interval: 'month' | 'year'
    }
  }): Promise<Stripe.Price> {
    try {
      const price = await stripe.prices.create({
        product: params.productId,
        unit_amount: params.unitAmount,
        currency: params.currency,
        recurring: params.recurring,
      })

      return price
    } catch (error: any) {
      throw new Error(`Failed to create price: ${error.message}`)
    }
  }

  /**
   * Verify webhook signature
   */
  static constructEvent(
    payload: string | Buffer,
    signature: string,
    secret: string
  ): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(payload, signature, secret)
    } catch (error: any) {
      throw new Error(`Webhook signature verification failed: ${error.message}`)
    }
  }

  /**
   * List customer subscriptions
   */
  static async listCustomerSubscriptions(
    customerId: string
  ): Promise<Stripe.Subscription[]> {
    try {
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        limit: 100,
      })

      return subscriptions.data
    } catch (error: any) {
      throw new Error(`Failed to list subscriptions: ${error.message}`)
    }
  }

  /**
   * Get customer
   */
  static async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await stripe.customers.retrieve(customerId)
      return customer as Stripe.Customer
    } catch (error: any) {
      console.error('Failed to get customer:', error.message)
      return null
    }
  }
}

export { stripe }
