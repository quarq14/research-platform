import { Cite } from 'citation-js'

export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee'

export interface CitationData {
  type?: string
  title: string
  author?: Array<{ family: string; given: string }>
  issued?: { 'date-parts': [[number, number?, number?]] }
  'container-title'?: string
  volume?: string | number
  issue?: string | number
  page?: string
  DOI?: string
  URL?: string
  publisher?: string
  'publisher-place'?: string
  accessed?: { 'date-parts': [[number, number?, number?]] }
}

/**
 * Format citation in various styles
 */
export class CitationFormatter {
  /**
   * Format a single citation in the specified style
   */
  static format(data: CitationData, style: CitationStyle = 'apa'): string {
    try {
      const cite = new Cite(data)

      const styleMap: Record<CitationStyle, string> = {
        apa: 'apa',
        mla: 'mla',
        chicago: 'chicago',
        harvard: 'harvard1',
        ieee: 'ieee',
      }

      const template = styleMap[style] || 'apa'

      return cite.format('bibliography', {
        format: 'text',
        template,
        lang: 'en-US',
      })
    } catch (error: any) {
      console.error('Citation formatting error:', error)
      return CitationFormatter.fallbackFormat(data, style)
    }
  }

  /**
   * Generate in-text citation
   */
  static inText(data: CitationData, style: CitationStyle = 'apa', pageNumber?: number): string {
    try {
      const authorName = data.author?.[0]?.family || 'Unknown'
      const year = data.issued?.['date-parts']?.[0]?.[0] || 'n.d.'

      switch (style) {
        case 'apa':
          return pageNumber
            ? `(${authorName}, ${year}, p. ${pageNumber})`
            : `(${authorName}, ${year})`

        case 'mla':
          return pageNumber ? `(${authorName} ${pageNumber})` : `(${authorName})`

        case 'chicago':
          return pageNumber
            ? `(${authorName} ${year}, ${pageNumber})`
            : `(${authorName} ${year})`

        case 'harvard':
          return pageNumber
            ? `(${authorName} ${year}: ${pageNumber})`
            : `(${authorName} ${year})`

        case 'ieee':
          return '[1]' // IEEE uses numbered citations

        default:
          return `(${authorName}, ${year})`
      }
    } catch (error: any) {
      console.error('In-text citation error:', error)
      return '(Unknown, n.d.)'
    }
  }

  /**
   * Convert scholarly paper to CSL-JSON format
   */
  static toCSLJSON(paper: {
    title: string
    authors: Array<{ name: string }>
    year: number | null
    venue?: string | null
    doi?: string | null
    url?: string | null
    abstract?: string | null
  }): CitationData {
    const authors = paper.authors.map((author) => {
      const parts = author.name.split(' ')
      const family = parts.pop() || 'Unknown'
      const given = parts.join(' ') || ''
      return { family, given }
    })

    const issued = paper.year
      ? { 'date-parts': [[paper.year]] as [[number, number?, number?]] }
      : undefined

    return {
      type: 'article-journal',
      title: paper.title,
      author: authors,
      issued,
      'container-title': paper.venue || undefined,
      DOI: paper.doi || undefined,
      URL: paper.url || undefined,
    }
  }

  /**
   * Fallback manual formatting when citation-js fails
   */
  private static fallbackFormat(data: CitationData, style: CitationStyle): string {
    const authorName = data.author?.[0]
      ? `${data.author[0].family}, ${data.author[0].given?.[0]}.`
      : 'Unknown'
    const year = data.issued?.['date-parts']?.[0]?.[0] || 'n.d.'
    const title = data.title || 'Untitled'
    const venue = data['container-title'] || ''

    switch (style) {
      case 'apa':
        return `${authorName} (${year}). ${title}. ${venue ? `${venue}.` : ''}`

      case 'mla':
        const mlaAuthor = data.author?.[0]
          ? `${data.author[0].family}, ${data.author[0].given}.`
          : 'Unknown'
        return `${mlaAuthor} "${title}." ${venue ? `${venue},` : ''} ${year}.`

      case 'chicago':
        return `${authorName} "${title}." ${venue ? `${venue}` : ''} (${year}).`

      default:
        return `${authorName} (${year}). ${title}. ${venue}`
    }
  }

  /**
   * Generate bibliography from multiple citations
   */
  static generateBibliography(
    citations: CitationData[],
    style: CitationStyle = 'apa'
  ): string {
    try {
      const cite = new Cite(citations)

      const styleMap: Record<CitationStyle, string> = {
        apa: 'apa',
        mla: 'mla',
        chicago: 'chicago',
        harvard: 'harvard1',
        ieee: 'ieee',
      }

      const template = styleMap[style] || 'apa'

      return cite.format('bibliography', {
        format: 'text',
        template,
        lang: 'en-US',
      })
    } catch (error: any) {
      console.error('Bibliography generation error:', error)
      // Fallback: format each citation individually
      return citations
        .map((citation, index) =>
          `${index + 1}. ${CitationFormatter.format(citation, style)}`
        )
        .join('\n\n')
    }
  }

  /**
   * Extract DOI from text
   */
  static extractDOI(text: string): string | null {
    const doiPattern = /10\.\d{4,}(?:\.\d+)*\/\S+/
    const match = text.match(doiPattern)
    return match ? match[0] : null
  }

  /**
   * Parse citation from text
   */
  static parseCitation(text: string): CitationData | null {
    try {
      const cite = new Cite(text)
      return cite.data[0] as CitationData
    } catch (error) {
      return null
    }
  }
}

/**
 * Citation Manager for tracking citations in a document
 */
export class CitationManager {
  private citations: Map<string, CitationData> = new Map()
  private citationKeys: Map<string, string> = new Map() // Maps citation to key

  addCitation(data: CitationData): string {
    const key = this.generateKey(data)
    this.citations.set(key, data)
    return key
  }

  getCitation(key: string): CitationData | undefined {
    return this.citations.get(key)
  }

  getAllCitations(): CitationData[] {
    return Array.from(this.citations.values())
  }

  formatInText(key: string, style: CitationStyle = 'apa', pageNumber?: number): string {
    const citation = this.citations.get(key)
    if (!citation) return '(Unknown)'

    return CitationFormatter.inText(citation, style, pageNumber)
  }

  generateBibliography(style: CitationStyle = 'apa'): string {
    const allCitations = this.getAllCitations()
    return CitationFormatter.generateBibliography(allCitations, style)
  }

  private generateKey(data: CitationData): string {
    const authorFamily = data.author?.[0]?.family || 'Unknown'
    const year = data.issued?.['date-parts']?.[0]?.[0] || 'nd'
    const baseKey = `${authorFamily}${year}`

    // Ensure unique key
    let key = baseKey
    let counter = 1
    while (this.citations.has(key)) {
      key = `${baseKey}_${counter}`
      counter++
    }

    return key
  }

  clear() {
    this.citations.clear()
    this.citationKeys.clear()
  }
}
