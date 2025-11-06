import axios from 'axios'

// ==============================================================================
// Types
// ==============================================================================
export interface ScholarlyPaper {
  id: string
  title: string
  authors: Author[]
  year: number | null
  venue: string | null
  abstract: string | null
  doi: string | null
  url: string | null
  pdfUrl: string | null
  citationCount: number
  source: 'semantic-scholar' | 'openalex' | 'crossref'
  rawData?: any
}

export interface Author {
  name: string
  id?: string
}

// ==============================================================================
// Semantic Scholar API
// ==============================================================================
export class SemanticScholarAPI {
  private baseUrl = 'https://api.semanticscholar.org/graph/v1'
  private apiKey?: string

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.SEMANTIC_SCHOLAR_API_KEY
  }

  async search(query: string, limit = 10): Promise<ScholarlyPaper[]> {
    try {
      const headers: any = {}
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/paper/search`, {
        params: {
          query,
          limit,
          fields: 'paperId,title,abstract,year,authors,venue,citationCount,externalIds,openAccessPdf,url',
        },
        headers,
      })

      return response.data.data.map((paper: any) => this.transformPaper(paper))
    } catch (error: any) {
      console.error('Semantic Scholar search error:', error.response?.data || error.message)
      throw new Error(`Semantic Scholar search failed: ${error.message}`)
    }
  }

  async getPaper(paperId: string): Promise<ScholarlyPaper | null> {
    try {
      const headers: any = {}
      if (this.apiKey) {
        headers['x-api-key'] = this.apiKey
      }

      const response = await axios.get(`${this.baseUrl}/paper/${paperId}`, {
        params: {
          fields: 'paperId,title,abstract,year,authors,venue,citationCount,externalIds,openAccessPdf,url',
        },
        headers,
      })

      return this.transformPaper(response.data)
    } catch (error: any) {
      console.error('Semantic Scholar get paper error:', error.response?.data || error.message)
      return null
    }
  }

  private transformPaper(paper: any): ScholarlyPaper {
    return {
      id: paper.paperId,
      title: paper.title,
      authors: paper.authors?.map((a: any) => ({
        name: a.name,
        id: a.authorId,
      })) || [],
      year: paper.year,
      venue: paper.venue,
      abstract: paper.abstract,
      doi: paper.externalIds?.DOI,
      url: paper.url,
      pdfUrl: paper.openAccessPdf?.url,
      citationCount: paper.citationCount || 0,
      source: 'semantic-scholar',
      rawData: paper,
    }
  }
}

// ==============================================================================
// OpenAlex API
// ==============================================================================
export class OpenAlexAPI {
  private baseUrl = 'https://api.openalex.org'

  async search(query: string, limit = 10): Promise<ScholarlyPaper[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/works`, {
        params: {
          search: query,
          per_page: limit,
        },
        headers: {
          'User-Agent': 'Academic Research Platform (mailto:contact@example.com)',
        },
      })

      return response.data.results.map((work: any) => this.transformWork(work))
    } catch (error: any) {
      console.error('OpenAlex search error:', error.response?.data || error.message)
      throw new Error(`OpenAlex search failed: ${error.message}`)
    }
  }

  async getWork(workId: string): Promise<ScholarlyPaper | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/works/${workId}`, {
        headers: {
          'User-Agent': 'Academic Research Platform (mailto:contact@example.com)',
        },
      })

      return this.transformWork(response.data)
    } catch (error: any) {
      console.error('OpenAlex get work error:', error.response?.data || error.message)
      return null
    }
  }

  private transformWork(work: any): ScholarlyPaper {
    const pdfUrl = work.open_access?.oa_url || work.primary_location?.pdf_url || null

    return {
      id: work.id,
      title: work.title,
      authors: work.authorships?.map((a: any) => ({
        name: a.author?.display_name || 'Unknown',
        id: a.author?.id,
      })) || [],
      year: work.publication_year,
      venue: work.primary_location?.source?.display_name,
      abstract: work.abstract_inverted_index ? this.reconstructAbstract(work.abstract_inverted_index) : null,
      doi: work.doi?.replace('https://doi.org/', ''),
      url: work.doi || work.id,
      pdfUrl,
      citationCount: work.cited_by_count || 0,
      source: 'openalex',
      rawData: work,
    }
  }

  private reconstructAbstract(invertedIndex: Record<string, number[]>): string {
    const words: [string, number][] = []

    for (const [word, positions] of Object.entries(invertedIndex)) {
      for (const pos of positions) {
        words.push([word, pos])
      }
    }

    words.sort((a, b) => a[1] - b[1])
    return words.map(([word]) => word).join(' ')
  }
}

// ==============================================================================
// Crossref API
// ==============================================================================
export class CrossrefAPI {
  private baseUrl = 'https://api.crossref.org'

  async search(query: string, limit = 10): Promise<ScholarlyPaper[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/works`, {
        params: {
          query,
          rows: limit,
        },
      })

      return response.data.message.items.map((item: any) => this.transformItem(item))
    } catch (error: any) {
      console.error('Crossref search error:', error.response?.data || error.message)
      throw new Error(`Crossref search failed: ${error.message}`)
    }
  }

  async getByDOI(doi: string): Promise<ScholarlyPaper | null> {
    try {
      const response = await axios.get(`${this.baseUrl}/works/${doi}`)
      return this.transformItem(response.data.message)
    } catch (error: any) {
      console.error('Crossref get by DOI error:', error.response?.data || error.message)
      return null
    }
  }

  private transformItem(item: any): ScholarlyPaper {
    return {
      id: item.DOI,
      title: item.title?.[0] || 'Untitled',
      authors: item.author?.map((a: any) => ({
        name: `${a.given || ''} ${a.family || ''}`.trim(),
      })) || [],
      year: item.published?.['date-parts']?.[0]?.[0] || null,
      venue: item['container-title']?.[0] || null,
      abstract: item.abstract || null,
      doi: item.DOI,
      url: item.URL || `https://doi.org/${item.DOI}`,
      pdfUrl: null,
      citationCount: item['is-referenced-by-count'] || 0,
      source: 'crossref',
      rawData: item,
    }
  }
}

