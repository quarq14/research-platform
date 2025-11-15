'use client'

import React, { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles, BookOpen, X } from "lucide-react"
import Link from "next/link"
import { useLocale } from "@/contexts/LocaleContext"

export default function PricingPage() {
  const { t } = useLocale()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      id: 'free',
      name: 'Free',
      price: '$0',
      period: 'forever',
      description: 'Perfect for getting started',
      features: [
        'Basic AI chat',
        'PDF upload (max 20 pages)',
        '10 searches/month',
        'Export to DOCX/PDF',
        '3 drafts'
      ],
      cta: 'Get Started',
      href: '/auth/signup',
      popular: false,
      highlighted: false,
    },
    {
      id: 'pro',
      name: 'Pro',
      price: billingCycle === 'monthly' ? '$19.99' : '$199.99',
      period: billingCycle === 'monthly' ? 'per month' : 'per year',
      description: 'For serious researchers and writers',
      features: [
        'Advanced AI models',
        'Unlimited PDFs',
        'Unlimited searches',
        'Plagiarism checking (50 checks)',
        'AI detection',
        'Priority support',
        '100 drafts'
      ],
      cta: 'Start Pro',
      href: '/checkout?plan=pro',
      popular: true,
      highlighted: true,
    },
    {
      id: 'team',
      name: 'Team',
      price: billingCycle === 'monthly' ? '$49.99' : '$499.99',
      period: billingCycle === 'monthly' ? 'per month' : 'per year',
      description: 'For research teams and organizations',
      features: [
        'All Pro features',
        'Team collaboration',
        'Shared projects',
        'Admin dashboard',
        'API access',
        'Unlimited drafts'
      ],
      cta: 'Start Team',
      href: '/checkout?plan=team',
      popular: false,
      highlighted: false,
    },
  ]

  const comparisonFeatures = [
    {
      category: 'Usage Limits',
      items: [
        {
          feature: 'Monthly Tokens',
          free: '50,000',
          pro: '1,000,000',
          team: '5,000,000'
        },
        {
          feature: 'Page Uploads',
          free: '20',
          pro: '500',
          team: '2,000'
        },
        {
          feature: 'Searches per Month',
          free: '10',
          pro: '500',
          team: '2,000'
        }
      ]
    },
    {
      category: 'AI Features',
      items: [
        {
          feature: 'Basic AI Chat',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: 'All AI Providers',
          free: false,
          pro: true,
          team: true
        },
        {
          feature: 'Custom AI Models',
          free: false,
          pro: true,
          team: true
        },
        {
          feature: 'API Access',
          free: false,
          pro: false,
          team: true
        }
      ]
    },
    {
      category: 'Research Tools',
      items: [
        {
          feature: 'PDF Upload & Chat',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: 'Academic Search',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: 'Writing Assistant',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: 'Plagiarism Checker',
          free: false,
          pro: '50 checks',
          team: 'Unlimited'
        },
        {
          feature: 'AI Content Detection',
          free: false,
          pro: true,
          team: true
        }
      ]
    },
    {
      category: 'Collaboration',
      items: [
        {
          feature: 'Team Members',
          free: '1',
          pro: '1',
          team: '5+'
        },
        {
          feature: 'Shared Projects',
          free: false,
          pro: false,
          team: true
        },
        {
          feature: 'Admin Dashboard',
          free: false,
          pro: false,
          team: true
        }
      ]
    },
    {
      category: 'Support',
      items: [
        {
          feature: 'Email Support',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: 'Priority Support',
          free: false,
          pro: true,
          team: true
        },
        {
          feature: 'Dedicated Support',
          free: false,
          pro: false,
          team: true
        }
      ]
    }
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            <div className="relative">
              <BookOpen className="h-7 w-7 text-blue-600" />
              <Sparkles className="h-3 w-3 absolute -top-1 -right-1 text-purple-600 animate-pulse" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('common.appName')}
            </span>
          </Link>
          <div className="flex gap-2 items-center">
            <Button variant="ghost" asChild>
              <Link href="/auth/login">{t('auth.signIn')}</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-12 md:py-16">
        {/* Page Header */}
        <div className="text-center mb-12 max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
            Simple, Transparent Pricing
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            Choose the perfect plan for your research and writing needs
          </p>

          {/* Billing Toggle */}
          <div className="inline-flex items-center gap-4 bg-white dark:bg-gray-800 p-2 rounded-full shadow-lg border border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setBillingCycle('monthly')}
              className={`px-6 py-2 rounded-full font-medium transition-all ${
                billingCycle === 'monthly'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Yearly
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                Save 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto mb-16">
          {plans.map((plan) => (
            <Card
              key={plan.id}
              className={`relative ${
                plan.highlighted
                  ? 'border-2 border-blue-600 dark:border-blue-400 shadow-2xl scale-105'
                  : 'border-2 border-transparent hover:border-gray-200 dark:hover:border-gray-700'
              } hover:shadow-xl transition-all`}
            >
              {plan.popular && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xs font-bold px-4 py-1.5 rounded-full shadow-lg">
                    MOST POPULAR
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{plan.name}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {plan.description}
                </CardDescription>
                <div className="mt-6">
                  <div className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                    {plan.price}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                    {plan.period}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-gray-700 dark:text-gray-300">{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-12 font-medium text-base ${
                    plan.highlighted
                      ? 'bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg'
                      : ''
                  }`}
                  variant={plan.highlighted ? 'default' : 'outline'}
                  asChild
                >
                  <Link href={plan.href}>{plan.cta}</Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Feature Comparison Table */}
        <div className="max-w-6xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Detailed Comparison
          </h2>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100">
                        Features
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-gray-100">
                        Free
                      </th>
                      <th className="text-center p-4 font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                        Pro
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-gray-100">
                        Team
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {comparisonFeatures.map((category, catIdx) => (
                      <React.Fragment key={catIdx}>
                        <tr className="bg-gray-100 dark:bg-gray-800">
                          <td
                            colSpan={4}
                            className="p-3 font-semibold text-sm text-gray-900 dark:text-gray-100"
                          >
                            {category.category}
                          </td>
                        </tr>
                        {category.items.map((item, itemIdx) => (
                          <tr
                            key={itemIdx}
                            className="border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                          >
                            <td className="p-4 text-sm text-gray-700 dark:text-gray-300">
                              {item.feature}
                            </td>
                            <td className="text-center p-4">
                              {typeof item.free === 'boolean' ? (
                                item.free ? (
                                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-gray-400 mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {item.free}
                                </span>
                              )}
                            </td>
                            <td className="text-center p-4 bg-blue-50 dark:bg-blue-900/10">
                              {typeof item.pro === 'boolean' ? (
                                item.pro ? (
                                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-gray-400 mx-auto" />
                                )
                              ) : (
                                <span className="text-sm font-medium text-blue-600">
                                  {item.pro}
                                </span>
                              )}
                            </td>
                            <td className="text-center p-4">
                              {typeof item.team === 'boolean' ? (
                                item.team ? (
                                  <Check className="h-5 w-5 text-green-600 mx-auto" />
                                ) : (
                                  <X className="h-5 w-5 text-gray-400 mx-auto" />
                                )
                              ) : (
                                <span className="text-sm text-gray-700 dark:text-gray-300">
                                  {item.team}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Frequently Asked Questions
          </h2>
          <div className="space-y-4">
            {[
              {
                q: 'Can I switch plans later?',
                a: 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
              },
              {
                q: 'What payment methods do you accept?',
                a: 'We accept major credit cards via PayPal and iyzico for international and regional payments.'
              },
              {
                q: 'Is there a free trial for paid plans?',
                a: 'All paid features are available with usage quotas. The Free plan lets you test the platform before upgrading.'
              },
              {
                q: 'Can I get a refund?',
                a: 'We offer a 14-day money-back guarantee for all paid plans. No questions asked.'
              }
            ].map((faq, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                    {faq.q}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="max-w-4xl mx-auto text-center">
          <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-none shadow-2xl">
            <CardContent className="p-8 md:p-12">
              <h2 className="text-3xl md:text-4xl font-bold mb-4">
                Ready to accelerate your research?
              </h2>
              <p className="text-xl mb-8 opacity-90">
                Join thousands of researchers and students using AI to transform their work
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild className="text-lg px-8">
                  <Link href="/auth/signup">
                    Start Free
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-lg px-8 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600"
                >
                  <Link href="/dashboard">
                    Try Demo
                  </Link>
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-8 mt-16">
        <div className="container mx-auto px-4 text-center text-gray-600 dark:text-gray-400">
          <p>
            &copy; 2025 {t('common.appName')}. All rights reserved.
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link href="/terms" className="hover:text-blue-600 transition">
              Terms
            </Link>
            <Link href="/privacy" className="hover:text-blue-600 transition">
              Privacy
            </Link>
            <Link href="/" className="hover:text-blue-600 transition">
              Home
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
