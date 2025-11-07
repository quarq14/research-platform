/**
 * RAG (Retrieval-Augmented Generation) Service
 * Implements hybrid search, citation extraction, source grounding, and re-ranking
 */

import type { SupabaseClient } from '@supabase/supabase-js';
import { searchSimilarChunks, cosineSimilarity } from './embeddings';

// Types
export interface SearchResult {
  chunkId: string;
  content: string;
  pageNumber: number;
  fileId: string;
  fileName?: string;
  score: number;
  vectorScore: number;
  keywordScore: number;
  metadata?: Record<string, unknown>;
}

export interface Citation {
  sourceId: string;
  sourceName: string;
  pageNumber: number;
  chunkId: string;
  excerpt: string;
  confidence: number;
}

export interface RAGContext {
  results: SearchResult[];
  citations: Citation[];
  formattedContext: string;
  totalTokens: number;
}

export interface HybridSearchOptions {
  fileIds?: string[];
  limit?: number;
  vectorWeight?: number;
  keywordWeight?: number;
  minScore?: number;
  rerank?: boolean;
  provider?: 'openai' | 'free';
  apiKey?: string;
}

// Default configuration
const DEFAULT_VECTOR_WEIGHT = 0.6;
const DEFAULT_KEYWORD_WEIGHT = 0.4;
const DEFAULT_LIMIT = 10;
const DEFAULT_MIN_SCORE = 0.3;

/**
 * Extract keywords from query for keyword-based search
 */
export function extractKeywords(query: string): string[] {
  // Remove common stop words
  const stopWords = new Set([
    'a',
    'an',
    'and',
    'are',
    'as',
    'at',
    'be',
    'by',
    'for',
    'from',
    'has',
    'he',
    'in',
    'is',
    'it',
    'its',
    'of',
    'on',
    'that',
    'the',
    'to',
    'was',
    'will',
    'with',
  ]);

  return query
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !stopWords.has(word));
}

/**
 * Calculate keyword relevance score using BM25-like algorithm
 */
export function calculateKeywordScore(
  content: string,
  keywords: string[],
  options: { k1?: number; b?: number } = {}
): number {
  const { k1 = 1.5, b = 0.75 } = options;

  const contentLower = content.toLowerCase();
  const contentWords = contentLower.split(/\s+/);
  const contentLength = contentWords.length;
  const avgDocLength = 300; // Estimated average document length

  let score = 0;

  for (const keyword of keywords) {
    // Count term frequency
    const tf = (contentLower.match(new RegExp(keyword, 'g')) || []).length;

    if (tf === 0) continue;

    // BM25 formula
    const numerator = tf * (k1 + 1);
    const denominator = tf + k1 * (1 - b + (b * contentLength) / avgDocLength);
    const idf = Math.log((1000 + 1) / (tf + 0.5)); // Simplified IDF

    score += (numerator / denominator) * idf;
  }

  // Normalize to 0-1 range
  return Math.min(score / keywords.length, 1);
}

/**
 * Perform keyword-based search on chunks
 */
