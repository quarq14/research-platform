import axios from 'axios'

interface PayPalConfig {
  clientId: string
  clientSecret: string
  mode: 'sandbox' | 'live'
}

interface CreateSubscriptionParams {
  planId: string
  userId: string
  returnUrl: string
  cancelUrl: string
}

interface PayPalAuthResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export class PayPalService {
  private config: PayPalConfig | null
  private baseURL: string

  constructor() {
    const clientId = process.env.PAYPAL_CLIENT_ID
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET
    const mode = (process.env.PAYPAL_MODE as 'sandbox' | 'live') || 'sandbox'

    if (clientId && clientSecret) {
      this.config = { clientId, clientSecret, mode }
      this.baseURL = mode === 'sandbox'
        ? 'https://api-m.sandbox.paypal.com'
        : 'https://api-m.paypal.com'
    } else {
      this.config = null
      this.baseURL = ''
    }
  }

  isConfigured(): boolean {
    return this.config !== null
  }

  private async getAccessToken(): Promise<string | null> {
    if (!this.config) {
      throw new Error('PayPal is not configured')
    }

    try {
      const auth = Buffer.from(`${this.config.clientId}:${this.config.clientSecret}`).toString('base64')

      const response = await axios.post<PayPalAuthResponse>(
        `${this.baseURL}/v1/oauth2/token`,
        'grant_type=client_credentials',
        {
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
        }
      )

      return response.data.access_token
    } catch (error) {
      console.error('Error getting PayPal access token:', error)
      return null
    }
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<{ id: string; approvalUrl: string } | null> {
    if (!this.config) {
      throw new Error('PayPal is not configured')
    }

    try {
      const accessToken = await this.getAccessToken()
      if (!accessToken) return null

      const response = await axios.post(
        `${this.baseURL}/v1/billing/subscriptions`,
        {
          plan_id: params.planId,
          application_context: {
            brand_name: 'Academic AI Research Platform',
            return_url: params.returnUrl,
            cancel_url: params.cancelUrl,
            user_action: 'SUBSCRIBE_NOW',
          },
          custom_id: params.userId,
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      const approvalUrl = response.data.links.find((link: any) => link.rel === 'approve')?.href

      return {
        id: response.data.id,
        approvalUrl,
      }
    } catch (error) {
      console.error('Error creating PayPal subscription:', error)
      return null
    }
  }

  async getSubscription(subscriptionId: string): Promise<any> {
    if (!this.config) {
      throw new Error('PayPal is not configured')
    }

    try {
      const accessToken = await this.getAccessToken()
      if (!accessToken) return null

      const response = await axios.get(`${this.baseURL}/v1/billing/subscriptions/${subscriptionId}`, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return response.data
    } catch (error) {
      console.error('Error getting PayPal subscription:', error)
      return null
    }
  }

  async cancelSubscription(subscriptionId: string, reason: string = 'User requested cancellation'): Promise<boolean> {
    if (!this.config) {
      throw new Error('PayPal is not configured')
    }

    try {
      const accessToken = await this.getAccessToken()
      if (!accessToken) return false

      await axios.post(
        `${this.baseURL}/v1/billing/subscriptions/${subscriptionId}/cancel`,
        { reason },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return true
    } catch (error) {
      console.error('Error canceling PayPal subscription:', error)
      return false
    }
  }

  async verifyWebhookSignature(headers: Record<string, string>, body: any): Promise<boolean> {
    // Implement PayPal webhook verification
    // This requires PayPal webhook ID and certificate
    return true
  }

  async handleWebhookEvent(event: any): Promise<void> {
    const eventType = event.event_type

    switch (eventType) {
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
        console.log('Subscription activated:', event.resource.id)
        // Update database
        break
      case 'BILLING.SUBSCRIPTION.CANCELLED':
        console.log('Subscription cancelled:', event.resource.id)
        // Update database
        break
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        console.log('Subscription expired:', event.resource.id)
        // Update database
        break
      case 'PAYMENT.SALE.COMPLETED':
        console.log('Payment completed:', event.resource.id)
        // Update database
        break
      default:
        console.log(`Unhandled PayPal event type: ${eventType}`)
    }
  }
}

export const paypalService = new PayPalService()
