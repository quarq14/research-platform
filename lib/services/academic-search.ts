/**
 * Academic Search Service
 * Integrates with Semantic Scholar, OpenAlex, and Crossref APIs
 * Provides advanced filtering and CSL-JSON formatting
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Types
export interface Author {
  name: string;
  authorId?: string;
  affiliations?: string[];
  orcid?: string;
}

export interface AcademicPaper {
  id: string;
  title: string;
  authors: Author[];
  abstract?: string;
  year?: number;
  venue?: string;
  journal?: string;
  doi?: string;
  url?: string;
  pdfUrl?: string;
  citationCount?: number;
  referenceCount?: number;
  fieldsOfStudy?: string[];
  publicationTypes?: string[];
  publisher?: string;
  volume?: string;
  issue?: string;
  pages?: string;
  isbn?: string;
  issn?: string;
  source: 'semantic_scholar' | 'openalex' | 'crossref';
  cslJson?: CSLItem;
}

export interface CSLItem {
  type:
    | 'article'
    | 'article-journal'
    | 'article-magazine'
    | 'article-newspaper'
    | 'book'
    | 'chapter'
    | 'paper-conference'
    | 'thesis'
    | 'report';
  id: string;
  title: string;
  author?: Array<{ family: string; given: string }>;
  issued?: { 'date-parts': number[][] };
  'container-title'?: string;
  publisher?: string;
  volume?: string | number;
  issue?: string | number;
  page?: string;
  DOI?: string;
  URL?: string;
  ISSN?: string;
  ISBN?: string;
  abstract?: string;
}

export interface SearchFilters {
  yearStart?: number;
  yearEnd?: number;
  publicationType?: string[];
  venue?: string;
  fieldOfStudy?: string[];
  minCitations?: number;
  hasFullText?: boolean;
  hasAbstract?: boolean;
}

export interface SearchOptions extends SearchFilters {
  limit?: number;
  offset?: number;
  sortBy?: 'relevance' | 'citations' | 'year';
  sortOrder?: 'asc' | 'desc';
}

// API Configuration
const SEMANTIC_SCHOLAR_BASE_URL = 'https://api.semanticscholar.org/graph/v1';
const OPENALEX_BASE_URL = 'https://api.openalex.org';
const CROSSREF_BASE_URL = 'https://api.crossref.org';

/**
 * Search papers using Semantic Scholar API
 */
export async function searchSemanticScholar(
  query: string,
  options: SearchOptions = {}
): Promise<AcademicPaper[]> {
  try {
    const {
      limit = 10,
      offset = 0,
      yearStart,
      yearEnd,
      fieldsOfStudy,
      minCitations,
    } = options;

    const params = new URLSearchParams({
      query,
      limit: String(limit),
      offset: String(offset),
      fields:
        'paperId,title,abstract,year,authors,venue,citationCount,referenceCount,fieldsOfStudy,publicationTypes,externalIds,openAccessPdf,journal',
    });

    if (yearStart) params.append('year', `${yearStart}-`);
    if (yearEnd) params.append('year', `-${yearEnd}`);
    if (yearStart && yearEnd) params.set('year', `${yearStart}-${yearEnd}`);
    if (fieldsOfStudy && fieldsOfStudy.length > 0) {
      params.append('fieldsOfStudy', fieldsOfStudy.join(','));
    }
    if (minCitations) {
      params.append('minCitationCount', String(minCitations));
    }

    const response = await fetch(
      `${SEMANTIC_SCHOLAR_BASE_URL}/paper/search?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Semantic Scholar API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.data || []).map((paper: any) =>
      convertSemanticScholarToPaper(paper)
    );
  } catch (error) {
    console.error('[Academic Search] Semantic Scholar error:', error);
    throw error;
  }
}

/**
 * Get paper details by DOI from Semantic Scholar
 */
export async function getSemanticScholarPaperByDOI(
  doi: string
): Promise<AcademicPaper | null> {
  try {
    const response = await fetch(
      `${SEMANTIC_SCHOLAR_BASE_URL}/paper/DOI:${encodeURIComponent(doi)}?fields=paperId,title,abstract,year,authors,venue,citationCount,referenceCount,fieldsOfStudy,publicationTypes,externalIds,openAccessPdf,journal`,
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Semantic Scholar API error: ${response.status}`);
    }

    const paper = await response.json();
    return convertSemanticScholarToPaper(paper);
  } catch (error) {
    console.error('[Academic Search] Semantic Scholar DOI lookup error:', error);
    return null;
  }
}

