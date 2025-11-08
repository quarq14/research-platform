/**
 * Plagiarism Detection Service
 * Implements text comparison algorithms and Copyleaks API integration
 * Provides similarity scoring and match highlighting
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Types
export interface PlagiarismMatch {
  sourceText: string;
  matchedText: string;
  similarity: number;
  startPosition: number;
  endPosition: number;
  sourceUrl?: string;
  sourceTitle?: string;
  matchType: 'exact' | 'paraphrase' | 'similar';
}

export interface PlagiarismReport {
  overallSimilarity: number;
  totalMatches: number;
  matches: PlagiarismMatch[];
  analyzedText: string;
  wordCount: number;
  checkedAt: Date;
  sources: string[];
}

export interface CopyleaksResult {
  scanId: string;
  status: 'pending' | 'completed' | 'error';
  credits: number;
  results?: {
    score: {
      aggregatedScore: number;
      identicalWords: number;
      minorChangedWords: number;
      relatedMeaningWords: number;
    };
    internet: Array<{
      id: string;
      url: string;
      title: string;
      matchedWords: number;
      introduction: string;
    }>;
  };
}

export interface TextComparisonOptions {
  minMatchLength?: number;
  ignoreCase?: boolean;
  ignoreWhitespace?: boolean;
  algorithm?: 'levenshtein' | 'cosine' | 'jaccard' | 'ngram';
}

// Default configuration
const DEFAULT_MIN_MATCH_LENGTH = 20;
const DEFAULT_NGRAM_SIZE = 3;
const COPYLEAKS_API_URL = 'https://api.copyleaks.com';

/**
 * Calculate Levenshtein distance between two strings
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;

  const matrix: number[][] = Array(len1 + 1)
    .fill(null)
    .map(() => Array(len2 + 1).fill(0));

  for (let i = 0; i <= len1; i++) matrix[i][0] = i;
  for (let j = 0; j <= len2; j++) matrix[0][j] = j;

  for (let i = 1; i <= len1; i++) {
    for (let j = 1; j <= len2; j++) {
      const cost = str1[i - 1] === str2[j - 1] ? 0 : 1;
      matrix[i][j] = Math.min(
        matrix[i - 1][j] + 1, // deletion
        matrix[i][j - 1] + 1, // insertion
        matrix[i - 1][j - 1] + cost // substitution
      );
    }
  }

  return matrix[len1][len2];
}

/**
 * Calculate similarity ratio (0-1) using Levenshtein distance
 */
export function levenshteinSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length);
  if (maxLen === 0) return 1.0;

  const distance = levenshteinDistance(str1, str2);
  return 1 - distance / maxLen;
}

/**
 * Calculate Jaccard similarity between two texts
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(text1.toLowerCase().split(/\s+/));
  const words2 = new Set(text2.toLowerCase().split(/\s+/));

  const intersection = new Set([...words1].filter(x => words2.has(x)));
  const union = new Set([...words1, ...words2]);

  return intersection.size / union.size;
}

/**
 * Calculate cosine similarity between two texts using word frequencies
 */
export function cosineSimilarity(text1: string, text2: string): number {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);

  // Build word frequency maps
  const freq1 = new Map<string, number>();
  const freq2 = new Map<string, number>();

  words1.forEach(word => freq1.set(word, (freq1.get(word) || 0) + 1));
  words2.forEach(word => freq2.set(word, (freq2.get(word) || 0) + 1));

  // Get all unique words
  const allWords = new Set([...freq1.keys(), ...freq2.keys()]);

  // Calculate dot product and magnitudes
  let dotProduct = 0;
  let magnitude1 = 0;
  let magnitude2 = 0;

  allWords.forEach(word => {
    const f1 = freq1.get(word) || 0;
    const f2 = freq2.get(word) || 0;

    dotProduct += f1 * f2;
    magnitude1 += f1 * f1;
    magnitude2 += f2 * f2;
  });

  const denominator = Math.sqrt(magnitude1) * Math.sqrt(magnitude2);
  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Generate n-grams from text
 */
export function generateNGrams(text: string, n: number = DEFAULT_NGRAM_SIZE): string[] {
  const words = text.toLowerCase().split(/\s+/).filter(w => w.length > 0);
  const ngrams: string[] = [];

  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }

  return ngrams;
}

/**
 * Calculate n-gram similarity
 */
