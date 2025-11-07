/**
 * Citations Service
 * Handles citation formatting using citeproc-js
 * Supports APA, MLA, Chicago, Harvard, IEEE, and Vancouver styles
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import type { CSLItem } from './academic-search';

// Citation styles
export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'vancouver';

export interface Citation {
  id: string;
  sourceId: string;
  inText: string;
  reference: string;
  style: CitationStyle;
  cslItem: CSLItem;
}

export interface BibliographyOptions {
  style?: CitationStyle;
  format?: 'text' | 'html';
  locale?: 'en-US' | 'en-GB';
  includeURLs?: boolean;
  includeDOIs?: boolean;
}

/**
 * Simple citation formatter (no citeproc-js dependency)
 * For production, integrate citation-js or citeproc-js
 */
export class CitationFormatter {
  private style: CitationStyle;
  private locale: string;

  constructor(style: CitationStyle = 'apa', locale: string = 'en-US') {
    this.style = style;
    this.locale = locale;
  }

  /**
   * Format author names according to style
   */
  private formatAuthors(
    authors: Array<{ family: string; given: string }>,
    options: { inText?: boolean; maxAuthors?: number } = {}
  ): string {
    const { inText = false, maxAuthors = 3 } = options;

    if (!authors || authors.length === 0) return '';

    const formatAuthor = (author: { family: string; given: string }) => {
      switch (this.style) {
        case 'apa':
          return inText
            ? author.family
            : `${author.family}, ${author.given?.charAt(0)}.`;
        case 'mla':
          return authors.indexOf(author) === 0
            ? `${author.family}, ${author.given}`
            : `${author.given} ${author.family}`;
        case 'chicago':
          return authors.indexOf(author) === 0
            ? `${author.family}, ${author.given}`
            : `${author.given} ${author.family}`;
        case 'harvard':
          return `${author.family}, ${author.given?.charAt(0)}.`;
        case 'ieee':
          return `${author.given?.charAt(0)}. ${author.family}`;
        case 'vancouver':
          return `${author.family} ${author.given?.charAt(0)}`;
        default:
          return `${author.family}, ${author.given}`;
      }
    };

    if (authors.length === 1) {
      return formatAuthor(authors[0]);
    } else if (authors.length === 2) {
      const separator = this.style === 'ieee' || this.style === 'vancouver' ? ', ' : ' & ';
      return `${formatAuthor(authors[0])}${separator}${formatAuthor(authors[1])}`;
    } else if (authors.length <= maxAuthors) {
      const formatted = authors.map(formatAuthor);
      const last = formatted.pop();
      const separator = this.style === 'ieee' || this.style === 'vancouver' ? ', ' : ', & ';
      return `${formatted.join(', ')}${separator}${last}`;
    } else {
      // Too many authors
      const etAl = this.style === 'ieee' || this.style === 'vancouver' ? 'et al.' : 'et al.';
      return `${formatAuthor(authors[0])} ${etAl}`;
    }
  }

  /**
   * Format year
   */
  private formatYear(issued?: { 'date-parts': number[][] }): string {
    if (!issued || !issued['date-parts'] || !issued['date-parts'][0]) {
      return 'n.d.';
    }
    return String(issued['date-parts'][0][0]);
  }

  /**
   * Format in-text citation
   */
  formatInText(item: CSLItem, options: { pageNumber?: string } = {}): string {
    const { pageNumber } = options;
    const authors = item.author || [];
    const year = this.formatYear(item.issued);

    switch (this.style) {
      case 'apa': {
        const authorStr = this.formatAuthors(authors, { inText: true, maxAuthors: 2 });
        const page = pageNumber ? `, p. ${pageNumber}` : '';
        return `(${authorStr}, ${year}${page})`;
      }

      case 'mla': {
        const authorStr = authors[0]?.family || 'Unknown';
        const page = pageNumber ? ` ${pageNumber}` : '';
        return `(${authorStr}${page})`;
      }

      case 'chicago': {
        const authorStr = authors[0]?.family || 'Unknown';
        const page = pageNumber ? `, ${pageNumber}` : '';
        return `(${authorStr} ${year}${page})`;
      }

      case 'harvard': {
        const authorStr = this.formatAuthors(authors, { inText: true, maxAuthors: 2 });
        const page = pageNumber ? `: ${pageNumber}` : '';
        return `(${authorStr} ${year}${page})`;
      }

      case 'ieee': {
        // IEEE uses numbered citations [1]
        return `[${item.id}]`;
      }

      case 'vancouver': {
        // Vancouver uses numbered citations (1)
        return `(${item.id})`;
      }

      default:
        return `(${authors[0]?.family || 'Unknown'}, ${year})`;
    }
  }

