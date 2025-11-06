import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Globe, FileText, Upload, Search, BookOpen, CheckCircle, Download, MessageSquare } from 'lucide-react'

export default function DashboardPage() {
  const { user, signOut } = useAuth()
  const { t, locale, setLocale } = useLocale()
  const navigate = useNavigate()
  const [profile, setProfile] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadProfile()
    }
  }, [user])

  const loadProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .maybeSingle()

      if (error) throw error
      setProfile(data)
    } catch (error) {
      console.error('Error loading profile:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-600">{t('common.loading')}</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900 cursor-pointer" onClick={() => navigate('/dashboard')}>
            {t('auth.title')}
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLocale(locale === 'tr' ? 'en' : 'tr')}
              className="flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              <Globe className="w-4 h-4" />
              <span>{locale === 'tr' ? 'EN' : 'TR'}</span>
            </button>
            <button
              onClick={signOut}
              className="px-4 py-2 text-sm text-gray-700 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {t('dashboard.signOut')}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Welcome Section */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            {t('dashboard.welcome')}, {profile?.name || user?.email}!
          </h2>
          <p className="text-gray-600">
            {t('dashboard.subtitle')}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">{t('dashboard.stats.documents')}</div>
            <div className="text-3xl font-bold text-blue-600">{profile?.documents_used || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">{t('dashboard.stats.pages')}</div>
            <div className="text-3xl font-bold text-green-600">{profile?.pages_uploaded || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">{t('dashboard.stats.wordCount')}</div>
            <div className="text-3xl font-bold text-purple-600">{profile?.word_count_used || 0}</div>
          </div>
          <div className="bg-white rounded-xl shadow-sm p-6">
            <div className="text-sm text-gray-600 mb-1">{t('dashboard.stats.searches')}</div>
            <div className="text-3xl font-bold text-orange-600">{profile?.searches_used || 0}</div>
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            title={t('dashboard.features.pdfUpload.title')}
            description={t('dashboard.features.pdfUpload.description')}
            Icon={Upload}
            onClick={() => navigate('/upload')}
            active
          />
          <FeatureCard
            title={locale === 'tr' ? 'PDF Sohbet' : 'PDF Chat'}
            description={locale === 'tr' ? 'PDF içeriklerinizle AI sohbeti yapın' : 'Chat with your PDF content using AI'}
            Icon={MessageSquare}
            onClick={() => navigate('/chat')}
            active
          />
          <FeatureCard
            title={t('dashboard.features.writing.title')}
            description={t('dashboard.features.writing.description')}
            Icon={FileText}
            onClick={() => navigate('/write')}
            active
          />
          <FeatureCard
            title={t('dashboard.features.literature.title')}
            description={t('dashboard.features.literature.description')}
            Icon={Search}
            onClick={() => navigate('/sources')}
            active
          />
          <FeatureCard
            title={t('dashboard.features.citations.title')}
            description={t('dashboard.features.citations.description')}
            Icon={BookOpen}
            status={t('dashboard.features.comingSoon')}
          />
          <FeatureCard
            title={t('dashboard.features.plagiarism.title')}
            description={t('dashboard.features.plagiarism.description')}
            Icon={CheckCircle}
            status={t('dashboard.features.comingSoon')}
          />
        </div>

        {/* Profile Info */}
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold mb-4">{t('dashboard.profile.title')}</h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dashboard.profile.email')}</span>
              <span className="font-medium">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dashboard.profile.plan')}</span>
              <span className="font-medium uppercase">{profile?.plan || 'FREE'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dashboard.profile.language')}</span>
              <span className="font-medium uppercase">{profile?.locale || locale}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">{t('dashboard.profile.joinDate')}</span>
              <span className="font-medium">
                {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US') : '-'}
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

function FeatureCard({ 
  title, 
  description, 
  Icon, 
  status, 
  onClick, 
  active 
}: { 
  title: string
  description: string
  Icon: any
  status?: string
  onClick?: () => void
  active?: boolean
}) {
  return (
    <div
      onClick={active ? onClick : undefined}
      className={`bg-white rounded-xl shadow-sm p-6 transition-all ${
        active 
          ? 'hover:shadow-lg cursor-pointer hover:scale-105' 
          : 'opacity-75'
      }`}
    >
      <Icon className="w-10 h-10 text-blue-600 mb-4" />
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{description}</p>
      {status && (
        <span className="inline-block px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-full">
          {status}
        </span>
      )}
      {active && !status && (
        <span className="inline-block px-3 py-1 bg-green-100 text-green-700 text-xs rounded-full">
          ✓ {Icon === Upload || Icon === MessageSquare || Icon === FileText || Icon === Search ? 'Aktif' : 'Active'}
        </span>
      )}
    </div>
  )
}
