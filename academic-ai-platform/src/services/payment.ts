// PayPal and iyzico Payment Services

export type PaymentProvider = 'paypal' | 'iyzico'
export type SubscriptionPlan = 'free' | 'basic' | 'pro' | 'enterprise'

export type PlanDetails = {
  name: string
  price: number
  currency: string
  interval: 'month' | 'year'
  features: string[]
  limits: {
    documents: number
    pages: number
    words: number
    searches: number
  }
}

export const PLANS: Record<SubscriptionPlan, PlanDetails> = {
  free: {
    name: 'Free',
    price: 0,
    currency: 'USD',
    interval: 'month',
    features: [
      '5 PDF uploads',
      '100 pages',
      '10,000 words',
      '20 searches'
    ],
    limits: {
      documents: 5,
      pages: 100,
      words: 10000,
      searches: 20
    }
  },
  basic: {
    name: 'Basic',
    price: 9.99,
    currency: 'USD',
    interval: 'month',
    features: [
      '50 PDF uploads',
      '500 pages',
      '100,000 words',
      '200 searches',
      'Priority support'
    ],
    limits: {
      documents: 50,
      pages: 500,
      words: 100000,
      searches: 200
    }
  },
  pro: {
    name: 'Pro',
    price: 29.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Unlimited PDFs',
      'Unlimited pages',
      'Unlimited words',
      'Unlimited searches',
      'Priority support',
      'API access',
      'Export all formats'
    ],
    limits: {
      documents: -1, // unlimited
      pages: -1,
      words: -1,
      searches: -1
    }
  },
  enterprise: {
    name: 'Enterprise',
    price: 99.99,
    currency: 'USD',
    interval: 'month',
    features: [
      'Everything in Pro',
      'Custom integrations',
      'Dedicated support',
      'SLA guarantee',
      'Team management'
    ],
    limits: {
      documents: -1,
      pages: -1,
      words: -1,
      searches: -1
    }
  }
}

// PayPal Integration
export async function createPayPalOrder(
  plan: SubscriptionPlan,
  userId: string
): Promise<{ orderId: string; approvalUrl: string }> {
  const clientId = import.meta.env.VITE_PAYPAL_CLIENT_ID

  if (!clientId) {
    throw new Error('PayPal entegrasyonu yapılandırılmamış. Lütfen API key\'leri ekleyin.')
  }

  // In production, this would call your backend API
  // which then calls PayPal API
  try {
    // Mock implementation
    const orderId = `ORDER-${Date.now()}-${Math.random().toString(36).slice(2)}`
    const approvalUrl = `https://www.sandbox.paypal.com/checkoutnow?token=${orderId}`

    return { orderId, approvalUrl }
  } catch (error: any) {
    throw new Error(`PayPal order oluşturulamadı: ${error.message}`)
  }
}

export async function capturePayPalOrder(
  orderId: string
): Promise<{ success: boolean; subscriptionId?: string }> {
  // In production, this would call your backend API
  try {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    return {
      success: true,
      subscriptionId: `SUB-${Date.now()}`
    }
  } catch (error: any) {
    throw new Error(`PayPal ödeme alınamadı: ${error.message}`)
  }
}

// iyzico Integration (Turkish market)
export async function createIyzicoPayment(
  plan: SubscriptionPlan,
  userId: string,
  cardInfo: {
    number: string
    holder: string
    expiry: string
    cvv: string
  }
): Promise<{ success: boolean; paymentId: string }> {
  const apiKey = import.meta.env.VITE_IYZICO_API_KEY

  if (!apiKey) {
    throw new Error('iyzico entegrasyonu yapılandırılmamış. Lütfen API key\'leri ekleyin.')
  }

  // In production, this would call your backend API
  // which then calls iyzico API with proper encryption
  try {
    // Mock implementation
    await new Promise(resolve => setTimeout(resolve, 1500))
    
    const planDetails = PLANS[plan]
    const price = planDetails.price
    
    // Simulate 3D Secure redirect or direct payment
    const paymentId = `IYZICO-${Date.now()}`
    
    return {
      success: true,
      paymentId
    }
  } catch (error: any) {
    throw new Error(`iyzico ödeme hatası: ${error.message}`)
  }
}

// Check if user can perform action based on plan limits
export function checkLimit(
  currentUsage: number,
  limit: number
): { allowed: boolean; remaining: number } {
  if (limit === -1) {
    // Unlimited
    return { allowed: true, remaining: -1 }
  }

  const remaining = limit - currentUsage
  return {
    allowed: remaining > 0,
    remaining: Math.max(0, remaining)
  }
}

// Get user's plan from profile
export function getUserPlan(profile: any): SubscriptionPlan {
  return (profile?.plan || 'free') as SubscriptionPlan
}

// Check if payment providers are configured
export function isPayPalConfigured(): boolean {
  return !!import.meta.env.VITE_PAYPAL_CLIENT_ID
}

export function isIyzicoConfigured(): boolean {
  return !!import.meta.env.VITE_IYZICO_API_KEY
}
