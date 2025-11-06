import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check } from "lucide-react"
import Link from "next/link"

export default function PricingPage() {
  const plans = [
    {
      name: "Free",
      price: "$0",
      period: "forever",
      features: [
        "5 PDF uploads per month",
        "100 chat messages",
        "Basic academic search",
        "Standard paraphrasing",
        "1,000 words writing limit",
      ],
      cta: "Get Started",
      href: "/auth/signup",
      popular: false,
    },
    {
      name: "Pro",
      price: "$19",
      period: "per month",
      features: [
        "Unlimited PDF uploads",
        "Unlimited chat messages",
        "Advanced academic search",
        "All paraphrasing modes",
        "Unlimited writing",
        "Plagiarism checker",
        "AI detection",
        "Priority support",
      ],
      cta: "Start Pro",
      href: "/checkout?plan=pro",
      popular: true,
    },
    {
      name: "Team",
      price: "$49",
      period: "per month",
      features: [
        "Everything in Pro",
        "5 team members",
        "Shared workspace",
        "Team analytics",
        "Admin controls",
        "API access",
        "Custom integrations",
        "Dedicated support",
      ],
      cta: "Start Team",
      href: "/checkout?plan=team",
      popular: false,
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <header className="border-b bg-white/80 backdrop-blur-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold">
            Academic AI
          </Link>
          <div className="flex gap-2">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">Sign In</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Simple, Transparent Pricing</h1>
          <p className="text-xl text-gray-600">Choose the plan that fits your needs</p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <Card key={plan.name} className={plan.popular ? "border-blue-600 border-2 shadow-lg" : ""}>
              {plan.popular && (
                <div className="bg-blue-600 text-white text-center py-1 text-sm font-semibold rounded-t-lg">
                  Most Popular
                </div>
              )}
              <CardHeader>
                <CardTitle className="text-2xl">{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold text-gray-900">{plan.price}</span>
                  <span className="text-gray-600"> / {plan.period}</span>
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button className="w-full" variant={plan.popular ? "default" : "outline"} asChild>
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-16 text-center">
          <p className="text-gray-600 mb-4">All plans include 14-day money-back guarantee</p>
          <p className="text-sm text-gray-500">Payments processed securely via PayPal and iyzico</p>
        </div>
      </main>
    </div>
  )
}
