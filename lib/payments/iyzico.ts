import crypto from 'crypto'
import axios from 'axios'

interface IyzicoConfig {
  apiKey: string
  secretKey: string
  baseUrl: string
}

interface CreateCheckoutParams {
  price: string
  paidPrice: string
  currency: string
  basketId: string
  paymentGroup: string
  callbackUrl: string
  buyer: {
    id: string
    name: string
    surname: string
    email: string
    identityNumber: string
    registrationAddress: string
    city: string
    country: string
  }
  shippingAddress: {
    contactName: string
    city: string
    country: string
    address: string
  }
  billingAddress: {
    contactName: string
    city: string
    country: string
    address: string
  }
  basketItems: Array<{
    id: string
    name: string
    category1: string
    itemType: string
    price: string
  }>
}

export class IyzicoService {
  private config: IyzicoConfig | null

  constructor() {
    const apiKey = process.env.IYZICO_API_KEY
    const secretKey = process.env.IYZICO_SECRET_KEY
    const baseUrl = process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com'

    if (apiKey && secretKey) {
      this.config = { apiKey, secretKey, baseUrl }
    } else {
      this.config = null
    }
  }

  isConfigured(): boolean {
    return this.config !== null
  }

  private generateAuthString(uri: string, body: Record<string, any>): string {
    if (!this.config) {
      throw new Error('Iyzico is not configured')
    }

    const randomString = crypto.randomBytes(8).toString('hex')
    const bodyString = JSON.stringify(body)

    // Create authorization string
    const authString = [
      `apiKey:${this.config.apiKey}`,
      `randomKey:${randomString}`,
      `signature:${this.generateSignature(uri, bodyString, randomString)}`,
    ].join(',')

    return `IYZWS ${authString}`
  }

  private generateSignature(uri: string, body: string, randomString: string): string {
    if (!this.config) {
      throw new Error('Iyzico is not configured')
    }

    const dataToSign = `${randomString}${uri}${body}`

    return crypto
      .createHmac('sha256', this.config.secretKey)
      .update(dataToSign)
      .digest('base64')
  }

  async createCheckoutForm(params: CreateCheckoutParams): Promise<{ token: string; checkoutFormContent: string } | null> {
    if (!this.config) {
      throw new Error('Iyzico is not configured')
    }

    try {
      const uri = '/payment/iyzipos/checkoutform/initialize/auth/ecom'
      const body = {
        locale: 'tr',
        conversationId: params.basketId,
        price: params.price,
        paidPrice: params.paidPrice,
        currency: params.currency,
        basketId: params.basketId,
        paymentGroup: params.paymentGroup,
        callbackUrl: params.callbackUrl,
        enabledInstallments: [1, 2, 3, 6, 9],
        buyer: params.buyer,
        shippingAddress: params.shippingAddress,
        billingAddress: params.billingAddress,
        basketItems: params.basketItems,
      }

      const authString = this.generateAuthString(uri, body)

      const response = await axios.post(`${this.config.baseUrl}${uri}`, body, {
        headers: {
          'Authorization': authString,
          'Content-Type': 'application/json',
          'x-iyzi-rnd': crypto.randomBytes(8).toString('hex'),
        },
      })

      if (response.data.status === 'success') {
        return {
          token: response.data.token,
          checkoutFormContent: response.data.checkoutFormContent,
        }
      }

      console.error('Iyzico checkout form creation failed:', response.data)
      return null
    } catch (error) {
      console.error('Error creating Iyzico checkout form:', error)
      return null
    }
  }

  async retrieveCheckoutForm(token: string): Promise<any> {
    if (!this.config) {
      throw new Error('Iyzico is not configured')
    }

    try {
      const uri = '/payment/iyzipos/checkoutform/auth/ecom/detail'
      const body = {
        locale: 'tr',
        token,
      }

      const authString = this.generateAuthString(uri, body)

      const response = await axios.post(`${this.config.baseUrl}${uri}`, body, {
        headers: {
          'Authorization': authString,
          'Content-Type': 'application/json',
          'x-iyzi-rnd': crypto.randomBytes(8).toString('hex'),
        },
      })

      return response.data
    } catch (error) {
      console.error('Error retrieving Iyzico checkout form:', error)
      return null
    }
  }

  async createSubscriptionCheckout(params: CreateCheckoutParams): Promise<any> {
    if (!this.config) {
      throw new Error('Iyzico is not configured')
    }

    try {
      const uri = '/subscription/checkoutform/initialize'
      const body = {
        locale: 'tr',
        conversationId: params.basketId,
        pricingPlanReferenceCode: params.basketId,
        subscriptionInitialStatus: 'ACTIVE',
        callbackUrl: params.callbackUrl,
        customer: {
          name: params.buyer.name,
          surname: params.buyer.surname,
          email: params.buyer.email,
          identityNumber: params.buyer.identityNumber,
          billingAddress: params.billingAddress,
          shippingAddress: params.shippingAddress,
        },
      }

      const authString = this.generateAuthString(uri, body)

      const response = await axios.post(`${this.config.baseUrl}${uri}`, body, {
        headers: {
          'Authorization': authString,
          'Content-Type': 'application/json',
          'x-iyzi-rnd': crypto.randomBytes(8).toString('hex'),
        },
      })

      return response.data
    } catch (error) {
      console.error('Error creating Iyzico subscription checkout:', error)
      return null
    }
  }

  async cancelSubscription(subscriptionReferenceCode: string): Promise<boolean> {
    if (!this.config) {
      throw new Error('Iyzico is not configured')
    }

    try {
      const uri = '/subscription/cancel'
      const body = {
        locale: 'tr',
        subscriptionReferenceCode,
      }

      const authString = this.generateAuthString(uri, body)

      const response = await axios.post(`${this.config.baseUrl}${uri}`, body, {
        headers: {
          'Authorization': authString,
          'Content-Type': 'application/json',
          'x-iyzi-rnd': crypto.randomBytes(8).toString('hex'),
        },
      })

      return response.data.status === 'success'
    } catch (error) {
      console.error('Error canceling Iyzico subscription:', error)
      return false
    }
  }

  async handleCallback(token: string): Promise<any> {
    return await this.retrieveCheckoutForm(token)
  }
}

export const iyzicoService = new IyzicoService()