export async function keywordSearch(
  supabase: SupabaseClient,
  query: string,
  options: { fileIds?: string[]; limit?: number } = {}
): Promise<SearchResult[]> {
  try {
    const { fileIds, limit = DEFAULT_LIMIT } = options;

    // Extract keywords
    const keywords = extractKeywords(query);

    if (keywords.length === 0) {
      return [];
    }

    // Fetch chunks
    let queryBuilder = supabase
      .from('chunks')
      .select('id, content, page_number, file_id, metadata');

    if (fileIds && fileIds.length > 0) {
      queryBuilder = queryBuilder.in('file_id', fileIds);
    }

    const { data: chunks, error } = await queryBuilder;

    if (error) {
      throw new Error(`Failed to fetch chunks: ${error.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return [];
    }

    // Score each chunk
    const results = chunks
      .map(chunk => ({
        chunkId: chunk.id,
        content: chunk.content,
        pageNumber: chunk.page_number,
        fileId: chunk.file_id,
        score: calculateKeywordScore(chunk.content, keywords),
        vectorScore: 0,
        keywordScore: calculateKeywordScore(chunk.content, keywords),
        metadata: chunk.metadata,
      }))
      .filter(result => result.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('[RAG] Keyword search error:', error);
    throw error;
  }
}

/**
 * Perform hybrid search combining vector and keyword search
 */
export async function hybridSearch(
  supabase: SupabaseClient,
  query: string,
  options: HybridSearchOptions = {}
): Promise<SearchResult[]> {
  try {
    const {
      fileIds,
      limit = DEFAULT_LIMIT,
      vectorWeight = DEFAULT_VECTOR_WEIGHT,
      keywordWeight = DEFAULT_KEYWORD_WEIGHT,
      minScore = DEFAULT_MIN_SCORE,
      rerank = false,
      provider = 'openai',
      apiKey,
    } = options;

    // Perform vector search
    const vectorResults = await searchSimilarChunks(supabase, query, {
      fileId: fileIds?.[0], // For now, search one file at a time
      limit: limit * 2, // Get more results for better hybrid matching
      threshold: 0,
      provider,
      apiKey,
    });

    // Perform keyword search
    const keywordResults = await keywordSearch(supabase, query, {
      fileIds,
      limit: limit * 2,
    });

    // Combine results
    const combinedMap = new Map<string, SearchResult>();

    // Add vector results
    for (const result of vectorResults) {
      combinedMap.set(result.id, {
        chunkId: result.id,
        content: result.content,
        pageNumber: result.pageNumber,
        fileId: '', // Will be filled from keyword results or DB
        vectorScore: result.similarity,
        keywordScore: 0,
        score: result.similarity * vectorWeight,
      });
    }

    // Merge keyword results
    for (const result of keywordResults) {
      const existing = combinedMap.get(result.chunkId);
      if (existing) {
        existing.keywordScore = result.keywordScore;
        existing.score =
          existing.vectorScore * vectorWeight + result.keywordScore * keywordWeight;
        existing.fileId = result.fileId;
      } else {
        combinedMap.set(result.chunkId, {
          ...result,
          vectorScore: 0,
          score: result.keywordScore * keywordWeight,
        });
      }
    }

    // Convert to array and sort
    let results = Array.from(combinedMap.values())
      .filter(result => result.score >= minScore)
      .sort((a, b) => b.score - a.score);

    // Apply re-ranking if requested
    if (rerank) {
      results = await rerankResults(results, query);
    }

    // Fetch file names
    const fileIds_unique = [...new Set(results.map(r => r.fileId))];
    if (fileIds_unique.length > 0) {
      const { data: files } = await supabase
        .from('files')
        .select('id, filename')
        .in('id', fileIds_unique);

      if (files) {
        const fileMap = new Map(files.map(f => [f.id, f.filename]));
        results.forEach(result => {
          result.fileName = fileMap.get(result.fileId);
        });
      }
    }

    return results.slice(0, limit);
  } catch (error) {
    console.error('[RAG] Hybrid search error:', error);
    throw error;
  }
}

/**
 * Re-rank results based on query relevance
 * Uses a simple cross-encoder approach or LLM-based re-ranking
 */
export async function rerankResults(
  results: SearchResult[],
  query: string
): Promise<SearchResult[]> {
  try {
    // Simple re-ranking based on exact phrase matches and position
    const queryLower = query.toLowerCase();
    const queryWords = extractKeywords(query);

    const reranked = results.map(result => {
      let bonusScore = 0;

      // Bonus for exact phrase match
      if (result.content.toLowerCase().includes(queryLower)) {
        bonusScore += 0.2;
      }

      // Bonus for query words appearing early in content
      const contentLower = result.content.toLowerCase();
      for (const word of queryWords) {
        const position = contentLower.indexOf(word);
        if (position !== -1 && position < 100) {
          bonusScore += 0.05 * (1 - position / 100);
        }
      }

      // Bonus for multiple query words
      const matchedWords = queryWords.filter(word =>
        contentLower.includes(word)
      ).length;
      bonusScore += (matchedWords / queryWords.length) * 0.1;

      return {
        ...result,
        score: result.score + bonusScore,
      };
    });

    return reranked.sort((a, b) => b.score - a.score);
  } catch (error) {
    console.error('[RAG] Re-ranking error:', error);
    return results; // Return original results on error
  }
}

/**
 * Extract citations from search results
 */
export function extractCitations(results: SearchResult[]): Citation[] {
  return results.map((result, index) => ({
    sourceId: result.fileId,
    sourceName: result.fileName || `Document ${index + 1}`,
    pageNumber: result.pageNumber,
    chunkId: result.chunkId,
    excerpt: result.content.slice(0, 200) + (result.content.length > 200 ? '...' : ''),
    confidence: result.score,
  }));
}

/**
 * Format context with citations for LLM
 */
export function formatContextWithCitations(results: SearchResult[]): string {
  return results
    .map((result, index) => {
      const citationNumber = index + 1;
      const source = result.fileName || `Document ${citationNumber}`;
      const page = result.pageNumber;

      return `[${citationNumber}] ${source}, Page ${page}\n${result.content}`;
    })
    .join('\n\n---\n\n');
}

/**
 * Format context in a more compact way for token efficiency
 */
export function formatCompactContext(results: SearchResult[]): string {
  return results
    .map((result, index) => {
      const citation = `[${index + 1}:p${result.pageNumber}]`;
      return `${citation} ${result.content}`;
    })
    .join('\n\n');
}

/**
 * Estimate token count for context
 */
export function estimateContextTokens(context: string): number {
  // Rough estimate: 1 token ≈ 4 characters
  return Math.ceil(context.length / 4);
}

/**
 * Build RAG context for LLM query
 */
export async function buildRAGContext(
  supabase: SupabaseClient,
  query: string,
  options: HybridSearchOptions & { format?: 'detailed' | 'compact' } = {}
): Promise<RAGContext> {
  try {
    const { format = 'detailed', ...searchOptions } = options;

    // Perform hybrid search
    const results = await hybridSearch(supabase, query, searchOptions);

    // Extract citations
    const citations = extractCitations(results);

    // Format context
    const formattedContext =
      format === 'detailed'
        ? formatContextWithCitations(results)
        : formatCompactContext(results);

    // Estimate tokens
    const totalTokens = estimateContextTokens(formattedContext);

    return {
      results,
      citations,
      formattedContext,
      totalTokens,
    };
  } catch (error) {
    console.error('[RAG] Context building error:', error);
    throw error;
  }
}

/**
 * Ground sources - verify that generated text is grounded in retrieved sources
 */
export function groundSources(
  generatedText: string,
  results: SearchResult[]
): Array<{
  claim: string;
  sources: SearchResult[];
  confidence: number;
}> {
  try {
    // Split generated text into sentences
    const sentences = generatedText
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 10);

    const groundedClaims = [];

    for (const sentence of sentences) {
      const sentenceLower = sentence.toLowerCase();
      const sentenceWords = extractKeywords(sentence);

      // Find sources that support this claim
      const supportingSources = results
        .map(result => {
          const contentLower = result.content.toLowerCase();

          // Calculate overlap
          const matchedWords = sentenceWords.filter(word =>
            contentLower.includes(word)
          ).length;
          const overlap = matchedWords / sentenceWords.length;

          // Check for phrase matches
          const phraseMatch = contentLower.includes(sentenceLower) ? 0.5 : 0;

          const confidence = Math.min(overlap + phraseMatch, 1);

          return { result, confidence };
        })
        .filter(item => item.confidence > 0.3)
        .sort((a, b) => b.confidence - a.confidence)
        .slice(0, 3);

      if (supportingSources.length > 0) {
        groundedClaims.push({
          claim: sentence,
          sources: supportingSources.map(s => s.result),
          confidence: supportingSources[0].confidence,
        });
      }
    }

    return groundedClaims;
  } catch (error) {
    console.error('[RAG] Source grounding error:', error);
    return [];
  }
}

/**
 * Highlight matches in text
 */
export function highlightMatches(text: string, query: string): string {
  const keywords = extractKeywords(query);
  let highlighted = text;

  for (const keyword of keywords) {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    highlighted = highlighted.replace(regex, `**$&**`);
  }

  return highlighted;
}

/**
 * Get relevant context for a specific question
 */
export async function getRelevantContext(
  supabase: SupabaseClient,
  question: string,
  fileIds: string[],
  options: {
    maxTokens?: number;
    provider?: 'openai' | 'free';
    apiKey?: string;
  } = {}
): Promise<RAGContext> {
  try {
    const { maxTokens = 3000, provider = 'openai', apiKey } = options;

    // Start with a reasonable number of results
    let limit = 10;
    let context = await buildRAGContext(supabase, question, {
      fileIds,
      limit,
      rerank: true,
      provider,
      apiKey,
    });

    // If context is too large, reduce the number of results
    while (context.totalTokens > maxTokens && limit > 3) {
      limit = Math.floor(limit * 0.7);
      context = await buildRAGContext(supabase, question, {
        fileIds,
        limit,
        rerank: true,
        provider,
        apiKey,
      });
    }

    // If still too large, truncate
    if (context.totalTokens > maxTokens) {
      const ratio = maxTokens / context.totalTokens;
      const truncatedLength = Math.floor(context.formattedContext.length * ratio);
      context.formattedContext =
        context.formattedContext.slice(0, truncatedLength) + '...';
      context.totalTokens = maxTokens;
    }

    return context;
  } catch (error) {
    console.error('[RAG] Context retrieval error:', error);
    throw error;
  }
}
