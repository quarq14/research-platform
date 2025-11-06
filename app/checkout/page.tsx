"use client"

import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { CreditCard, AlertCircle } from "lucide-react"
import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

export default function CheckoutPage() {
  const searchParams = useSearchParams()
  const plan = searchParams.get("plan") || "pro"
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const planDetails = {
    pro: { name: "Pro", price: 19, features: ["Unlimited uploads", "All features", "Priority support"] },
    team: { name: "Team", price: 49, features: ["5 team members", "Shared workspace", "API access"] },
  }

  const selectedPlan = planDetails[plan as keyof typeof planDetails] || planDetails.pro

  const handlePayPalCheckout = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/checkout/paypal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) throw new Error("Failed to create PayPal checkout")

      const { approvalUrl } = await response.json()
      window.location.href = approvalUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
      setIsProcessing(false)
    }
  }

  const handleIyzicoCheckout = async () => {
    setIsProcessing(true)
    setError(null)

    try {
      const response = await fetch("/api/checkout/iyzico", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ plan }),
      })

      if (!response.ok) throw new Error("Failed to create iyzico checkout")

      const { paymentPageUrl } = await response.json()
      window.location.href = paymentPageUrl
    } catch (err) {
      setError(err instanceof Error ? err.message : "Checkout failed")
      setIsProcessing(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>Complete Your Purchase</CardTitle>
          <CardDescription>Choose your payment method</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <h3 className="font-semibold text-lg mb-2">{selectedPlan.name} Plan</h3>
            <p className="text-3xl font-bold text-blue-600 mb-3">${selectedPlan.price}/month</p>
            <ul className="space-y-1 text-sm">
              {selectedPlan.features.map((feature) => (
                <li key={feature}>• {feature}</li>
              ))}
            </ul>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Tabs defaultValue="paypal" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="paypal">PayPal</TabsTrigger>
              <TabsTrigger value="iyzico">iyzico (Turkey)</TabsTrigger>
            </TabsList>
            <TabsContent value="paypal" className="space-y-4">
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>You'll be redirected to PayPal to complete your payment securely.</AlertDescription>
              </Alert>
              <Button className="w-full" size="lg" onClick={handlePayPalCheckout} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Pay with PayPal"}
              </Button>
            </TabsContent>
            <TabsContent value="iyzico" className="space-y-4">
              <Alert>
                <CreditCard className="h-4 w-4" />
                <AlertDescription>
                  You'll be redirected to iyzico to complete your payment securely with Turkish payment methods.
                </AlertDescription>
              </Alert>
              <Button className="w-full" size="lg" onClick={handleIyzicoCheckout} disabled={isProcessing}>
                {isProcessing ? "Processing..." : "Pay with iyzico"}
              </Button>
            </TabsContent>
          </Tabs>

          <p className="text-xs text-center text-gray-500">
            By continuing, you agree to our Terms of Service and Privacy Policy. Cancel anytime.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