  /**
   * Format reference (bibliography entry)
   */
  formatReference(item: CSLItem): string {
    const authors = this.formatAuthors(item.author || []);
    const year = this.formatYear(item.issued);
    const title = item.title;
    const container = item['container-title'];
    const volume = item.volume;
    const issue = item.issue;
    const pages = item.page;
    const doi = item.DOI;
    const url = item.URL;

    switch (this.style) {
      case 'apa': {
        let ref = `${authors} (${year}). ${title}.`;
        if (container) {
          ref += ` *${container}*`;
          if (volume) ref += `, *${volume}*`;
          if (issue) ref += `(${issue})`;
          if (pages) ref += `, ${pages}`;
          ref += '.';
        }
        if (doi) ref += ` https://doi.org/${doi}`;
        return ref;
      }

      case 'mla': {
        let ref = `${authors}. "${title}."`;
        if (container) {
          ref += ` *${container}*`;
          if (volume) ref += `, vol. ${volume}`;
          if (issue) ref += `, no. ${issue}`;
          ref += `, ${year}`;
          if (pages) ref += `, pp. ${pages}`;
          ref += '.';
        }
        if (url) ref += ` ${url}.`;
        return ref;
      }

      case 'chicago': {
        let ref = `${authors}. ${year}. "${title}."`;
        if (container) {
          ref += ` *${container}*`;
          if (volume) ref += ` ${volume}`;
          if (issue) ref += ` (${issue})`;
          if (pages) ref += `: ${pages}`;
          ref += '.';
        }
        if (doi) ref += ` https://doi.org/${doi}.`;
        return ref;
      }

      case 'harvard': {
        let ref = `${authors} ${year}. ${title}.`;
        if (container) {
          ref += ` *${container}*`;
          if (volume) ref += `, ${volume}`;
          if (issue) ref += `(${issue})`;
          if (pages) ref += `, pp. ${pages}`;
          ref += '.';
        }
        if (doi) ref += ` doi:${doi}`;
        return ref;
      }

      case 'ieee': {
        let ref = `${authors}, "${title},"`;
        if (container) {
          ref += ` *${container}*`;
          if (volume) ref += `, vol. ${volume}`;
          if (issue) ref += `, no. ${issue}`;
          if (pages) ref += `, pp. ${pages}`;
          ref += `, ${year}.`;
        }
        if (doi) ref += ` doi: ${doi}.`;
        return ref;
      }

      case 'vancouver': {
        let ref = `${authors}. ${title}.`;
        if (container) {
          ref += ` ${container}`;
          if (year) ref += `. ${year}`;
          if (volume) ref += `;${volume}`;
          if (issue) ref += `(${issue})`;
          if (pages) ref += `:${pages}`;
          ref += '.';
        }
        if (doi) ref += ` doi:${doi}`;
        return ref;
      }

      default:
        return `${authors} (${year}). ${title}.`;
    }
  }

  /**
   * Change citation style
   */
  setStyle(style: CitationStyle): void {
    this.style = style;
  }

  /**
   * Get current style
   */
  getStyle(): CitationStyle {
    return this.style;
  }
}

/**
 * Generate in-text citation
 */
export function generateInTextCitation(
  cslItem: CSLItem,
  style: CitationStyle = 'apa',
  pageNumber?: string
): string {
  const formatter = new CitationFormatter(style);
  return formatter.formatInText(cslItem, { pageNumber });
}

/**
 * Generate reference citation
 */
export function generateReference(
  cslItem: CSLItem,
  style: CitationStyle = 'apa'
): string {
  const formatter = new CitationFormatter(style);
  return formatter.formatReference(cslItem);
}

/**
 * Generate bibliography from multiple sources
 */
