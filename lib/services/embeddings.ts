/**
 * Embeddings Service
 * Handles text embedding generation using OpenAI and free alternatives
 * Includes batch processing and Supabase pgvector storage
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Types
export interface EmbeddingProvider {
  name: string;
  dimension: number;
  maxTokens: number;
  costPer1kTokens: number;
}

export interface EmbeddingResult {
  embedding: number[];
  tokens: number;
  provider: string;
}

export interface BatchEmbeddingResult {
  embeddings: number[][];
  tokens: number;
  provider: string;
  errors: Array<{ index: number; error: string }>;
}

// Provider configurations
export const EMBEDDING_PROVIDERS: Record<string, EmbeddingProvider> = {
  openai: {
    name: 'text-embedding-3-small',
    dimension: 1536,
    maxTokens: 8191,
    costPer1kTokens: 0.00002,
  },
  openai_large: {
    name: 'text-embedding-3-large',
    dimension: 3072,
    maxTokens: 8191,
    costPer1kTokens: 0.00013,
  },
  // Free alternatives (would require additional implementation)
  transformers: {
    name: 'sentence-transformers/all-MiniLM-L6-v2',
    dimension: 384,
    maxTokens: 256,
    costPer1kTokens: 0,
  },
};

/**
 * Generate embedding using OpenAI
 */
export async function generateOpenAIEmbedding(
  text: string,
  apiKey?: string,
  model: string = 'text-embedding-3-small'
): Promise<EmbeddingResult> {
  try {
    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
      throw new Error('OpenAI API key not provided');
    }

    const response = await fetch('https://api.openai.com/v1/embeddings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        input: text,
        model,
      }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Unknown error' }));
      throw new Error(
        `OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
      );
    }

    const data = await response.json();

    return {
      embedding: data.data[0].embedding,
      tokens: data.usage.total_tokens,
      provider: 'openai',
    };
  } catch (error) {
    console.error('[Embeddings] OpenAI generation error:', error);
    throw error;
  }
}

/**
 * Generate embeddings in batch using OpenAI
 * More efficient for processing multiple texts
 */
export async function generateOpenAIEmbeddingsBatch(
  texts: string[],
  apiKey?: string,
  model: string = 'text-embedding-3-small'
): Promise<BatchEmbeddingResult> {
  try {
    const key = apiKey || process.env.OPENAI_API_KEY;

    if (!key) {
      throw new Error('OpenAI API key not provided');
    }

    // OpenAI supports batch processing up to 2048 inputs
    const batchSize = 2048;
    const batches: string[][] = [];

    for (let i = 0; i < texts.length; i += batchSize) {
      batches.push(texts.slice(i, i + batchSize));
    }

    const allEmbeddings: number[][] = [];
    let totalTokens = 0;
    const errors: Array<{ index: number; error: string }> = [];

    for (const batch of batches) {
      try {
        const response = await fetch('https://api.openai.com/v1/embeddings', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${key}`,
          },
          body: JSON.stringify({
            input: batch,
            model,
          }),
        });

        if (!response.ok) {
          const error = await response.json().catch(() => ({ error: 'Unknown error' }));
          throw new Error(
            `OpenAI API error: ${response.status} - ${error.error?.message || 'Unknown error'}`
          );
        }

        const data = await response.json();

        // Collect embeddings
        for (const item of data.data) {
          allEmbeddings.push(item.embedding);
        }

        totalTokens += data.usage.total_tokens;
      } catch (error) {
        console.error('[Embeddings] Batch processing error:', error);
        // Record errors but continue processing
        for (let i = 0; i < batch.length; i++) {
          errors.push({
            index: allEmbeddings.length + i,
            error: error instanceof Error ? error.message : 'Unknown error',
          });
          // Push empty embedding as placeholder
          allEmbeddings.push([]);
        }
      }
    }

    return {
      embeddings: allEmbeddings,
      tokens: totalTokens,
      provider: 'openai',
      errors,
    };
  } catch (error) {
    console.error('[Embeddings] OpenAI batch generation error:', error);
    throw error;
  }
}

