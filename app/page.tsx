'use client'

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  BookOpen, FileText, MessageSquare, Search, Sparkles, Bot, Zap, Shield,
  CheckCircle, Users, Globe, TrendingUp, Star, Quote, ChevronRight, Menu, X
} from "lucide-react"
import Link from "next/link"
import { useLocale } from "@/contexts/LocaleContext"
import { useState } from "react"

export default function HomePage() {
  const { t, locale, setLocale } = useLocale()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  const features = [
    {
      icon: FileText,
      titleKey: "home.features.pdfAnalysis.title",
      descKey: "home.features.pdfAnalysis.description",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: MessageSquare,
      titleKey: "home.features.chatPDF.title",
      descKey: "home.features.chatPDF.description",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: Search,
      titleKey: "home.features.academicSearch.title",
      descKey: "home.features.academicSearch.description",
      color: "from-pink-500 to-rose-500"
    },
    {
      icon: BookOpen,
      titleKey: "home.features.writingAssistant.title",
      descKey: "home.features.writingAssistant.description",
      color: "from-indigo-500 to-purple-500"
    }
  ]

  const benefits = [
    {
      icon: Shield,
      titleKey: "home.benefits.academic.title",
      descKey: "home.benefits.academic.description"
    },
    {
      icon: Globe,
      titleKey: "home.benefits.multiLingual.title",
      descKey: "home.benefits.multiLingual.description"
    },
    {
      icon: Zap,
      titleKey: "home.benefits.privacy.title",
      descKey: "home.benefits.privacy.description"
    },
    {
      icon: TrendingUp,
      titleKey: "home.benefits.flexible.title",
      descKey: "home.benefits.flexible.description"
    }
  ]

  const testimonials = [
    {
      name: "Dr. Sarah Johnson",
      role: "PhD Researcher",
      content: "This platform has revolutionized my research workflow. The AI-powered search and writing assistance are game-changers.",
      rating: 5
    },
    {
      name: "Michael Chen",
      role: "Graduate Student",
      content: "Being able to chat with my PDFs and get instant insights saves me hours every week. Highly recommended!",
      rating: 5
    },
    {
      name: "Prof. Emma Williams",
      role: "University Professor",
      content: "A must-have tool for academic writing. The citation manager and plagiarism checker are incredibly accurate.",
      rating: 5
    }
  ]

  const faqs = [
    {
      questionKey: "Is the free plan really free forever?",
      answerKey: "Yes! Our free plan includes 50,000 tokens per month, 20 pages of uploads, and basic features at no cost."
    },
    {
      questionKey: "Which AI providers do you support?",
      answerKey: "We support Groq (free), OpenAI, Claude, Gemini, MiniMax, and OpenRouter. You can start with Groq for free or add your own API keys."
    },
    {
      questionKey: "Is my data secure and private?",
      answerKey: "Absolutely! All data is encrypted in transit and at rest. We never share your documents or research with third parties."
    },
    {
      questionKey: "Can I cancel my subscription anytime?",
      answerKey: "Yes, you can cancel your subscription at any time with no questions asked. You'll retain access until the end of your billing period."
    }
  ]

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950">
      {/* Header */}
      <header className="border-b bg-white/80 dark:bg-gray-900/80 backdrop-blur-md sticky top-0 z-50 shadow-sm">
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

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
              {t('home.features.title')}
            </Link>
            <Link href="/tools" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
              {locale === 'en' ? 'Tools' : 'Araçlar'}
            </Link>
            <Link href="/dashboard" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
              {t('nav.dashboard')}
            </Link>
            <Link href="/pricing" className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition">
              {t('nav.pricing')}
            </Link>
            <button
              onClick={() => setLocale(locale === 'en' ? 'tr' : 'en')}
              className="text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-blue-600 transition"
            >
              {locale === 'en' ? '🇹🇷 TR' : '🇬🇧 EN'}
            </button>
          </nav>

          <div className="hidden md:flex gap-2">
            <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg">
              <Link href="/dashboard">
                <Sparkles className="mr-2 h-4 w-4" />
                {locale === 'en' ? 'Launch Platform' : 'Platformu Başlat'}
              </Link>
            </Button>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-white dark:bg-gray-900 py-4">
            <nav className="container mx-auto px-4 flex flex-col gap-4">
              <Link href="#features" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('home.features.title')}
              </Link>
              <Link href="/tools" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {locale === 'en' ? 'Tools' : 'Araçlar'}
              </Link>
              <Link href="/dashboard" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.dashboard')}
              </Link>
              <Link href="/pricing" className="text-sm font-medium" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.pricing')}
              </Link>
              <button
                onClick={() => {
                  setLocale(locale === 'en' ? 'tr' : 'en')
                  setMobileMenuOpen(false)
                }}
                className="text-sm font-medium text-left"
              >
                {locale === 'en' ? '🇹🇷 Türkçe' : '🇬🇧 English'}
              </button>
              <div className="pt-4 border-t">
                <Button asChild className="w-full bg-gradient-to-r from-blue-600 to-purple-600">
                  <Link href="/dashboard">
                    <Sparkles className="mr-2 h-4 w-4" />
                    {locale === 'en' ? 'Launch Platform' : 'Platformu Başlat'}
                  </Link>
                </Button>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="container mx-auto px-4 py-16 md:py-24 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-blue-400/10 via-purple-400/10 to-pink-400/10 blur-3xl" />
          <div className="relative z-10 max-w-5xl mx-auto">
            <div className="inline-flex items-center gap-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full mb-6 border border-purple-200 dark:border-purple-800 shadow-sm">
              <Sparkles className="h-4 w-4 text-purple-600 animate-pulse" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                {t('home.hero.badge')}
              </span>
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight mb-6 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent leading-tight">
              {t('home.hero.title')}
            </h1>

            <p className="text-lg md:text-xl text-gray-600 dark:text-gray-400 mb-8 max-w-3xl mx-auto">
              {t('home.hero.subtitle')}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all text-lg px-8 py-6">
                <Link href="/dashboard">
                  <Sparkles className="mr-2 h-6 w-6" />
                  {locale === 'en' ? 'Start Research Now' : 'Hemen Başla'}
                </Link>
              </Button>
              <Button size="lg" variant="outline" asChild className="border-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-lg px-8 py-6">
                <Link href="/tools">
                  <Bot className="mr-2 h-6 w-6" />
                  {locale === 'en' ? 'Explore Tools' : 'Araçları Keşfet'}
                </Link>
              </Button>
            </div>

            {/* Feature badges */}
            <div className="flex flex-wrap gap-3 justify-center text-sm">
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <Zap className="inline h-4 w-4 text-yellow-500 mr-1" />
                {locale === 'en' ? 'Free Groq API included' : 'Ücretsiz Groq API'}
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <Shield className="inline h-4 w-4 text-green-500 mr-1" />
                {locale === 'en' ? 'Secure & Private' : 'Güvenli ve Özel'}
              </div>
              <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm px-4 py-2 rounded-full border border-gray-200 dark:border-gray-700 shadow-sm">
                <Bot className="inline h-4 w-4 text-blue-500 mr-1" />
                {locale === 'en' ? '5+ AI Providers' : '5+ Yapay Zeka'}
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="container mx-auto px-4 py-16 md:py-20 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.features.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {locale === 'en'
                ? 'Everything you need for academic research and writing in one platform'
                : 'Akademik araştırma ve yazım için ihtiyacınız olan her şey tek platformda'}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {features.map((feature, idx) => (
              <Card
                key={idx}
                className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 border-2 border-transparent hover:border-purple-200 dark:hover:border-purple-800 bg-white dark:bg-gray-800"
              >
                <CardContent className="p-6">
                  <div className={`bg-gradient-to-br ${feature.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                    <feature.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{t(feature.titleKey)}</h3>
                  <p className="text-gray-600 dark:text-gray-400 text-sm">{t(feature.descKey)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* AI Providers Section */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.aiProviders.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('home.aiProviders.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 max-w-5xl mx-auto">
            {[
              { name: "Groq", subtitle: t('home.aiProviders.free'), color: "from-yellow-500 to-orange-500" },
              { name: "OpenAI", subtitle: t('home.aiProviders.openai'), color: "from-green-500 to-teal-500" },
              { name: "Claude", subtitle: t('home.aiProviders.claude'), color: "from-purple-500 to-pink-500" },
              { name: "Gemini", subtitle: t('home.aiProviders.gemini'), color: "from-blue-500 to-cyan-500" },
              { name: "OpenRouter", subtitle: t('home.aiProviders.openrouter'), color: "from-red-500 to-orange-500" },
            ].map((provider, idx) => (
              <Card
                key={idx}
                className="hover:scale-105 transition-transform hover:shadow-lg"
              >
                <CardContent className="p-4 text-center">
                  <div className={`h-12 w-12 mx-auto mb-2 rounded-full bg-gradient-to-r ${provider.color} flex items-center justify-center shadow-lg`}>
                    <Bot className="h-6 w-6 text-white" />
                  </div>
                  <p className="font-semibold text-sm">{provider.name}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{provider.subtitle}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Benefits Section */}
        <section className="container mx-auto px-4 py-16 md:py-20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-purple-900/20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('home.benefits.title')}
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl mx-auto">
            {benefits.map((benefit, idx) => (
              <div key={idx} className="text-center">
                <div className="bg-white dark:bg-gray-800 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <benefit.icon className="h-8 w-8 text-blue-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">{t(benefit.titleKey)}</h3>
                <p className="text-gray-600 dark:text-gray-400 text-sm">{t(benefit.descKey)}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Testimonials Section */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {locale === 'en' ? 'What Our Users Say' : 'Kullanıcılarımız Ne Diyor'}
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, idx) => (
              <Card key={idx} className="hover:shadow-xl transition-shadow">
                <CardContent className="p-6">
                  <Quote className="h-8 w-8 text-purple-600 mb-4" />
                  <p className="text-gray-700 dark:text-gray-300 mb-4 italic">
                    &ldquo;{testimonial.content}&rdquo;
                  </p>
                  <div className="flex items-center gap-1 mb-3">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <div className="border-t pt-4">
                    <p className="font-semibold text-gray-900 dark:text-gray-100">{testimonial.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Pricing Teaser */}
        <section id="pricing" className="container mx-auto px-4 py-16 md:py-20 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {t('pricing.title')}
            </h2>
            <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              {t('pricing.subtitle')}
            </p>
          </div>

          <div className="max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12 border-2 border-purple-200 dark:border-purple-800">
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {locale === 'en' ? '$0' : '0₺'}
                </div>
                <div className="text-sm text-gray-500 mb-4">{t('pricing.free.name')}</div>
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto" />
              </div>
              <div className="text-center border-x border-gray-200 dark:border-gray-700">
                <div className="text-3xl font-bold text-blue-600 mb-2">
                  {locale === 'en' ? '$19.99' : '399₺'}
                </div>
                <div className="text-sm text-gray-500 mb-4">{t('pricing.pro.name')}</div>
                <Zap className="h-12 w-12 text-blue-600 mx-auto" />
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">
                  {locale === 'en' ? '$49.99' : '999₺'}
                </div>
                <div className="text-sm text-gray-500 mb-4">{t('pricing.team.name')}</div>
                <Users className="h-12 w-12 text-purple-600 mx-auto" />
              </div>
            </div>

            <div className="text-center mt-8">
              <Button size="lg" asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/pricing">
                  {locale === 'en' ? 'View All Plans' : 'Tüm Planları Görüntüle'}
                  <ChevronRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {locale === 'en' ? 'Frequently Asked Questions' : 'Sık Sorulan Sorular'}
            </h2>
          </div>

          <div className="max-w-3xl mx-auto space-y-4">
            {faqs.map((faq, idx) => (
              <Card key={idx} className="hover:shadow-lg transition-shadow">
                <CardContent className="p-6">
                  <h3 className="font-semibold text-lg mb-2 text-gray-900 dark:text-gray-100">
                    {faq.questionKey}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {faq.answerKey}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="container mx-auto px-4 py-16 md:py-20">
          <div className="bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 rounded-3xl p-8 md:p-12 text-center text-white shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-black/10"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-bold mb-4">
                {locale === 'en'
                  ? 'Ready to Transform Your Research?'
                  : 'Araştırmanızı Dönüştürmeye Hazır mısınız?'}
              </h2>
              <p className="text-xl md:text-2xl mb-8 opacity-95">
                {locale === 'en'
                  ? 'Start using AI-powered research tools instantly. No signup required.'
                  : 'Yapay zeka destekli araştırma araçlarını hemen kullanmaya başlayın. Kayıt gereksiz.'}
              </p>
              <Button size="lg" variant="secondary" asChild className="text-lg px-10 py-6 shadow-xl hover:scale-105 transition-transform">
                <Link href="/dashboard">
                  <Sparkles className="mr-2 h-6 w-6" />
                  {locale === 'en' ? 'Launch Platform Now' : 'Platformu Hemen Başlat'}
                  <ChevronRight className="ml-2 h-6 w-6" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm py-8">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span className="font-bold">{t('common.appName')}</span>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t('common.tagline')}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{locale === 'en' ? 'Product' : 'Ürün'}</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="/dashboard" className="hover:text-blue-600">{t('nav.dashboard')}</Link></li>
                <li><Link href="/pricing" className="hover:text-blue-600">{t('nav.pricing')}</Link></li>
                <li><Link href="#features" className="hover:text-blue-600">{t('home.features.title')}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{locale === 'en' ? 'Resources' : 'Kaynaklar'}</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-600">{locale === 'en' ? 'Documentation' : 'Belgeler'}</Link></li>
                <li><Link href="#" className="hover:text-blue-600">{locale === 'en' ? 'API' : 'API'}</Link></li>
                <li><Link href="#" className="hover:text-blue-600">{locale === 'en' ? 'Support' : 'Destek'}</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">{locale === 'en' ? 'Company' : 'Şirket'}</h3>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                <li><Link href="#" className="hover:text-blue-600">{locale === 'en' ? 'About' : 'Hakkımızda'}</Link></li>
                <li><Link href="#" className="hover:text-blue-600">{locale === 'en' ? 'Privacy' : 'Gizlilik'}</Link></li>
                <li><Link href="#" className="hover:text-blue-600">{locale === 'en' ? 'Terms' : 'Şartlar'}</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t pt-8 text-center text-sm text-gray-600 dark:text-gray-400">
            <p>&copy; 2025 {t('common.appName')}. {locale === 'en' ? 'All rights reserved.' : 'Tüm hakları saklıdır.'}</p>
          </div>
        </div>
      </footer>
    </div>
  )
}
