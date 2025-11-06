import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import { supabase } from '@/lib/supabase'
import { exportDocument, ExportFormat } from '@/utils/export'
import { FileText, Save, Download, BookOpen, Loader2 } from 'lucide-react'

type DocumentType = 'article' | 'review' | 'assignment' | 'blog'

export default function WritingPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [docType, setDocType] = useState<DocumentType>('article')
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)
  const [documents, setDocuments] = useState<any[]>([])

  useEffect(() => {
    loadDocuments()
  }, [user])

  const loadDocuments = async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('documents')
      .select('*')
      .eq('user_id', user.id)
      .order('updated_at', { ascending: false })
    
    if (data) setDocuments(data)
  }

  const saveDocument = async () => {
    if (!user || !title.trim()) return

    setSaving(true)
    try {
      const { error } = await supabase
        .from('documents')
        .insert({
          user_id: user.id,
          title,
          content,
          type: docType,
          language: locale,
          status: 'draft'
        })

      if (error) throw error
      
      setTitle('')
      setContent('')
      loadDocuments()
      alert(locale === 'tr' ? 'Döküman kaydedildi!' : 'Document saved!')
    } catch (error) {
      console.error('Save error:', error)
    } finally {
      setSaving(false)
    }
  }

  const loadDocument = (doc: any) => {
    setTitle(doc.title)
    setContent(doc.content || '')
    setDocType(doc.type)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!title.trim() || !content.trim()) {
      alert(locale === 'tr' 
        ? 'Başlık ve içerik boş olamaz!' 
        : 'Title and content cannot be empty!')
      return
    }

    setExporting(true)
    try {
      await exportDocument(title, content, format)
      alert(locale === 'tr' 
        ? `${format.toUpperCase()} başarıyla indirildi!` 
        : `${format.toUpperCase()} downloaded successfully!`)
    } catch (error: any) {
      console.error('Export error:', error)
      alert(locale === 'tr' 
        ? `Export hatası: ${error.message}` 
        : `Export error: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'tr' ? 'Akademik Yazma' : 'Academic Writing'}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Editor */}
          <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {locale === 'tr' ? 'Döküman Türü' : 'Document Type'}
              </label>
              <select
                value={docType}
                onChange={(e) => setDocType(e.target.value as DocumentType)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                <option value="article">{locale === 'tr' ? 'Makale' : 'Article'}</option>
                <option value="review">{locale === 'tr' ? 'Literatür Taraması' : 'Literature Review'}</option>
                <option value="assignment">{locale === 'tr' ? 'Ödev' : 'Assignment'}</option>
                <option value="blog">{locale === 'tr' ? 'Blog' : 'Blog'}</option>
              </select>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {locale === 'tr' ? 'Başlık' : 'Title'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={locale === 'tr' ? 'Döküman başlığını girin...' : 'Enter document title...'}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                {locale === 'tr' ? 'İçerik' : 'Content'}
              </label>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={locale === 'tr' ? 'Yazmaya başlayın...' : 'Start writing...'}
                rows={20}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              />
              <div className="mt-2 text-sm text-gray-500">
                {locale === 'tr' ? 'Kelime sayısı:' : 'Word count:'} {content.split(/\s+/).filter(Boolean).length}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-3">
              <button
                onClick={saveDocument}
                disabled={saving || !title.trim()}
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                {saving ? (locale === 'tr' ? 'Kaydediliyor...' : 'Saving...') : (locale === 'tr' ? 'Kaydet' : 'Save')}
              </button>
              <button
                onClick={() => handleExport('docx')}
                disabled={exporting || !title.trim()}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                DOCX
              </button>
              <button
                onClick={() => handleExport('pdf')}
                disabled={exporting || !title.trim()}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                PDF
              </button>
              <button
                onClick={() => handleExport('md')}
                disabled={exporting || !title.trim()}
                className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              >
                {exporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Download className="w-5 h-5" />}
                MD
              </button>
            </div>
          </div>

          {/* Sidebar - Documents List */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {locale === 'tr' ? 'Dökümanlar' : 'Documents'}
            </h3>
            <div className="space-y-3">
              {documents.length === 0 ? (
                <p className="text-sm text-gray-500">
                  {locale === 'tr' ? 'Henüz döküman yok' : 'No documents yet'}
                </p>
              ) : (
                documents.map((doc) => (
                  <button
                    key={doc.id}
                    onClick={() => loadDocument(doc)}
                    className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="font-medium text-sm truncate">{doc.title}</div>
                    <div className="text-xs text-gray-500 mt-1">
                      {new Date(doc.updated_at).toLocaleDateString(locale === 'tr' ? 'tr-TR' : 'en-US')}
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
