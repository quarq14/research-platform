import paypal from '@paypal/checkout-server-sdk'

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID || ''
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || ''

  if (process.env.PAYPAL_MODE === 'production') {
    return new paypal.core.LiveEnvironment(clientId, clientSecret)
  } else {
    return new paypal.core.SandboxEnvironment(clientId, clientSecret)
  }
}

function client() {
  return new paypal.core.PayPalHttpClient(environment())
}

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
 */
export class PayPalService {
  /**
   * Create a PayPal order for one-time payment
   */
  static async createOrder(params: CreateOrderParams): Promise<any> {
    try {
      const request = new paypal.orders.OrdersCreateRequest()
      request.prefer('return=representation')
      request.requestBody({
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
      })

      const order = await client().execute(request)
      return order.result
    } catch (error: any) {
      throw new Error(`Failed to create PayPal order: ${error.message}`)
    }
  }

  /**
   * Capture a PayPal order
   */
  static async captureOrder(orderId: string): Promise<any> {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(orderId)
      request.requestBody({})

      const capture = await client().execute(request)
      return capture.result
    } catch (error: any) {
      throw new Error(`Failed to capture PayPal order: ${error.message}`)
    }
  }

  /**
   * Get order details
   */
  static async getOrder(orderId: string): Promise<any> {
    try {
      const request = new paypal.orders.OrdersGetRequest(orderId)
      const order = await client().execute(request)
      return order.result
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
      // Note: This is a simplified version. In production, you'd use PayPal's Billing Plans API
      // which requires a different setup
      return {
        id: 'plan_id_placeholder',
        status: 'ACTIVE',
      }
    } catch (error: any) {
      throw new Error(`Failed to create PayPal plan: ${error.message}`)
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(captureId: string, amount?: string): Promise<any> {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId)
      if (amount) {
        request.requestBody({
          amount: {
            value: amount,
            currency_code: 'USD',
          },
        })
      }

      const refund = await client().execute(request)
      return refund.result
    } catch (error: any) {
      throw new Error(`Failed to refund PayPal payment: ${error.message}`)
    }
  }
}