export function ngramSimilarity(
  text1: string,
  text2: string,
  n: number = DEFAULT_NGRAM_SIZE
): number {
  const ngrams1 = new Set(generateNGrams(text1, n));
  const ngrams2 = new Set(generateNGrams(text2, n));

  const intersection = new Set([...ngrams1].filter(x => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);

  return union.size === 0 ? 0 : intersection.size / union.size;
}

/**
 * Compare two texts and return similarity score
 */
export function compareTexts(
  text1: string,
  text2: string,
  options: TextComparisonOptions = {}
): number {
  const {
    ignoreCase = true,
    ignoreWhitespace = true,
    algorithm = 'cosine',
  } = options;

  let t1 = text1;
  let t2 = text2;

  if (ignoreCase) {
    t1 = t1.toLowerCase();
    t2 = t2.toLowerCase();
  }

  if (ignoreWhitespace) {
    t1 = t1.replace(/\s+/g, ' ').trim();
    t2 = t2.replace(/\s+/g, ' ').trim();
  }

  switch (algorithm) {
    case 'levenshtein':
      return levenshteinSimilarity(t1, t2);
    case 'jaccard':
      return jaccardSimilarity(t1, t2);
    case 'ngram':
      return ngramSimilarity(t1, t2);
    case 'cosine':
    default:
      return cosineSimilarity(t1, t2);
  }
}

/**
 * Find exact matches between two texts
 */
export function findExactMatches(
  sourceText: string,
  targetText: string,
  minLength: number = DEFAULT_MIN_MATCH_LENGTH
): PlagiarismMatch[] {
  const matches: PlagiarismMatch[] = [];

  const sourceWords = sourceText.split(/\s+/);
  const targetWords = targetText.split(/\s+/);

  for (let i = 0; i < sourceWords.length; i++) {
    for (let j = 0; j < targetWords.length; j++) {
      let matchLength = 0;

      // Find longest common substring starting at i and j
      while (
        i + matchLength < sourceWords.length &&
        j + matchLength < targetWords.length &&
        sourceWords[i + matchLength].toLowerCase() ===
          targetWords[j + matchLength].toLowerCase()
      ) {
        matchLength++;
      }

      // If match is long enough, record it
      if (matchLength >= minLength) {
        const matchedText = sourceWords.slice(i, i + matchLength).join(' ');
        const startPos = sourceText.indexOf(matchedText);

        matches.push({
          sourceText: matchedText,
          matchedText,
          similarity: 1.0,
          startPosition: startPos,
          endPosition: startPos + matchedText.length,
          matchType: 'exact',
        });

        // Skip ahead to avoid overlapping matches
        i += matchLength - 1;
        break;
      }
    }
  }

  return matches;
}

/**
 * Find similar passages (paraphrasing detection)
 */
export function findSimilarPassages(
  sourceText: string,
  targetText: string,
  options: { windowSize?: number; threshold?: number } = {}
): PlagiarismMatch[] {
  const { windowSize = 50, threshold = 0.7 } = options;

  const matches: PlagiarismMatch[] = [];

  const sourceWords = sourceText.split(/\s+/);
  const targetWords = targetText.split(/\s+/);

  for (let i = 0; i < sourceWords.length - windowSize; i += Math.floor(windowSize / 2)) {
    const sourceWindow = sourceWords.slice(i, i + windowSize).join(' ');

    for (let j = 0; j < targetWords.length - windowSize; j += Math.floor(windowSize / 2)) {
      const targetWindow = targetWords.slice(j, j + windowSize).join(' ');

      const similarity = cosineSimilarity(sourceWindow, targetWindow);

      if (similarity >= threshold) {
        matches.push({
          sourceText: sourceWindow,
          matchedText: targetWindow,
          similarity,
          startPosition: sourceText.indexOf(sourceWindow),
          endPosition: sourceText.indexOf(sourceWindow) + sourceWindow.length,
          matchType: similarity > 0.9 ? 'exact' : 'paraphrase',
        });
      }
    }
  }

  // Remove overlapping matches, keep highest similarity
  return mergeOverlappingMatches(matches);
}

/**
 * Merge overlapping matches, keeping the best ones
 */
function mergeOverlappingMatches(matches: PlagiarismMatch[]): PlagiarismMatch[] {
  if (matches.length === 0) return [];

  const sorted = matches.sort((a, b) => a.startPosition - b.startPosition);
  const merged: PlagiarismMatch[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const current = sorted[i];
    const last = merged[merged.length - 1];

    // Check if overlapping
    if (current.startPosition <= last.endPosition) {
      // Keep the match with higher similarity
      if (current.similarity > last.similarity) {
        merged[merged.length - 1] = current;
      }
    } else {
      merged.push(current);
    }
  }

  return merged;
}

/**
 * Highlight matches in text
 */
export function highlightMatches(text: string, matches: PlagiarismMatch[]): string {
  let highlighted = text;
  let offset = 0;

  const sortedMatches = [...matches].sort((a, b) => a.startPosition - b.startPosition);

  for (const match of sortedMatches) {
    const start = match.startPosition + offset;
    const end = match.endPosition + offset;

    const color =
      match.matchType === 'exact'
        ? 'red'
        : match.matchType === 'paraphrase'
          ? 'orange'
          : 'yellow';

    const highlightStart = `<mark style="background-color: ${color};" data-similarity="${(match.similarity * 100).toFixed(0)}%">`;
    const highlightEnd = '</mark>';

    highlighted =
      highlighted.slice(0, start) +
      highlightStart +
      highlighted.slice(start, end) +
      highlightEnd +
      highlighted.slice(end);

    offset += highlightStart.length + highlightEnd.length;
  }

  return highlighted;
}

/**
 * Check text for plagiarism using Copyleaks API
 */
export async function checkWithCopyleaks(
  text: string,
  apiKey?: string
): Promise<CopyleaksResult> {
  try {
    const key = apiKey || process.env.COPYLEAKS_API_KEY;

    if (!key) {
      throw new Error('Copyleaks API key not provided');
    }

    // Step 1: Authenticate
    const authResponse = await fetch(`${COPYLEAKS_API_URL}/v3/account/login/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.COPYLEAKS_EMAIL,
        key,
      }),
    });

    if (!authResponse.ok) {
      throw new Error(`Copyleaks authentication failed: ${authResponse.status}`);
    }

    const { access_token } = await authResponse.json();

    // Step 2: Submit scan
    const scanId = `scan_${Date.now()}`;
    const scanResponse = await fetch(
      `${COPYLEAKS_API_URL}/v3/education/submit/file/${scanId}`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${access_token}`,
        },
        body: JSON.stringify({
          base64: Buffer.from(text).toString('base64'),
          filename: 'document.txt',
          properties: {
            webhooks: {
              status: `${process.env.NEXT_PUBLIC_APP_URL}/api/copyleaks/webhook`,
            },
          },
        }),
      }
    );

    if (!scanResponse.ok) {
      throw new Error(`Copyleaks scan submission failed: ${scanResponse.status}`);
    }

    // In production, you would poll for results or use webhooks
    return {
      scanId,
      status: 'pending',
      credits: 1,
    };
  } catch (error) {
    console.error('[Plagiarism] Copyleaks error:', error);
    throw error;
  }
}

