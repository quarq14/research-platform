import Iyzipay from 'iyzipay'

const iyzipay = new Iyzipay({
  apiKey: process.env.IYZICO_API_KEY || '',
  secretKey: process.env.IYZICO_SECRET_KEY || '',
  uri: process.env.IYZICO_BASE_URL || 'https://sandbox-api.iyzipay.com',
})

export interface CreatePaymentParams {
  price: string
  paidPrice: string
  currency: 'TRY' | 'USD' | 'EUR'
  basketId: string
  paymentChannel?: string
  paymentGroup?: string
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

/**
 * iyzico Payment Service (Turkish payment processor)
 */
export class IyzicoService {
  /**
   * Create a payment request
   */
  static async createPayment(params: CreatePaymentParams): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: params.basketId,
        price: params.price,
        paidPrice: params.paidPrice,
        currency: params.currency,
        basketId: params.basketId,
        paymentChannel: params.paymentChannel || Iyzipay.PAYMENT_CHANNEL.WEB,
        paymentGroup: params.paymentGroup || Iyzipay.PAYMENT_GROUP.PRODUCT,
        callbackUrl: params.callbackUrl,
        enabledInstallments: [1],
        buyer: params.buyer,
        shippingAddress: params.billingAddress,
        billingAddress: params.billingAddress,
        basketItems: params.basketItems,
      }

      iyzipay.checkoutFormInitialize.create(request, (err: any, result: any) => {
        if (err) {
          reject(new Error(`iyzico payment creation failed: ${err.message}`))
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Retrieve payment result
   */
  static async retrievePayment(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: token,
        token,
      }

      iyzipay.checkoutForm.retrieve(request, (err: any, result: any) => {
        if (err) {
          reject(new Error(`iyzico payment retrieval failed: ${err.message}`))
        } else {
          resolve(result)
        }
      })
    })
  }

  /**
   * Create a subscription
   */
  static async createSubscription(params: {
    price: string
    currency: 'TRY' | 'USD' | 'EUR'
    customerId: string
    planId: string
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      // iyzico subscription API would go here
      // This is a placeholder implementation
      resolve({
        status: 'success',
        subscriptionId: `sub_${Date.now()}`,
      })
    })
  }

  /**
   * Cancel a subscription
   */
  static async cancelSubscription(subscriptionId: string): Promise<any> {
    return new Promise((resolve, reject) => {
      // iyzico subscription cancellation would go here
      resolve({
        status: 'success',
        subscriptionId,
      })
    })
  }

  /**
   * Create a refund
   */
  static async createRefund(params: {
    paymentTransactionId: string
    price: string
    currency: 'TRY' | 'USD' | 'EUR'
    ip: string
  }): Promise<any> {
    return new Promise((resolve, reject) => {
      const request = {
        locale: Iyzipay.LOCALE.TR,
        conversationId: `refund_${Date.now()}`,
        paymentTransactionId: params.paymentTransactionId,
        price: params.price,
        currency: params.currency,
        ip: params.ip,
      }

      iyzipay.refund.create(request, (err: any, result: any) => {
        if (err) {
          reject(new Error(`iyzico refund failed: ${err.message}`))
        } else {
          resolve(result)
        }
      })
    })
  }
}
