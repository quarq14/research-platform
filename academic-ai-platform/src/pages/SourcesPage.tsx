import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import { supabase } from '@/lib/supabase'
import { searchPapers, formatCitation, Paper } from '@/services/academic'
import { Search, BookOpen, ExternalLink, Plus, AlertCircle } from 'lucide-react'

export default function SourcesPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const [query, setQuery] = useState('')
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Paper[]>([])
  const [savedSources, setSavedSources] = useState<any[]>([])

  const performSearch = async () => {
    if (!query.trim()) return

    setSearching(true)
    try {
      // Real API call to Semantic Scholar and OpenAlex
      const papers = await searchPapers(query)
      setResults(papers)
      
      if (papers.length === 0) {
        alert(locale === 'tr' 
          ? 'Sonuç bulunamadı. Farklı anahtar kelimeler deneyin.' 
          : 'No results found. Try different keywords.')
      }
    } catch (error: any) {
      console.error('Search error:', error)
      alert(locale === 'tr' 
        ? `Arama hatası: ${error.message}` 
        : `Search error: ${error.message}`)
    } finally {
      setSearching(false)
    }
  }

  const saveSource = async (paper: Paper) => {
    if (!user) return

    try {
      const { error } = await supabase
        .from('sources')
        .insert({
          user_id: user.id,
          title: paper.title,
          authors: paper.authors,
          year: paper.year,
          journal: paper.journal,
          abstract: paper.abstract,
          url: paper.url,
          doi: paper.doi
        })

      if (error) throw error
      
      alert(locale === 'tr' ? 'Kaynak kaydedildi!' : 'Source saved!')
    } catch (error) {
      console.error('Save error:', error)
    }
  }

  const copyCitation = (paper: Paper, style: 'APA' | 'MLA' | 'Chicago') => {
    const citation = formatCitation(paper, style)
    navigator.clipboard.writeText(citation)
    alert(`${style} ${locale === 'tr' ? 'atıf kopyalandı!' : 'citation copied!'}`)
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === 'tr' ? 'Akademik Kaynak Arama' : 'Academic Source Search'}
          </h1>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search */}
        <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
          <div className="flex gap-3">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && performSearch()}
              placeholder={locale === 'tr' ? 'Anahtar kelime veya konu girin...' : 'Enter keywords or topic...'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={performSearch}
              disabled={searching}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
            >
              <Search className="w-5 h-5" />
              {searching ? (locale === 'tr' ? 'Aranıyor...' : 'Searching...') : (locale === 'tr' ? 'Ara' : 'Search')}
            </button>
          </div>
          <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-blue-800">
              {locale === 'tr' 
                ? 'Semantic Scholar ve OpenAlex API kullanılarak gerçek akademik makalelerde arama yapılır. API key olmadan da çalışır.' 
                : 'Searches real academic papers using Semantic Scholar and OpenAlex APIs. Works without API key.'}
            </p>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold">
              {locale === 'tr' ? 'Arama Sonuçları' : 'Search Results'} ({results.length})
            </h2>
            {results.map((paper) => (
              <div key={paper.id} className="bg-white rounded-xl shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {paper.title}
                </h3>
                <div className="text-sm text-gray-600 mb-2">
                  {paper.authors.join(', ')} ({paper.year})
                </div>
                {paper.journal && (
                  <div className="text-sm text-gray-500 mb-3">{paper.journal}</div>
                )}
                {paper.abstract && (
                  <p className="text-sm text-gray-700 mb-4">{paper.abstract}</p>
                )}

                {/* Actions */}
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => saveSource(paper)}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
                  >
                    <Plus className="w-4 h-4" />
                    {locale === 'tr' ? 'Kaydet' : 'Save'}
                  </button>
                  
                  {paper.url && (
                    <a
                      href={paper.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      <ExternalLink className="w-4 h-4" />
                      {locale === 'tr' ? 'Makaleyi Aç' : 'Open Paper'}
                    </a>
                  )}

                  {/* Citation Styles */}
                  <div className="flex gap-2">
                    {(['APA', 'MLA', 'Chicago'] as const).map((style) => (
                      <button
                        key={style}
                        onClick={() => copyCitation(paper, style)}
                        className="px-3 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-xs"
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {results.length === 0 && !searching && (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {locale === 'tr' ? 'Akademik Kaynak Arayın' : 'Search Academic Sources'}
            </h3>
            <p className="text-gray-600">
              {locale === 'tr' 
                ? 'Milyonlarca akademik makale arasında arama yapın' 
                : 'Search through millions of academic papers'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