/**
 * Get Copyleaks scan results
 */
export async function getCopyleaksResults(
  scanId: string,
  apiKey?: string
): Promise<CopyleaksResult> {
  try {
    const key = apiKey || process.env.COPYLEAKS_API_KEY;

    if (!key) {
      throw new Error('Copyleaks API key not provided');
    }

    // Authenticate
    const authResponse = await fetch(`${COPYLEAKS_API_URL}/v3/account/login/api`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        email: process.env.COPYLEAKS_EMAIL,
        key,
      }),
    });

    if (!authResponse.ok) {
      throw new Error(`Copyleaks authentication failed: ${authResponse.status}`);
    }

    const { access_token } = await authResponse.json();

    // Get results
    const resultsResponse = await fetch(
      `${COPYLEAKS_API_URL}/v3/education/${scanId}/result`,
      {
        headers: {
          Authorization: `Bearer ${access_token}`,
        },
      }
    );

    if (!resultsResponse.ok) {
      throw new Error(`Copyleaks results fetch failed: ${resultsResponse.status}`);
    }

    const results = await resultsResponse.json();

    return {
      scanId,
      status: 'completed',
      credits: 1,
      results,
    };
  } catch (error) {
    console.error('[Plagiarism] Copyleaks results error:', error);
    throw error;
  }
}

/**
 * Perform local plagiarism check against stored documents
 */