/**
 * Generate free embedding using local model (placeholder)
 * In production, you could use:
 * - @xenova/transformers (browser/Node.js)
 * - sentence-transformers via Python subprocess
 * - Hugging Face Inference API (free tier)
 */
export async function generateFreeEmbedding(text: string): Promise<EmbeddingResult> {
  try {
    // Option 1: Use Hugging Face Inference API (has free tier)
    const hfToken = process.env.HUGGINGFACE_API_KEY;

    if (hfToken) {
      return await generateHuggingFaceEmbedding(text, hfToken);
    }

    // Option 2: Fallback to deterministic hash-based pseudo-embedding
    // NOT suitable for production semantic search!
    console.warn(
      '[Embeddings] Using fallback hash-based embedding. Not suitable for production!'
    );

    const embedding = generateHashBasedEmbedding(text);

    return {
      embedding,
      tokens: Math.ceil(text.length / 4),
      provider: 'hash_fallback',
    };
  } catch (error) {
    console.error('[Embeddings] Free generation error:', error);
    throw error;
  }
}

/**
 * Generate embedding using Hugging Face Inference API
 */
async function generateHuggingFaceEmbedding(
  text: string,
  apiKey: string
): Promise<EmbeddingResult> {
  try {
    const response = await fetch(
      'https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          inputs: text,
          options: { wait_for_model: true },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`Hugging Face API error: ${response.status}`);
    }

    const embedding = await response.json();

    return {
      embedding: Array.isArray(embedding[0]) ? embedding[0] : embedding,
      tokens: Math.ceil(text.length / 4),
      provider: 'huggingface',
    };
  } catch (error) {
    console.error('[Embeddings] Hugging Face error:', error);
    throw error;
  }
}

/**
 * Generate deterministic hash-based embedding (fallback only)
 * WARNING: This is NOT a real semantic embedding!
 */
function generateHashBasedEmbedding(text: string, dimension: number = 1536): number[] {
  const embedding = new Array(dimension).fill(0);
  const normalized = text.toLowerCase().trim();

  // Simple hash function to generate pseudo-random but deterministic values
  for (let i = 0; i < normalized.length; i++) {
    const charCode = normalized.charCodeAt(i);
    const index = (charCode * (i + 1)) % dimension;
    embedding[index] += Math.sin(charCode * (i + 1)) * 0.1;
  }

  // Normalize to unit vector
  const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / (magnitude || 1));
}

/**
 * Calculate cosine similarity between two embeddings
 */
export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same dimension');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  const denominator = Math.sqrt(normA) * Math.sqrt(normB);

  return denominator === 0 ? 0 : dotProduct / denominator;
}

/**
 * Store embedding in Supabase pgvector
 */
export async function storeEmbedding(
  supabase: SupabaseClient,
  chunkId: string,
  embedding: number[]
): Promise<{ success: boolean }> {
  try {
    const { error } = await supabase
      .from('chunks')
      .update({ embedding: JSON.stringify(embedding) })
      .eq('id', chunkId);

    if (error) {
      throw new Error(`Failed to store embedding: ${error.message}`);
    }

    return { success: true };
  } catch (error) {
    console.error('[Embeddings] Storage error:', error);
    throw error;
  }
}

/**
 * Store embeddings in batch
 */