export function generateBibliography(
  cslItems: CSLItem[],
  options: BibliographyOptions = {}
): string {
  const {
    style = 'apa',
    format = 'text',
    includeURLs = true,
    includeDOIs = true,
  } = options;

  const formatter = new CitationFormatter(style);

  // Sort items according to style
  const sortedItems = [...cslItems].sort((a, b) => {
    const aAuthor = a.author?.[0]?.family || '';
    const bAuthor = b.author?.[0]?.family || '';
    return aAuthor.localeCompare(bAuthor);
  });

  // Format each reference
  const references = sortedItems.map((item, index) => {
    let ref = formatter.formatReference(item);

    // Remove URLs/DOIs if not wanted
    if (!includeURLs) {
      ref = ref.replace(/https?:\/\/[^\s]+/g, '');
    }
    if (!includeDOIs) {
      ref = ref.replace(/doi:?\s*[^\s]+/gi, '');
    }

    // Format as HTML if requested
    if (format === 'html') {
      // Number citations for IEEE/Vancouver
      if (style === 'ieee' || style === 'vancouver') {
        return `<p>[${index + 1}] ${ref}</p>`;
      }
      return `<p>${ref}</p>`;
    }

    // Number citations for IEEE/Vancouver
    if (style === 'ieee' || style === 'vancouver') {
      return `[${index + 1}] ${ref}`;
    }

    return ref;
  });

  return references.join(format === 'html' ? '\n' : '\n\n');
}

/**
 * Extract citations from text
 * Finds citation patterns like (Author, 2020) or [1]
 */
export function extractCitationsFromText(text: string): Array<{
  citation: string;
  position: number;
  type: 'author-date' | 'numbered';
}> {
  const citations: Array<{
    citation: string;
    position: number;
    type: 'author-date' | 'numbered';
  }> = [];

  // Find author-date citations (Author, 2020) or (Author et al., 2020)
  const authorDateRegex = /\(([A-Z][a-z]+(?:\s+et\s+al\.)?(?:,\s*\d{4})(?:,\s*p\.\s*\d+)?)\)/g;
  let match;
  while ((match = authorDateRegex.exec(text)) !== null) {
    citations.push({
      citation: match[1],
      position: match.index,
      type: 'author-date',
    });
  }

  // Find numbered citations [1] or (1)
  const numberedRegex = /[\[\(](\d+)[\]\)]/g;
  while ((match = numberedRegex.exec(text)) !== null) {
    citations.push({
      citation: match[1],
      position: match.index,
      type: 'numbered',
    });
  }

  return citations.sort((a, b) => a.position - b.position);
}

/**
 * Convert citation style in text
 */
export function convertCitationStyle(
  text: string,
  fromStyle: CitationStyle,
  toStyle: CitationStyle,
  cslItems: Map<string, CSLItem>
): string {
  // This is a simplified implementation
  // In production, you would parse citations and regenerate them

  let converted = text;

  // Extract existing citations
  const citations = extractCitationsFromText(text);

  // Replace each citation with new format
  for (const citation of citations.reverse()) {
    // Reverse to maintain positions
    // Find matching CSL item (simplified)
    // In production, you would need better matching logic
    const cslItem = Array.from(cslItems.values())[0]; // Simplified

    if (cslItem) {
      const newCitation = generateInTextCitation(cslItem, toStyle);
      converted =
        converted.slice(0, citation.position) +
        newCitation +
        converted.slice(citation.position + citation.citation.length + 2);
    }
  }

  return converted;
}

/**
 * Store citation in Supabase
 */