export async function checkAgainstDatabase(
  supabase: SupabaseClient,
  text: string,
  options: { excludeDocumentId?: string; threshold?: number } = {}
): Promise<PlagiarismReport> {
  try {
    const { excludeDocumentId, threshold = 0.7 } = options;

    // Fetch all documents
    let query = supabase.from('documents').select('id, title, content');

    if (excludeDocumentId) {
      query = query.neq('id', excludeDocumentId);
    }

    const { data: documents, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch documents: ${error.message}`);
    }

    const matches: PlagiarismMatch[] = [];
    const sources: string[] = [];

    for (const doc of documents || []) {
      if (!doc.content) continue;

      // Check similarity
      const similarity = compareTexts(text, doc.content);

      if (similarity >= threshold) {
        // Find specific matching passages
        const exactMatches = findExactMatches(text, doc.content);
        const similarPassages = findSimilarPassages(text, doc.content);

        const docMatches = [...exactMatches, ...similarPassages].map(match => ({
          ...match,
          sourceUrl: `/documents/${doc.id}`,
          sourceTitle: doc.title,
        }));

        matches.push(...docMatches);
        sources.push(doc.title);
      }
    }

    // Calculate overall similarity
    const overallSimilarity = matches.length > 0
      ? matches.reduce((sum, m) => sum + m.similarity, 0) / matches.length
      : 0;

    return {
      overallSimilarity,
      totalMatches: matches.length,
      matches: mergeOverlappingMatches(matches),
      analyzedText: text,
      wordCount: text.split(/\s+/).length,
      checkedAt: new Date(),
      sources: [...new Set(sources)],
    };
  } catch (error) {
    console.error('[Plagiarism] Database check error:', error);
    throw error;
  }
}

/**
 * Full plagiarism check (database + Copyleaks if available)
 */
export async function checkPlagiarism(
  supabase: SupabaseClient,
  text: string,
  options: {
    excludeDocumentId?: string;
    useCopyleaks?: boolean;
    apiKey?: string;
  } = {}
): Promise<PlagiarismReport> {
  try {
    const { excludeDocumentId, useCopyleaks = false, apiKey } = options;

    // Always check against database
    const dbReport = await checkAgainstDatabase(supabase, text, {
      excludeDocumentId,
    });

    // Optionally check with Copyleaks
    if (useCopyleaks && apiKey) {
      try {
        const copyleaksResult = await checkWithCopyleaks(text, apiKey);

        // Poll for results (in production, use webhooks)
        if (copyleaksResult.status === 'completed' && copyleaksResult.results) {
          // Merge Copyleaks results with database results
          const internetMatches: PlagiarismMatch[] =
            copyleaksResult.results.internet.map(result => ({
              sourceText: result.introduction,
              matchedText: result.introduction,
              similarity: result.matchedWords / text.split(/\s+/).length,
              startPosition: 0,
              endPosition: 0,
              sourceUrl: result.url,
              sourceTitle: result.title,
              matchType: 'exact' as const,
            }));

          dbReport.matches.push(...internetMatches);
          dbReport.sources.push(...copyleaksResult.results.internet.map(r => r.title));
          dbReport.overallSimilarity = Math.max(
            dbReport.overallSimilarity,
            copyleaksResult.results.score.aggregatedScore / 100
          );
        }
      } catch (error) {
        console.warn('[Plagiarism] Copyleaks check failed, using database results only');
      }
    }

    return dbReport;
  } catch (error) {
    console.error('[Plagiarism] Check error:', error);
    throw error;
  }
}

/**
 * Generate plagiarism report as HTML
 */
export function generateHTMLReport(report: PlagiarismReport): string {
  const { overallSimilarity, totalMatches, matches, wordCount, checkedAt, sources } = report;

  const severity =
    overallSimilarity > 0.3
      ? 'High'
      : overallSimilarity > 0.15
        ? 'Moderate'
        : 'Low';

  const severityColor =
    severity === 'High' ? 'red' : severity === 'Moderate' ? 'orange' : 'green';

  let html = `
<!DOCTYPE html>
<html>
<head>
  <title>Plagiarism Report</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 20px; }
    .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
    .severity { font-size: 24px; font-weight: bold; color: ${severityColor}; }
    .match { margin: 10px 0; padding: 10px; border-left: 3px solid ${severityColor}; background: #fff8f0; }
    .stats { display: flex; gap: 20px; margin-top: 10px; }
    .stat { flex: 1; }
  </style>
</head>
<body>
  <h1>Plagiarism Report</h1>

  <div class="summary">
    <div class="severity">Similarity: ${(overallSimilarity * 100).toFixed(1)}% - ${severity} Risk</div>
    <div class="stats">
      <div class="stat">
        <strong>Total Matches:</strong> ${totalMatches}
      </div>
      <div class="stat">
        <strong>Word Count:</strong> ${wordCount}
      </div>
      <div class="stat">
        <strong>Checked:</strong> ${checkedAt.toLocaleString()}
      </div>
    </div>
    <div style="margin-top: 10px;">
      <strong>Sources:</strong> ${sources.length > 0 ? sources.join(', ') : 'None'}
    </div>
  </div>

  <h2>Matches Found</h2>
`;

  for (const match of matches) {
    html += `
  <div class="match">
    <strong>${match.matchType.toUpperCase()} - ${(match.similarity * 100).toFixed(0)}% similar</strong>
    ${match.sourceTitle ? `<div>Source: ${match.sourceTitle}</div>` : ''}
    ${match.sourceUrl ? `<div><a href="${match.sourceUrl}" target="_blank">View Source</a></div>` : ''}
    <div style="margin-top: 10px; font-style: italic;">"${match.matchedText.slice(0, 200)}..."</div>
  </div>
`;
  }

  html += `
</body>
</html>
`;

  return html;
}
