export interface Paper {
  id: string
  title: string
  authors: string[]
  year: number
  abstract?: string
  url?: string
  doi?: string
  citationCount?: number
  venue?: string
}

export async function searchPapers(query: string): Promise<Paper[]> {
  try {
    // Using OpenAlex API (free, no API key required)
    const response = await fetch(
      `https://api.openalex.org/works?search=${encodeURIComponent(query)}&per-page=20&mailto=academic-ai@example.com`,
    )

    if (!response.ok) {
      throw new Error("Search failed")
    }

    const data = await response.json()

    return data.results.map((work: any) => ({
      id: work.id,
      title: work.title || "Untitled",
      authors: work.authorships?.map((a: any) => a.author?.display_name).filter(Boolean) || [],
      year: work.publication_year || new Date().getFullYear(),
      abstract: work.abstract,
      url: work.primary_location?.landing_page_url || work.doi,
      doi: work.doi?.replace("https://doi.org/", ""),
      citationCount: work.cited_by_count || 0,
      venue: work.primary_location?.source?.display_name,
    }))
  } catch (error) {
    console.error("Error searching papers:", error)
    return []
  }
}

export function formatCitation(paper: Paper, style: "apa" | "mla" | "chicago"): string {
  const authors = paper.authors.slice(0, 3).join(", ")
  const moreAuthors = paper.authors.length > 3 ? ", et al." : ""

  switch (style) {
    case "apa":
      return `${authors}${moreAuthors} (${paper.year}). ${paper.title}. ${paper.venue || "Unknown venue"}.${paper.doi ? ` https://doi.org/${paper.doi}` : ""}`

    case "mla":
      return `${authors}${moreAuthors}. "${paper.title}." ${paper.venue || "Unknown venue"}, ${paper.year}.${paper.doi ? ` doi:${paper.doi}` : ""}`

    case "chicago":
      return `${authors}${moreAuthors}. "${paper.title}." ${paper.venue || "Unknown venue"} (${paper.year}).${paper.doi ? ` https://doi.org/${paper.doi}` : ""}`

    default:
      return `${authors}${moreAuthors} (${paper.year}). ${paper.title}.`
  }
}
