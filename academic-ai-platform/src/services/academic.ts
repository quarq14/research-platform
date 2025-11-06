// Academic Search Services
// Semantic Scholar and OpenAlex integrations

export type Paper = {
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

const SEMANTIC_SCHOLAR_BASE = 'https://api.semanticscholar.org/graph/v1'
const OPENALEX_BASE = 'https://api.openalex.org'

// Semantic Scholar API (requires API key for higher rate limits)
export async function searchSemanticScholar(
  query: string,
  limit: number = 10
): Promise<Paper[]> {
  const apiKey = import.meta.env.VITE_SEMANTIC_SCHOLAR_API_KEY

  try {
    const headers: HeadersInit = {
      'Content-Type': 'application/json'
    }
    
    if (apiKey) {
      headers['x-api-key'] = apiKey
    }

    const response = await fetch(
      `${SEMANTIC_SCHOLAR_BASE}/paper/search?query=${encodeURIComponent(query)}&limit=${limit}&fields=title,authors,year,abstract,url,citationCount,journal`,
      { headers }
    )

    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.status}`)
    }

    const data = await response.json()

    return data.data.map((paper: any) => ({
      id: paper.paperId || paper.id,
      title: paper.title,
      authors: paper.authors?.map((a: any) => a.name) || [],
      year: paper.year,
      journal: paper.journal?.name,
      abstract: paper.abstract,
      url: paper.url,
      citationCount: paper.citationCount
    }))
  } catch (error: any) {
    console.error('Semantic Scholar error:', error)
    // Return empty on error
    return []
  }
}

// OpenAlex API (no API key required, more permissive)
export async function searchOpenAlex(
  query: string,
  limit: number = 10
): Promise<Paper[]> {
  try {
    const response = await fetch(
      `${OPENALEX_BASE}/works?search=${encodeURIComponent(query)}&per_page=${limit}`
    )

    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status}`)
    }

    const data = await response.json()

    return data.results.map((work: any) => ({
      id: work.id,
      title: work.title,
      authors: work.authorships?.map((a: any) => 
        a.author?.display_name || 'Unknown'
      ) || [],
      year: work.publication_year,
      journal: work.primary_location?.source?.display_name,
      abstract: work.abstract_inverted_index ? 
        reconstructAbstract(work.abstract_inverted_index) : 
        undefined,
      url: work.doi ? `https://doi.org/${work.doi}` : work.id,
      doi: work.doi,
      citationCount: work.cited_by_count
    }))
  } catch (error: any) {
    console.error('OpenAlex error:', error)
    return []
  }
}

// Helper to reconstruct abstract from inverted index
function reconstructAbstract(invertedIndex: Record<string, number[]>): string {
  const words: [string, number][] = []
  
  for (const [word, positions] of Object.entries(invertedIndex)) {
    positions.forEach(pos => {
      words.push([word, pos])
    })
  }
  
  words.sort((a, b) => a[1] - b[1])
  return words.map(w => w[0]).join(' ').slice(0, 500) + '...'
}

// Combined search (tries both APIs)
export async function searchPapers(query: string): Promise<Paper[]> {
  try {
    // Try OpenAlex first (no key required)
    const openAlexResults = await searchOpenAlex(query, 5)
    
    // Try Semantic Scholar (better quality if key available)
    const semanticScholarResults = await searchSemanticScholar(query, 5)
    
    // Combine and deduplicate by title
    const allResults = [...semanticScholarResults, ...openAlexResults]
    const uniqueResults = allResults.filter((paper, index, self) =>
      index === self.findIndex(p => 
        p.title.toLowerCase() === paper.title.toLowerCase()
      )
    )
    
    return uniqueResults.slice(0, 10)
  } catch (error) {
    console.error('Paper search error:', error)
    return []
  }
}

// Citation formatting
export function formatCitation(
  paper: Paper,
  style: 'APA' | 'MLA' | 'Chicago'
): string {
  const authors = paper.authors.slice(0, 3).join(', ') + 
    (paper.authors.length > 3 ? ', et al.' : '')

  switch (style) {
    case 'APA':
      return `${authors} (${paper.year}). ${paper.title}. ${paper.journal || 'Journal'}. ${paper.doi ? `https://doi.org/${paper.doi}` : paper.url || ''}`
      
    case 'MLA':
      return `${authors}. "${paper.title}." ${paper.journal || 'Journal'}, ${paper.year}. ${paper.url || ''}`
      
    case 'Chicago':
      return `${authors}. "${paper.title}." ${paper.journal || 'Journal'} (${paper.year}). ${paper.url || ''}`
      
    default:
      return `${authors} (${paper.year}). ${paper.title}.`
  }
}