export async function storeEmbeddingsBatch(
  supabase: SupabaseClient,
  chunkIds: string[],
  embeddings: number[][]
): Promise<{ success: boolean; errors: Array<{ chunkId: string; error: string }> }> {
  try {
    if (chunkIds.length !== embeddings.length) {
      throw new Error('Chunk IDs and embeddings arrays must have the same length');
    }

    const errors: Array<{ chunkId: string; error: string }> = [];

    // Update in batches to avoid overwhelming the database
    const batchSize = 100;

    for (let i = 0; i < chunkIds.length; i += batchSize) {
      const batchChunkIds = chunkIds.slice(i, i + batchSize);
      const batchEmbeddings = embeddings.slice(i, i + batchSize);

      // Update each chunk with its embedding
      for (let j = 0; j < batchChunkIds.length; j++) {
        try {
          await storeEmbedding(supabase, batchChunkIds[j], batchEmbeddings[j]);
        } catch (error) {
          errors.push({
            chunkId: batchChunkIds[j],
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }
    }

    return {
      success: errors.length === 0,
      errors,
    };
  } catch (error) {
    console.error('[Embeddings] Batch storage error:', error);
    throw error;
  }
}

/**
 * Process chunks and generate embeddings
 */
export async function processChunksWithEmbeddings(
  supabase: SupabaseClient,
  fileId: string,
  options: {
    provider?: 'openai' | 'free';
    apiKey?: string;
    model?: string;
  } = {}
): Promise<{ success: boolean; processedCount: number }> {
  try {
    const { provider = 'openai', apiKey, model } = options;

    // Fetch chunks for this file
    const { data: chunks, error: fetchError } = await supabase
      .from('chunks')
      .select('id, content')
      .eq('file_id', fileId)
      .is('embedding', null);

    if (fetchError) {
      throw new Error(`Failed to fetch chunks: ${fetchError.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return { success: true, processedCount: 0 };
    }

    // Generate embeddings in batch
    let embeddings: number[][];

    if (provider === 'openai') {
      const result = await generateOpenAIEmbeddingsBatch(
        chunks.map(c => c.content),
        apiKey,
        model
      );
      embeddings = result.embeddings;

      // Log token usage
      console.log(
        `[Embeddings] Generated ${embeddings.length} embeddings using ${result.tokens} tokens`
      );
    } else {
      // Generate free embeddings one by one
      embeddings = [];
      for (const chunk of chunks) {
        const result = await generateFreeEmbedding(chunk.content);
        embeddings.push(result.embedding);
      }
    }

    // Store embeddings
    const { errors } = await storeEmbeddingsBatch(
      supabase,
      chunks.map(c => c.id),
      embeddings
    );

    if (errors.length > 0) {
      console.warn(`[Embeddings] ${errors.length} chunks failed to store`);
    }

    return {
      success: errors.length === 0,
      processedCount: chunks.length - errors.length,
    };
  } catch (error) {
    console.error('[Embeddings] Chunk processing error:', error);
    throw error;
  }
}

/**
 * Search for similar chunks using vector similarity
 */
export async function searchSimilarChunks(
  supabase: SupabaseClient,
  query: string,
  options: {
    fileId?: string;
    limit?: number;
    threshold?: number;
    provider?: 'openai' | 'free';
    apiKey?: string;
  } = {}
): Promise<
  Array<{
    id: string;
    content: string;
    pageNumber: number;
    similarity: number;
  }>
> {
  try {
    const {
      fileId,
      limit = 10,
      threshold = 0.7,
      provider = 'openai',
      apiKey,
    } = options;

    // Generate query embedding
    let queryEmbedding: number[];

    if (provider === 'openai') {
      const result = await generateOpenAIEmbedding(query, apiKey);
      queryEmbedding = result.embedding;
    } else {
      const result = await generateFreeEmbedding(query);
      queryEmbedding = result.embedding;
    }

    // Fetch all chunks (with optional file filter)
    let query_builder = supabase
      .from('chunks')
      .select('id, content, page_number, embedding')
      .not('embedding', 'is', null);

    if (fileId) {
      query_builder = query_builder.eq('file_id', fileId);
    }

    const { data: chunks, error } = await query_builder;

    if (error) {
      throw new Error(`Failed to fetch chunks: ${error.message}`);
    }

    if (!chunks || chunks.length === 0) {
      return [];
    }

    // Calculate similarities
    const results = chunks
      .map(chunk => {
        const chunkEmbedding = JSON.parse(chunk.embedding);
        const similarity = cosineSimilarity(queryEmbedding, chunkEmbedding);

        return {
          id: chunk.id,
          content: chunk.content,
          pageNumber: chunk.page_number,
          similarity,
        };
      })
      .filter(result => result.similarity >= threshold)
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, limit);

    return results;
  } catch (error) {
    console.error('[Embeddings] Search error:', error);
    throw error;
  }
}