// ==============================================================================
// Unified Search Service
// ==============================================================================
export class ScholarlySearchService {
  private semanticScholar: SemanticScholarAPI
  private openAlex: OpenAlexAPI
  private crossref: CrossrefAPI

  constructor(semanticScholarApiKey?: string) {
    this.semanticScholar = new SemanticScholarAPI(semanticScholarApiKey)
    this.openAlex = new OpenAlexAPI()
    this.crossref = new CrossrefAPI()
  }

  async search(query: string, sources: string[] = ['semantic-scholar', 'openalex'], limit = 10): Promise<ScholarlyPaper[]> {
    const results: ScholarlyPaper[] = []

    const promises = sources.map(async (source) => {
      try {
        switch (source) {
          case 'semantic-scholar':
            return await this.semanticScholar.search(query, limit)
          case 'openalex':
            return await this.openAlex.search(query, limit)
          case 'crossref':
            return await this.crossref.search(query, limit)
          default:
            return []
        }
      } catch (error) {
        console.error(`Search failed for ${source}:`, error)
        return []
      }
    })

    const allResults = await Promise.all(promises)
    for (const sourceResults of allResults) {
      results.push(...sourceResults)
    }

    // Deduplicate by DOI or title
    const seen = new Set<string>()
    return results.filter((paper) => {
      const key = paper.doi || paper.title.toLowerCase()
      if (seen.has(key)) return false
      seen.add(key)
      return true
    })
  }

  async getPaperByDOI(doi: string): Promise<ScholarlyPaper | null> {
    // Try Crossref first (authoritative for DOIs)
    let paper = await this.crossref.getByDOI(doi)
    if (paper) return paper

    // Fallback to Semantic Scholar
    paper = await this.semanticScholar.getPaper(`DOI:${doi}`)
    if (paper) return paper

    // Fallback to OpenAlex
    paper = await this.openAlex.getWork(`https://doi.org/${doi}`)
    return paper
  }
}

// ==============================================================================
// Export default instance
// ==============================================================================
export const scholarlySearch = new ScholarlySearchService()
