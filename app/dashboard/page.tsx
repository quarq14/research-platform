'use client'

import type React from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  FileText, Upload, Search, BookOpen, MessageSquare, TrendingUp,
  CheckCircle, Zap, BarChart3, Calendar, Clock, Award
} from "lucide-react"
import Link from "next/link"
import { useLocale } from "@/contexts/LocaleContext"
import { useAuth } from "@/contexts/AuthContext"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { getSupabase } from "@/lib/supabase"

export default function DashboardPage() {
  const { t, locale } = useLocale()
  const { user, loading } = useAuth()
  const router = useRouter()
  const [profile, setProfile] = useState<any>(null)
  const [loadingProfile, setLoadingProfile] = useState(true)

  useEffect(() => {
    if (!loading && !user) {
      router.push('/auth/login')
    }
  }, [user, loading, router])

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return

      const supabase = getSupabase()
      if (!supabase) return

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()

        if (!error && data) {
          setProfile(data)
        }
      } catch (error) {
        console.error('Error loading profile:', error)
      } finally {
        setLoadingProfile(false)
      }
    }

    loadProfile()
  }, [user])

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-purple-950 flex items-center justify-center">
        <div className="text-center">
          <div className="h-12 w-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 dark:text-gray-400">{t('common.loading')}</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return null
  }

  const stats = [
    {
      label: t('dashboard.tokensUsed'),
      value: profile?.tokens_used || 0,
      max: profile?.plan === 'pro' ? '1M' : '50K',
      icon: Zap,
      color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20',
      trend: '+12%'
    },
    {
      label: t('dashboard.pagesAnalyzed'),
      value: profile?.pages_analyzed || 0,
      max: profile?.plan === 'pro' ? 500 : 20,
      icon: FileText,
      color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/20',
      trend: '+8%'
    },
    {
      label: t('dashboard.searchesMade'),
      value: profile?.searches_used || 0,
      max: profile?.plan === 'pro' ? 500 : 10,
      icon: Search,
      color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/20',
      trend: '+15%'
    },
    {
      label: locale === 'en' ? 'Documents' : 'Belgeler',
      value: profile?.documents_used || 0,
      max: locale === 'en' ? 'Unlimited' : 'Sınırsız',
      icon: BookOpen,
      color: 'text-green-600 bg-green-100 dark:bg-green-900/20',
      trend: '+5%'
    }
  ]

  const quickActions = [
    {
      title: t('dashboard.uploadPDF'),
      description: locale === 'en' ? 'Upload and analyze PDFs' : 'PDF yükle ve analiz et',
      icon: Upload,
      href: '/upload',
      color: 'from-blue-500 to-cyan-500'
    },
    {
      title: t('nav.chat'),
      description: locale === 'en' ? 'Chat with your documents' : 'Belgelerinizle sohbet edin',
      icon: MessageSquare,
      href: '/chat',
      color: 'from-purple-500 to-pink-500'
    },
    {
      title: t('nav.write'),
      description: locale === 'en' ? 'Write with AI assistance' : 'Yapay zeka ile yazın',
      icon: FileText,
      href: '/write',
      color: 'from-pink-500 to-rose-500'
    },
    {
      title: t('dashboard.searchSources'),
      description: locale === 'en' ? 'Find academic sources' : 'Akademik kaynaklar bulun',
      icon: Search,
      href: '/sources',
      color: 'from-indigo-500 to-purple-500'
    }
  ]

  const recentActivity = [
    {
      action: locale === 'en' ? 'Uploaded PDF' : 'PDF yüklendi',
      file: locale === 'en' ? 'Research_Paper.pdf' : 'Arastirma_Makalesi.pdf',
      time: locale === 'en' ? '2 hours ago' : '2 saat önce',
      icon: Upload
    },
    {
      action: locale === 'en' ? 'Chat Session' : 'Sohbet Oturumu',
      file: locale === 'en' ? 'Literature Review' : 'Literatür İncelemesi',
      time: locale === 'en' ? '5 hours ago' : '5 saat önce',
      icon: MessageSquare
    },
    {
      action: locale === 'en' ? 'Academic Search' : 'Akademik Arama',
      file: locale === 'en' ? 'Machine Learning Papers' : 'Makine Öğrenmesi Makaleleri',
      time: locale === 'en' ? '1 day ago' : '1 gün önce',
      icon: Search
    }
  ]

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-900 dark:to-purple-950">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {t('dashboard.welcome')}, {profile?.full_name || user.email?.split('@')[0]}!
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {locale === 'en'
                  ? 'Here\'s what\'s happening with your research today'
                  : 'İşte bugün araştırmanızda neler oluyor'}
              </p>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" asChild>
                <Link href="/settings">
                  {t('nav.settings')}
                </Link>
              </Button>
              <Button asChild className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700">
                <Link href="/upload">
                  <Upload className="mr-2 h-4 w-4" />
                  {t('dashboard.uploadPDF')}
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats.map((stat, idx) => (
            <Card key={idx} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">{stat.label}</p>
                    <div className="flex items-baseline gap-2">
                      <p className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {stat.value.toLocaleString()}
                      </p>
                      <span className="text-sm text-gray-500">/ {stat.max}</span>
                    </div>
                    <div className="flex items-center gap-1 mt-2">
                      <TrendingUp className="h-3 w-3 text-green-600" />
                      <span className="text-xs text-green-600">{stat.trend}</span>
                    </div>
                  </div>
                  <div className={`p-3 rounded-xl ${stat.color}`}>
                    <stat.icon className="h-6 w-6" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Quick Actions */}
          <div className="lg:col-span-2">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t('dashboard.quickActions')}
              </h2>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              {quickActions.map((action, idx) => (
                <Link key={idx} href={action.href}>
                  <Card className="hover:shadow-xl transition-all hover:-translate-y-1 cursor-pointer group">
                    <CardContent className="p-6">
                      <div className={`bg-gradient-to-br ${action.color} p-3 rounded-xl w-fit mb-4 group-hover:scale-110 transition-transform shadow-lg`}>
                        <action.icon className="h-6 w-6 text-white" />
                      </div>
                      <h3 className="font-semibold text-lg mb-1 text-gray-900 dark:text-gray-100">
                        {action.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {action.description}
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>

          {/* Current Plan */}
          <div>
            <div className="mb-4">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                {t('dashboard.currentPlan')}
              </h2>
            </div>
            <Card className="bg-gradient-to-br from-blue-600 to-purple-600 text-white border-none shadow-xl">
              <CardContent className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <Award className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="text-sm opacity-90">
                      {locale === 'en' ? 'Current Plan' : 'Mevcut Plan'}
                    </p>
                    <p className="text-2xl font-bold uppercase">
                      {profile?.plan || 'FREE'}
                    </p>
                  </div>
                </div>

                {profile?.plan === 'free' && (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {locale === 'en' ? '50K tokens/month' : '50K token/ay'}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {locale === 'en' ? 'Basic features' : 'Temel özellikler'}
                      </div>
                    </div>
                    <Button asChild variant="secondary" className="w-full">
                      <Link href="/pricing">
                        {t('dashboard.upgradePlan')}
                      </Link>
                    </Button>
                  </>
                )}

                {profile?.plan === 'pro' && (
                  <>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {locale === 'en' ? '1M tokens/month' : '1M token/ay'}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {locale === 'en' ? 'All AI providers' : 'Tüm AI sağlayıcıları'}
                      </div>
                      <div className="flex items-center gap-2 text-sm">
                        <CheckCircle className="h-4 w-4" />
                        {locale === 'en' ? 'Priority support' : 'Öncelikli destek'}
                      </div>
                    </div>
                    <div className="text-sm opacity-90">
                      <Calendar className="inline h-4 w-4 mr-1" />
                      {locale === 'en' ? 'Renews ' : 'Yenileme '}
                      {profile?.subscription_end
                        ? new Date(profile.subscription_end).toLocaleDateString(locale)
                        : '-'}
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <div className="mt-6">
              <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">
                {locale === 'en' ? 'Recent Activity' : 'Son Aktivite'}
              </h2>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-4">
                    {recentActivity.map((activity, idx) => (
                      <div key={idx} className="flex items-start gap-3 pb-4 last:pb-0 border-b last:border-b-0">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                          <activity.icon className="h-4 w-4 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                            {activity.action}
                          </p>
                          <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                            {activity.file}
                          </p>
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="h-3 w-3 text-gray-400" />
                            <span className="text-xs text-gray-500">{activity.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>

        {/* Usage Chart Section */}
        <Card className="mb-8">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">
                  {t('dashboard.usageStats')}
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {locale === 'en' ? 'Your usage this month' : 'Bu ayki kullanımınız'}
                </p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-600" />
            </div>

            <div className="space-y-4">
              {/* Token Usage Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {locale === 'en' ? 'Tokens' : 'Tokenler'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {profile?.tokens_used || 0} / {profile?.plan === 'pro' ? '1,000,000' : '50,000'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-600 to-purple-600 transition-all"
                    style={{
                      width: `${Math.min(
                        ((profile?.tokens_used || 0) / (profile?.plan === 'pro' ? 1000000 : 50000)) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>

              {/* Pages Usage Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {locale === 'en' ? 'Pages' : 'Sayfalar'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {profile?.pages_analyzed || 0} / {profile?.plan === 'pro' ? '500' : '20'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-green-600 to-teal-600 transition-all"
                    style={{
                      width: `${Math.min(
                        ((profile?.pages_analyzed || 0) / (profile?.plan === 'pro' ? 500 : 20)) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>

              {/* Searches Usage Bar */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {locale === 'en' ? 'Searches' : 'Aramalar'}
                  </span>
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {profile?.searches_used || 0} / {profile?.plan === 'pro' ? '500' : '10'}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-purple-600 to-pink-600 transition-all"
                    style={{
                      width: `${Math.min(
                        ((profile?.searches_used || 0) / (profile?.plan === 'pro' ? 500 : 10)) * 100,
                        100
                      )}%`
                    }}
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}