/**
 * Convert Semantic Scholar response to our paper format
 */
function convertSemanticScholarToPaper(paper: any): AcademicPaper {
  const cslJson: CSLItem = {
    type: paper.publicationTypes?.includes('JournalArticle')
      ? 'article-journal'
      : 'article',
    id: paper.paperId,
    title: paper.title,
    author: paper.authors?.map((a: any) => ({
      family: a.name?.split(' ').pop() || '',
      given: a.name?.split(' ').slice(0, -1).join(' ') || '',
    })),
    issued: paper.year ? { 'date-parts': [[paper.year]] } : undefined,
    'container-title': paper.venue || paper.journal?.name,
    volume: paper.journal?.volume,
    page: paper.journal?.pages,
    DOI: paper.externalIds?.DOI,
    abstract: paper.abstract,
  };

  return {
    id: paper.paperId,
    title: paper.title,
    authors: paper.authors?.map((a: any) => ({
      name: a.name,
      authorId: a.authorId,
    })) || [],
    abstract: paper.abstract,
    year: paper.year,
    venue: paper.venue,
    journal: paper.journal?.name,
    doi: paper.externalIds?.DOI,
    url: paper.url || `https://www.semanticscholar.org/paper/${paper.paperId}`,
    pdfUrl: paper.openAccessPdf?.url,
    citationCount: paper.citationCount,
    referenceCount: paper.referenceCount,
    fieldsOfStudy: paper.fieldsOfStudy,
    publicationTypes: paper.publicationTypes,
    source: 'semantic_scholar',
    cslJson,
  };
}

/**
 * Search papers using OpenAlex API
 */
export async function searchOpenAlex(
  query: string,
  options: SearchOptions = {}
): Promise<AcademicPaper[]> {
  try {
    const {
      limit = 10,
      offset = 0,
      yearStart,
      yearEnd,
      publicationType,
      hasFullText,
    } = options;

    const filters: string[] = [];

    if (yearStart || yearEnd) {
      const start = yearStart || 1900;
      const end = yearEnd || new Date().getFullYear();
      filters.push(`publication_year:${start}-${end}`);
    }

    if (publicationType && publicationType.length > 0) {
      filters.push(`type:${publicationType.join('|')}`);
    }

    if (hasFullText) {
      filters.push('has_fulltext:true');
    }

    const filterString = filters.length > 0 ? `&filter=${filters.join(',')}` : '';

    const url = `${OPENALEX_BASE_URL}/works?search=${encodeURIComponent(query)}&per-page=${limit}&page=${Math.floor(offset / limit) + 1}${filterString}`;

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'Research-Platform (mailto:support@example.com)',
      },
    });

    if (!response.ok) {
      throw new Error(`OpenAlex API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.results || []).map((work: any) => convertOpenAlexToPaper(work));
  } catch (error) {
    console.error('[Academic Search] OpenAlex error:', error);
    throw error;
  }
}

/**
 * Convert OpenAlex response to our paper format
 */
function convertOpenAlexToPaper(work: any): AcademicPaper {
  const year = work.publication_year || parseInt(work.publication_date?.split('-')[0]);

  const cslJson: CSLItem = {
    type: work.type === 'journal-article' ? 'article-journal' : 'article',
    id: work.id,
    title: work.title,
    author: work.authorships?.map((a: any) => ({
      family: a.author?.display_name?.split(' ').pop() || '',
      given: a.author?.display_name?.split(' ').slice(0, -1).join(' ') || '',
    })),
    issued: year ? { 'date-parts': [[year]] } : undefined,
    'container-title': work.primary_location?.source?.display_name,
    DOI: work.doi?.replace('https://doi.org/', ''),
    URL: work.doi || work.id,
    abstract: work.abstract,
  };

  return {
    id: work.id,
    title: work.title,
    authors:
      work.authorships?.map((a: any) => ({
        name: a.author?.display_name || '',
        authorId: a.author?.id,
        orcid: a.author?.orcid,
      })) || [],
    abstract: work.abstract,
    year,
    venue: work.primary_location?.source?.display_name,
    doi: work.doi?.replace('https://doi.org/', ''),
    url: work.doi || work.id,
    pdfUrl: work.open_access?.oa_url,
    citationCount: work.cited_by_count,
    referenceCount: work.referenced_works?.length,
    publicationTypes: [work.type],
    source: 'openalex',
    cslJson,
  };
}

/**
 * Search papers using Crossref API
 */
export async function searchCrossref(
  query: string,
  options: SearchOptions = {}
): Promise<AcademicPaper[]> {
  try {
    const {
      limit = 10,
      offset = 0,
      yearStart,
      yearEnd,
      publicationType,
    } = options;

    const params = new URLSearchParams({
      query: query,
      rows: String(limit),
      offset: String(offset),
    });

    if (yearStart) {
      params.append('filter', `from-pub-date:${yearStart}`);
    }
    if (yearEnd) {
      params.append('filter', `until-pub-date:${yearEnd}`);
    }
    if (publicationType && publicationType.length > 0) {
      params.append('filter', `type:${publicationType[0]}`);
    }

    const response = await fetch(
      `${CROSSREF_BASE_URL}/works?${params.toString()}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Research-Platform/1.0 (mailto:support@example.com)',
        },
      }
    );

    if (!response.ok) {
      throw new Error(`Crossref API error: ${response.status}`);
    }

    const data = await response.json();

    return (data.message?.items || []).map((item: any) =>
      convertCrossrefToPaper(item)
    );
  } catch (error) {
    console.error('[Academic Search] Crossref error:', error);
    throw error;
  }
}

