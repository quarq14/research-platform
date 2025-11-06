// Note: This is a simplified PayPal integration
// For full functionality, use the PayPal REST API directly with fetch

export interface CreateOrderParams {
  amount: string
  currency: string
  description: string
  userId: string
}

export interface CreateSubscriptionParams {
  planId: string
  userId: string
  userEmail: string
}

/**
 * PayPal Payment Service
 * Using PayPal REST API v2
 */
export class PayPalService {
  private static getAccessToken = async (): Promise<string> => {
    const clientId = process.env.PAYPAL_CLIENT_ID || ''
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''
    const baseURL =
      process.env.PAYPAL_MODE === 'production'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com'

    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch(`${baseURL}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${auth}`,
      },
      body: 'grant_type=client_credentials',
    })

    const data = await response.json()
    return data.access_token
  }

  private static getBaseURL = (): string => {
    return process.env.PAYPAL_MODE === 'production'
      ? 'https://api-m.paypal.com'
      : 'https://api-m.sandbox.paypal.com'
  }

  /**
   * Create a PayPal order for one-time payment
   */
  static async createOrder(params: CreateOrderParams): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      const baseURL = this.getBaseURL()

      const response = await fetch(`${baseURL}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [
            {
              amount: {
                currency_code: params.currency,
                value: params.amount,
              },
              description: params.description,
              custom_id: params.userId,
            },
          ],
          application_context: {
            brand_name: 'Academic Research Platform',
            landing_page: 'BILLING',
            user_action: 'PAY_NOW',
          },
        }),
      })

      return await response.json()
    } catch (error: any) {
      throw new Error(`Failed to create PayPal order: ${error.message}`)
    }
  }

  /**
   * Capture a PayPal order
   */
  static async captureOrder(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      const baseURL = this.getBaseURL()

      const response = await fetch(
        `${baseURL}/v2/checkout/orders/${orderId}/capture`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
        }
      )

      return await response.json()
    } catch (error: any) {
      throw new Error(`Failed to capture PayPal order: ${error.message}`)
    }
  }

  /**
   * Get order details
   */
  static async getOrder(orderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      const baseURL = this.getBaseURL()

      const response = await fetch(`${baseURL}/v2/checkout/orders/${orderId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
      })

      return await response.json()
    } catch (error: any) {
      throw new Error(`Failed to get PayPal order: ${error.message}`)
    }
  }

  /**
   * Create a subscription plan
   */
  static async createPlan(params: {
    name: string
    description: string
    amount: string
    currency: string
    interval: 'MONTH' | 'YEAR'
  }): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      const baseURL = this.getBaseURL()

      // First create a product
      const productResponse = await fetch(`${baseURL}/v1/catalogs/products`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          name: params.name,
          description: params.description,
          type: 'SERVICE',
          category: 'SOFTWARE',
        }),
      })

      const product = await productResponse.json()

      // Then create a plan
      const planResponse = await fetch(
        `${baseURL}/v1/billing/plans`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({
            product_id: product.id,
            name: params.name,
            description: params.description,
            billing_cycles: [
              {
                frequency: {
                  interval_unit: params.interval,
                  interval_count: 1,
                },
                tenure_type: 'REGULAR',
                sequence: 1,
                total_cycles: 0,
                pricing_scheme: {
                  fixed_price: {
                    value: params.amount,
                    currency_code: params.currency,
                  },
                },
              },
            ],
            payment_preferences: {
              auto_bill_outstanding: true,
              setup_fee_failure_action: 'CONTINUE',
              payment_failure_threshold: 3,
            },
          }),
        }
      )

      return await planResponse.json()
    } catch (error: any) {
      throw new Error(`Failed to create PayPal plan: ${error.message}`)
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(captureId: string, amount?: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken()
      const baseURL = this.getBaseURL()

      const body: any = {}
      if (amount) {
        body.amount = {
          value: amount,
          currency_code: 'USD',
        }
      }

      const response = await fetch(
        `${baseURL}/v2/payments/captures/${captureId}/refund`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify(body),
        }
      )

      return await response.json()
    } catch (error: any) {
      throw new Error(`Failed to refund PayPal payment: ${error.message}`)
    }
  }
}
