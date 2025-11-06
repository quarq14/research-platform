"use server"

import { createClient } from "@/lib/supabase/server"

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

const SEMANTIC_SCHOLAR_BASE = "https://api.semanticscholar.org/graph/v1"
const OPENALEX_BASE = "https://api.openalex.org"

async function searchOpenAlex(query: string, limit = 10): Promise<Paper[]> {
  try {
    const response = await fetch(`${OPENALEX_BASE}/works?search=${encodeURIComponent(query)}&per_page=${limit}`)

    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status}`)
    }

    const data = await response.json()

    return data.results.map((work: any) => ({
      id: work.id,
      title: work.title,
      authors: work.authorships?.map((a: any) => a.author?.display_name || "Unknown") || [],
      year: work.publication_year,
      journal: work.primary_location?.source?.display_name,
      abstract: work.abstract_inverted_index ? reconstructAbstract(work.abstract_inverted_index) : undefined,
      url: work.doi ? `https://doi.org/${work.doi}` : work.id,
      doi: work.doi,
      citationCount: work.cited_by_count,
    }))
  } catch (error: any) {
    console.error("[v0] OpenAlex error:", error)
    return []
  }
}

function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const words: [string, number][] = []

  for (const [word, positions] of Object.entries(invertedIndex)) {
    positions.forEach((pos) => {
      words.push([word, pos])
    })
  }

  words.sort((a, b) => a[1] - b[1])
  return (
    words
      .map((w) => w[0])
      .join(" ")
      .slice(0, 500) + "..."
  )
}

export async function searchAcademicPapersAction(query: string) {
  try {
    const papers = await searchOpenAlex(query, 10)

    return {
      success: true,
      papers,
    }
  } catch (error: any) {
    console.error("[v0] Search action error:", error)
    return { success: false, error: error.message || "Arama başarısız" }
  }
}

export async function saveSourceAction({
  userId,
  paper,
}: {
  userId: string
  paper: Paper
}) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { success: false, error: "Veritabanı bağlantısı yapılandırılmamış" }
    }

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return { success: false, error: "Yetkilendirme hatası" }
    }

    // Save source
    const { error } = await supabase.from("sources").insert({
      user_id: userId,
      title: paper.title,
      authors: paper.authors,
      year: paper.year,
      journal: paper.journal,
      abstract: paper.abstract,
      url: paper.url,
      doi: paper.doi,
    })

    if (error) {
      console.error("[v0] Save source error:", error)
      return { success: false, error: "Kaynak kaydedilemedi" }
    }

    // Update profile stats
    const { data: profile } = await supabase.from("profiles").select("searches_used").eq("id", userId).single()

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          searches_used: (profile.searches_used || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Save source action error:", error)
    return { success: false, error: error.message || "Beklenmeyen bir hata oluştu" }
  }
}