/**
 * Get paper by DOI from Crossref
 */
export async function getCrossrefPaperByDOI(
  doi: string
): Promise<AcademicPaper | null> {
  try {
    const response = await fetch(
      `${CROSSREF_BASE_URL}/works/${encodeURIComponent(doi)}`,
      {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Research-Platform/1.0 (mailto:support@example.com)',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) return null;
      throw new Error(`Crossref API error: ${response.status}`);
    }

    const data = await response.json();
    return convertCrossrefToPaper(data.message);
  } catch (error) {
    console.error('[Academic Search] Crossref DOI lookup error:', error);
    return null;
  }
}

/**
 * Convert Crossref response to our paper format
 */
function convertCrossrefToPaper(item: any): AcademicPaper {
  const year = item.published?.['date-parts']?.[0]?.[0] ||
    item['published-print']?.['date-parts']?.[0]?.[0] ||
    item['published-online']?.['date-parts']?.[0]?.[0];

  const cslJson: CSLItem = {
    type: item.type === 'journal-article' ? 'article-journal' : (item.type as any),
    id: item.DOI,
    title: item.title?.[0] || '',
    author: item.author?.map((a: any) => ({
      family: a.family || '',
      given: a.given || '',
    })),
    issued: item.published || item['published-print'] || item['published-online'],
    'container-title': item['container-title']?.[0],
    publisher: item.publisher,
    volume: item.volume,
    issue: item.issue,
    page: item.page,
    DOI: item.DOI,
    URL: item.URL,
    ISSN: item.ISSN?.[0],
    ISBN: item.ISBN?.[0],
    abstract: item.abstract,
  };

  return {
    id: item.DOI || item.URL,
    title: item.title?.[0] || '',
    authors:
      item.author?.map((a: any) => ({
        name: `${a.given || ''} ${a.family || ''}`.trim(),
      })) || [],
    abstract: item.abstract,
    year,
    venue: item['container-title']?.[0],
    journal: item['container-title']?.[0],
    doi: item.DOI,
    url: item.URL || `https://doi.org/${item.DOI}`,
    publisher: item.publisher,
    volume: item.volume,
    issue: item.issue,
    pages: item.page,
    citationCount: item['is-referenced-by-count'],
    referenceCount: item['references-count'],
    publicationTypes: [item.type],
    issn: item.ISSN?.[0],
    isbn: item.ISBN?.[0],
    source: 'crossref',
    cslJson,
  };
}

/**
 * Multi-source search - searches all available APIs and merges results
 */
export async function multiSourceSearch(
  query: string,
  options: SearchOptions & { sources?: Array<'semantic_scholar' | 'openalex' | 'crossref'> } = {}
): Promise<AcademicPaper[]> {
  try {
    const { sources = ['semantic_scholar', 'openalex', 'crossref'], ...searchOptions } = options;

    const searchPromises: Promise<AcademicPaper[]>[] = [];

    if (sources.includes('semantic_scholar')) {
      searchPromises.push(
        searchSemanticScholar(query, searchOptions).catch(err => {
          console.warn('[Academic Search] Semantic Scholar failed:', err);
          return [];
        })
      );
    }

    if (sources.includes('openalex')) {
      searchPromises.push(
        searchOpenAlex(query, searchOptions).catch(err => {
          console.warn('[Academic Search] OpenAlex failed:', err);
          return [];
        })
      );
    }

    if (sources.includes('crossref')) {
      searchPromises.push(
        searchCrossref(query, searchOptions).catch(err => {
          console.warn('[Academic Search] Crossref failed:', err);
          return [];
        })
      );
    }

    const results = await Promise.all(searchPromises);

    // Merge and deduplicate results by DOI or title
    const mergedMap = new Map<string, AcademicPaper>();

    for (const paperList of results) {
      for (const paper of paperList) {
        const key = paper.doi || paper.title.toLowerCase().trim();
        if (!mergedMap.has(key)) {
          mergedMap.set(key, paper);
        } else {
          // Merge information from multiple sources
          const existing = mergedMap.get(key)!;
          if (paper.abstract && !existing.abstract) {
            existing.abstract = paper.abstract;
          }
          if (paper.pdfUrl && !existing.pdfUrl) {
            existing.pdfUrl = paper.pdfUrl;
          }
          if (paper.citationCount && !existing.citationCount) {
            existing.citationCount = paper.citationCount;
          }
        }
      }
    }

    // Sort by relevance (citation count) and limit
    const sortedPapers = Array.from(mergedMap.values())
      .sort((a, b) => (b.citationCount || 0) - (a.citationCount || 0))
      .slice(0, options.limit || 10);

    return sortedPapers;
  } catch (error) {
    console.error('[Academic Search] Multi-source search error:', error);
    throw error;
  }
}

/**
 * Store academic paper in Supabase
 */
export async function storePaperInSupabase(
  supabase: SupabaseClient,
  paper: AcademicPaper
): Promise<{ success: boolean; sourceId: string }> {
  try {
    // Check if paper already exists
    const { data: existing } = await supabase
      .from('sources')
      .select('id')
      .eq('doi', paper.doi)
      .single();

    if (existing) {
      return { success: true, sourceId: existing.id };
    }

    // Insert new paper
    const { data, error } = await supabase
      .from('sources')
      .insert({
        doi: paper.doi,
        url: paper.url,
        title: paper.title,
        authors: paper.authors,
        journal: paper.journal,
        year: paper.year,
        venue: paper.venue,
        abstract: paper.abstract,
        pdf_url: paper.pdfUrl,
        citation_count: paper.citationCount,
        source_type: 'article',
        csl_json: paper.cslJson,
        metadata: {
          source: paper.source,
          fieldsOfStudy: paper.fieldsOfStudy,
          publicationTypes: paper.publicationTypes,
          volume: paper.volume,
          issue: paper.issue,
          pages: paper.pages,
        },
      })
      .select('id')
      .single();

    if (error) {
      throw new Error(`Failed to store paper: ${error.message}`);
    }

    return { success: true, sourceId: data.id };
  } catch (error) {
    console.error('[Academic Search] Storage error:', error);
    throw error;
  }
}

/**
 * Link paper to document in Supabase
 */
export async function linkPaperToDocument(
  supabase: SupabaseClient,
  documentId: string,
  sourceId: string,
  userId: string
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('document_sources')
      .insert({
        document_id: documentId,
        source_id: sourceId,
        added_by: userId,
      });

    if (error) {
      // Ignore duplicate errors
      if (error.code !== '23505') {
        throw new Error(`Failed to link paper: ${error.message}`);
      }
    }

    return { success: true };
  } catch (error) {
    console.error('[Academic Search] Link error:', error);
    throw error;
  }
}

/**
 * Search and store papers
 */
export async function searchAndStore(
  supabase: SupabaseClient,
  query: string,
  documentId: string,
  userId: string,
  options: SearchOptions = {}
): Promise<{ papers: AcademicPaper[]; storedCount: number }> {
  try {
    // Search papers
    const papers = await multiSourceSearch(query, options);

    // Store and link papers
    let storedCount = 0;
    for (const paper of papers) {
      try {
        const { sourceId } = await storePaperInSupabase(supabase, paper);
        await linkPaperToDocument(supabase, documentId, sourceId, userId);
        storedCount++;
      } catch (error) {
        console.warn('[Academic Search] Failed to store paper:', paper.title);
      }
    }

    return { papers, storedCount };
  } catch (error) {
    console.error('[Academic Search] Search and store error:', error);
    throw error;
  }
}