export async function storeCitation(
  supabase: SupabaseClient,
  documentId: string,
  sourceId: string,
  citation: {
    style: CitationStyle;
    inText: string;
    reference: string;
    pageNumber?: string;
    locationInDoc?: string;
  }
): Promise<{ success: boolean; citationId: string }> {
  try {
    const { data, error } = await supabase
      .from('citations')
      .insert({
        document_id: documentId,
        source_id: sourceId,
        citation_style: citation.style,
        in_text: citation.inText,
        reference_text: citation.reference,
        page_number: citation.pageNumber,
        location_in_doc: citation.locationInDoc,
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to store citation: ${error.message}`);
    }

    return { success: true, citationId: data.id };
  } catch (error) {
    console.error('[Citations] Storage error:', error);
    throw error;
  }
}

/**
 * Get citations for a document
 */
export async function getDocumentCitations(
  supabase: SupabaseClient,
  documentId: string,
  style?: CitationStyle
): Promise<Citation[]> {
  try {
    let query = supabase
      .from('citations')
      .select('id, source_id, citation_style, in_text, reference_text, sources(csl_json)')
      .eq('document_id', documentId);

    if (style) {
      query = query.eq('citation_style', style);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch citations: ${error.message}`);
    }

    return (
      data?.map((row: any) => ({
        id: row.id,
        sourceId: row.source_id,
        inText: row.in_text,
        reference: row.reference_text,
        style: row.citation_style,
        cslItem: row.sources?.csl_json,
      })) || []
    );
  } catch (error) {
    console.error('[Citations] Fetch error:', error);
    throw error;
  }
}

/**
 * Generate bibliography for a document
 */
export async function generateDocumentBibliography(
  supabase: SupabaseClient,
  documentId: string,
  options: BibliographyOptions = {}
): Promise<string> {
  try {
    const { style = 'apa' } = options;

    // Fetch all sources linked to the document
    const { data, error } = await supabase
      .from('document_sources')
      .select('sources(csl_json)')
      .eq('document_id', documentId);

    if (error) {
      throw new Error(`Failed to fetch sources: ${error.message}`);
    }

    const cslItems = data?.map((row: any) => row.sources.csl_json).filter(Boolean) || [];

    return generateBibliography(cslItems, { ...options, style });
  } catch (error) {
    console.error('[Citations] Bibliography generation error:', error);
    throw error;
  }
}

/**
 * Update citation style for all citations in a document
 */
export async function updateDocumentCitationStyle(
  supabase: SupabaseClient,
  documentId: string,
  newStyle: CitationStyle
): Promise<{ success: boolean; updatedCount: number }> {
  try {
    // Get all citations
    const citations = await getDocumentCitations(supabase, documentId);

    let updatedCount = 0;

    // Regenerate each citation with new style
    for (const citation of citations) {
      if (citation.cslItem) {
        const formatter = new CitationFormatter(newStyle);
        const newInText = formatter.formatInText(citation.cslItem);
        const newReference = formatter.formatReference(citation.cslItem);

        const { error } = await supabase
          .from('citations')
          .update({
            citation_style: newStyle,
            in_text: newInText,
            reference_text: newReference,
          })
          .eq('id', citation.id);

        if (!error) {
          updatedCount++;
        }
      }
    }

    return { success: true, updatedCount };
  } catch (error) {
    console.error('[Citations] Style update error:', error);
    throw error;
  }
}

/**
 * Export citation to various formats
 */
export function exportCitation(
  cslItem: CSLItem,
  format: 'bibtex' | 'ris' | 'json' | 'csl'
): string {
  switch (format) {
    case 'json':
    case 'csl':
      return JSON.stringify(cslItem, null, 2);

    case 'bibtex': {
      const type = cslItem.type === 'article-journal' ? 'article' : 'misc';
      const authors =
        cslItem.author?.map(a => `${a.given} ${a.family}`).join(' and ') || '';
      const year = cslItem.issued?.['date-parts']?.[0]?.[0] || '';

      return `@${type}{${cslItem.id},
  title={${cslItem.title}},
  author={${authors}},
  journal={${cslItem['container-title'] || ''}},
  year={${year}},
  volume={${cslItem.volume || ''}},
  pages={${cslItem.page || ''}},
  doi={${cslItem.DOI || ''}}
}`;
    }

    case 'ris': {
      const authors = cslItem.author?.map(a => `AU  - ${a.given} ${a.family}`).join('\n') || '';
      const year = cslItem.issued?.['date-parts']?.[0]?.[0] || '';

      return `TY  - JOUR
TI  - ${cslItem.title}
${authors}
JO  - ${cslItem['container-title'] || ''}
VL  - ${cslItem.volume || ''}
PY  - ${year}
SP  - ${cslItem.page || ''}
DO  - ${cslItem.DOI || ''}
ER  -`;
    }

    default:
      return JSON.stringify(cslItem, null, 2);
  }
}
