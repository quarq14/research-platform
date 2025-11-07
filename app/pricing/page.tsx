'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Check, Sparkles, BookOpen, X } from "lucide-react"
import Link from "next/link"
import { useLocale } from "@/contexts/LocaleContext"
import { useState } from "react"

export default function PricingPage() {
  const { t, locale, setLocale } = useLocale()
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly')

  const plans = [
    {
      id: 'free',
      nameKey: 'pricing.free.name',
      priceUSD: '$0',
      priceTRY: '0₺',
      period: locale === 'en' ? 'forever' : 'sonsuza kadar',
      descriptionKey: 'pricing.free.description',
      features: t('pricing.free.features') as unknown as string[],
      cta: locale === 'en' ? 'Get Started' : 'Başla',
      href: '/auth/signup',
      popular: false,
      highlighted: false,
    },
    {
      id: 'pro',
      nameKey: 'pricing.pro.name',
      priceUSD: billingCycle === 'monthly' ? '$19.99' : '$199.99',
      priceTRY: billingCycle === 'monthly' ? '399₺' : '3,999₺',
      period: billingCycle === 'monthly'
        ? (locale === 'en' ? 'per month' : 'aylık')
        : (locale === 'en' ? 'per year' : 'yıllık'),
      descriptionKey: 'pricing.pro.description',
      features: t('pricing.pro.features') as unknown as string[],
      cta: locale === 'en' ? 'Start Pro' : 'Pro\'ya Başla',
      href: '/checkout?plan=pro',
      popular: true,
      highlighted: true,
    },
    {
      id: 'team',
      nameKey: 'pricing.team.name',
      priceUSD: billingCycle === 'monthly' ? '$49.99' : '$499.99',
      priceTRY: billingCycle === 'monthly' ? '999₺' : '9,999₺',
      period: billingCycle === 'monthly'
        ? (locale === 'en' ? 'per month' : 'aylık')
        : (locale === 'en' ? 'per year' : 'yıllık'),
      descriptionKey: 'pricing.team.description',
      features: t('pricing.team.features') as unknown as string[],
      cta: locale === 'en' ? 'Start Team' : 'Team\'e Başla',
      href: '/checkout?plan=team',
      popular: false,
      highlighted: false,
    },
  ]

  const comparisonFeatures = [
    {
      category: locale === 'en' ? 'Usage Limits' : 'Kullanım Limitleri',
      items: [
        {
          feature: locale === 'en' ? 'Monthly Tokens' : 'Aylık Token',
          free: '50,000',
          pro: '1,000,000',
          team: '5,000,000'
        },
        {
          feature: locale === 'en' ? 'Page Uploads' : 'Sayfa Yükleme',
          free: '20',
          pro: '500',
          team: '2,000'
        },
        {
          feature: locale === 'en' ? 'Searches per Month' : 'Aylık Arama',
          free: '10',
          pro: '500',
          team: '2,000'
        }
      ]
    },
    {
      category: locale === 'en' ? 'AI Features' : 'Yapay Zeka Özellikleri',
      items: [
        {
          feature: locale === 'en' ? 'Basic AI Chat' : 'Temel AI Sohbet',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: locale === 'en' ? 'All AI Providers' : 'Tüm AI Sağlayıcıları',
          free: false,
          pro: true,
          team: true
        },
        {
          feature: locale === 'en' ? 'Custom AI Models' : 'Özel AI Modelleri',
          free: false,
          pro: true,
          team: true
        },
        {
          feature: locale === 'en' ? 'API Access' : 'API Erişimi',
          free: false,
          pro: false,
          team: true
        }
      ]
    },
    {
      category: locale === 'en' ? 'Research Tools' : 'Araştırma Araçları',
      items: [
        {
          feature: locale === 'en' ? 'PDF Upload & Chat' : 'PDF Yükleme ve Sohbet',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: locale === 'en' ? 'Academic Search' : 'Akademik Arama',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: locale === 'en' ? 'Writing Assistant' : 'Yazma Asistanı',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: locale === 'en' ? 'Plagiarism Checker' : 'İntihal Denetleyici',
          free: false,
          pro: '50 checks',
          team: locale === 'en' ? 'Unlimited' : 'Sınırsız'
        },
        {
          feature: locale === 'en' ? 'AI Content Detection' : 'AI İçerik Algılama',
          free: false,
          pro: true,
          team: true
        }
      ]
    },
    {
      category: locale === 'en' ? 'Collaboration' : 'İşbirliği',
      items: [
        {
          feature: locale === 'en' ? 'Team Members' : 'Takım Üyeleri',
          free: '1',
          pro: '1',
          team: '5+'
        },
        {
          feature: locale === 'en' ? 'Shared Projects' : 'Paylaşılan Projeler',
          free: false,
          pro: false,
          team: true
        },
        {
          feature: locale === 'en' ? 'Admin Dashboard' : 'Yönetici Paneli',
          free: false,
          pro: false,
          team: true
        }
      ]
    },
    {
      category: locale === 'en' ? 'Support' : 'Destek',
      items: [
        {
          feature: locale === 'en' ? 'Email Support' : 'E-posta Desteği',
          free: true,
          pro: true,
          team: true
        },
        {
          feature: locale === 'en' ? 'Priority Support' : 'Öncelikli Destek',
          free: false,
          pro: true,
          team: true
        },
        {
          feature: locale === 'en' ? 'Dedicated Support' : 'Özel Destek',
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
            <button
              onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')}
              className="text-sm font-medium text-gray-700 hover:text-blue-600 transition mr-2"
            >
              {locale === 'en' ? '🇹🇷 TR' : '🇬🇧 EN'}
            </button>
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
            {t('pricing.title')}
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400 mb-8">
            {t('pricing.subtitle')}
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
              {t('pricing.monthly')}
            </button>
            <button
              onClick={() => setBillingCycle('yearly')}
              className={`px-6 py-2 rounded-full font-medium transition-all flex items-center gap-2 ${
                billingCycle === 'yearly'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white shadow-md'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              {t('pricing.yearly')}
              <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">
                {t('pricing.save')}
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
                    {locale === 'en' ? 'MOST POPULAR' : 'EN POPÜLER'}
                  </span>
                </div>
              )}
              <CardHeader className="text-center pb-4">
                <CardTitle className="text-2xl font-bold">{t(plan.nameKey)}</CardTitle>
                <CardDescription className="text-base mt-2">
                  {t(plan.descriptionKey)}
                </CardDescription>
                <div className="mt-6">
                  <div className="text-5xl font-bold text-gray-900 dark:text-gray-100">
                    {locale === 'en' ? plan.priceUSD : plan.priceTRY}
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
            {locale === 'en' ? 'Detailed Comparison' : 'Detaylı Karşılaştırma'}
          </h2>
          <Card className="overflow-hidden">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="text-left p-4 font-semibold text-gray-900 dark:text-gray-100">
                        {locale === 'en' ? 'Features' : 'Özellikler'}
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-gray-100">
                        {t('pricing.free.name')}
                      </th>
                      <th className="text-center p-4 font-semibold text-blue-600 bg-blue-50 dark:bg-blue-900/20">
                        {t('pricing.pro.name')}
                      </th>
                      <th className="text-center p-4 font-semibold text-gray-900 dark:text-gray-100">
                        {t('pricing.team.name')}
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
            {locale === 'en' ? 'Frequently Asked Questions' : 'Sık Sorulan Sorular'}
          </h2>
          <div className="space-y-4">
            {[
              {
                q: locale === 'en'
                  ? 'Can I switch plans later?'
                  : 'Planımı daha sonra değiştirebilir miyim?',
                a: locale === 'en'
                  ? 'Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately.'
                  : 'Evet! Planınızı istediğiniz zaman yükseltebilir veya düşürebilirsiniz. Değişiklikler hemen geçerli olur.'
              },
              {
                q: locale === 'en'
                  ? 'What payment methods do you accept?'
                  : 'Hangi ödeme yöntemlerini kabul ediyorsunuz?',
                a: locale === 'en'
                  ? 'We accept credit cards, PayPal, and for Turkish users, we support iyzico for local payments.'
                  : 'Kredi kartı, PayPal ve Türk kullanıcılar için iyzico ile yerel ödemeler kabul ediyoruz.'
              },
              {
                q: locale === 'en'
                  ? 'Is there a free trial for paid plans?'
                  : 'Ücretli planlar için ücretsiz deneme var mı?',
                a: locale === 'en'
                  ? 'Yes! All paid plans include a 14-day free trial. No credit card required to start.'
                  : 'Evet! Tüm ücretli planlar 14 günlük ücretsiz deneme içerir. Başlamak için kredi kartı gerekmez.'
              },
              {
                q: locale === 'en'
                  ? 'Can I get a refund?'
                  : 'Para iadesi alabilir miyim?',
                a: locale === 'en'
                  ? 'We offer a 14-day money-back guarantee for all paid plans. No questions asked.'
                  : 'Tüm ücretli planlar için 14 günlük para iade garantisi sunuyoruz. Soru sorulmaz.'
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
                {locale === 'en'
                  ? 'Ready to accelerate your research?'
                  : 'Araştırmanızı hızlandırmaya hazır mısınız?'}
              </h2>
              <p className="text-xl mb-8 opacity-90">
                {locale === 'en'
                  ? 'Join thousands of researchers and students using AI to transform their work'
                  : 'Çalışmalarını dönüştürmek için yapay zeka kullanan binlerce araştırmacı ve öğrenciye katılın'}
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" variant="secondary" asChild className="text-lg px-8">
                  <Link href="/auth/signup">
                    {locale === 'en' ? 'Start Free' : 'Ücretsiz Başla'}
                  </Link>
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  asChild
                  className="text-lg px-8 bg-transparent border-2 border-white text-white hover:bg-white hover:text-blue-600"
                >
                  <Link href="/dashboard">
                    {locale === 'en' ? 'Try Demo' : 'Demoyu Dene'}
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
            &copy; 2025 {t('common.appName')}.{' '}
            {locale === 'en' ? 'All rights reserved.' : 'Tüm hakları saklıdır.'}
          </p>
          <div className="flex justify-center gap-6 mt-4 text-sm">
            <Link href="/terms" className="hover:text-blue-600 transition">
              {locale === 'en' ? 'Terms' : 'Şartlar'}
            </Link>
            <Link href="/privacy" className="hover:text-blue-600 transition">
              {locale === 'en' ? 'Privacy' : 'Gizlilik'}
            </Link>
            <Link href="/" className="hover:text-blue-600 transition">
              {locale === 'en' ? 'Home' : 'Ana Sayfa'}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}

import type React from 'react'
