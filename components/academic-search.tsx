"use client"

import { useState } from "react"
import { Search, BookOpen, ExternalLink, Plus, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { searchAcademicPapersAction, saveSourceAction } from "@/app/actions/academic-search"

type Paper = {
  id: string
  title: string
  authors: string[]
  year: number
  journal?: string
  abstract?: string
  url?: string
  doi?: string
  citationCount?: number
}

export function AcademicSearch({ userId }: { userId: string }) {
  const [query, setQuery] = useState("")
  const [searching, setSearching] = useState(false)
  const [results, setResults] = useState<Paper[]>([])

  const performSearch = async () => {
    if (!query.trim()) return

    setSearching(true)
    try {
      const result = await searchAcademicPapersAction(query)

      if (!result.success) {
        throw new Error(result.error || "Arama başarısız")
      }

      setResults(result.papers || [])

      if (result.papers?.length === 0) {
        alert("Sonuç bulunamadı. Farklı anahtar kelimeler deneyin.")
      }
    } catch (error: any) {
      console.error("[v0] Search error:", error)
      alert(`Arama hatası: ${error.message}`)
    } finally {
      setSearching(false)
    }
  }

  const saveSource = async (paper: Paper) => {
    try {
      const result = await saveSourceAction({
        userId,
        paper,
      })

      if (!result.success) {
        throw new Error(result.error || "Kaydetme başarısız")
      }

      alert("Kaynak kaydedildi!")
    } catch (error: any) {
      console.error("[v0] Save error:", error)
      alert(`Hata: ${error.message}`)
    }
  }

  const copyCitation = (paper: Paper, style: "APA" | "MLA" | "Chicago") => {
    const citation = formatCitation(paper, style)
    navigator.clipboard.writeText(citation)
    alert(`${style} atıf kopyalandı!`)
  }

  return (
    <>
      {/* Search */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <div className="flex gap-3">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyPress={(e) => e.key === "Enter" && performSearch()}
            placeholder="Anahtar kelime veya konu girin..."
            className="flex-1 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
          <Button onClick={performSearch} disabled={searching}>
            <Search className="w-5 h-5 mr-2" />
            {searching ? "Aranıyor..." : "Ara"}
          </Button>
        </div>
        <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-blue-800">
            Semantic Scholar ve OpenAlex API kullanılarak gerçek akademik makalelerde arama yapılır. API key olmadan da
            çalışır.
          </p>
        </div>
      </div>

      {/* Results */}
      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Arama Sonuçları ({results.length})</h2>
          {results.map((paper) => (
            <div key={paper.id} className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">{paper.title}</h3>
              <div className="text-sm text-gray-600 mb-2">
                {paper.authors.join(", ")} ({paper.year})
              </div>
              {paper.journal && <div className="text-sm text-gray-500 mb-3">{paper.journal}</div>}
              {paper.abstract && <p className="text-sm text-gray-700 mb-4 line-clamp-3">{paper.abstract}</p>}

              {/* Actions */}
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => saveSource(paper)} size="sm">
                  <Plus className="w-4 h-4 mr-2" />
                  Kaydet
                </Button>

                {paper.url && (
                  <Button asChild variant="outline" size="sm">
                    <a href={paper.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      Makaleyi Aç
                    </a>
                  </Button>
                )}

                {/* Citation Styles */}
                <div className="flex gap-2">
                  {(["APA", "MLA", "Chicago"] as const).map((style) => (
                    <Button key={style} onClick={() => copyCitation(paper, style)} variant="outline" size="sm">
                      {style}
                    </Button>
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
          <h3 className="text-lg font-medium text-gray-900 mb-2">Akademik Kaynak Arayın</h3>
          <p className="text-gray-600">Milyonlarca akademik makale arasında arama yapın</p>
        </div>
      )}
    </>
  )
}

function formatCitation(paper: Paper, style: "APA" | "MLA" | "Chicago"): string {
  const authors = paper.authors.slice(0, 3).join(", ") + (paper.authors.length > 3 ? ", et al." : "")

  switch (style) {
    case "APA":
      return `${authors} (${paper.year}). ${paper.title}. ${paper.journal || "Journal"}. ${paper.doi ? `https://doi.org/${paper.doi}` : paper.url || ""}`

    case "MLA":
      return `${authors}. "${paper.title}." ${paper.journal || "Journal"}, ${paper.year}. ${paper.url || ""}`

    case "Chicago":
      return `${authors}. "${paper.title}." ${paper.journal || "Journal"} (${paper.year}). ${paper.url || ""}`

    default:
      return `${authors} (${paper.year}). ${paper.title}.`
  }
}
