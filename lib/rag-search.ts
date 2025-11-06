// Advanced RAG search utilities with hybrid search

import type { SupabaseClient } from "@supabase/supabase-js"
import { generateEmbedding, cosineSimilarity } from "./embeddings"

export interface SearchResult {
  chunk_id: string
  content: string
  page_number: number
  score: number
  file_id: string
}

export async function hybridSearch(
  supabase: SupabaseClient,
  query: string,
  fileId: string,
  topK = 5,
): Promise<SearchResult[]> {
  try {
    // Get all chunks for the file
    const { data: chunks, error } = await supabase.from("chunks").select("*").eq("file_id", fileId)

    if (error || !chunks) {
      console.error("[v0] Chunks fetch error:", error)
      return []
    }

    // Generate query embedding
    const queryEmbedding = await generateEmbedding(query)

    // Extract keywords from query
    const keywords = query
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)

    // Score each chunk using hybrid approach
    const scoredChunks = chunks.map((chunk) => {
      const content = chunk.content.toLowerCase()

      // Keyword matching score (BM25-like)
      const keywordScore = keywords.reduce((score, keyword) => {
        const regex = new RegExp(keyword, "g")
        const matches = content.match(regex) || []
        // TF-IDF approximation
        const tf = matches.length / content.split(/\s+/).length
        return score + tf
      }, 0)

      // Vector similarity score
      let vectorScore = 0
      if (chunk.embedding) {
        try {
          const chunkEmbedding = JSON.parse(chunk.embedding)
          vectorScore = cosineSimilarity(queryEmbedding, chunkEmbedding)
        } catch (e) {
          console.error("[v0] Embedding parse error:", e)
        }
      }

      // Combined score (weighted average)
      const combinedScore = 0.6 * vectorScore + 0.4 * keywordScore

      return {
        chunk_id: chunk.id,
        content: chunk.content,
        page_number: chunk.page_number,
        file_id: chunk.file_id,
        score: combinedScore,
      }
    })

    // Sort by score and return top K
    return scoredChunks.sort((a, b) => b.score - a.score).slice(0, topK)
  } catch (error) {
    console.error("[v0] Hybrid search error:", error)
    return []
  }
}

export function formatContextWithCitations(results: SearchResult[]): string {
  return results
    .map((result, idx) => {
      return `[Source ${idx + 1}, Page ${result.page_number}]\n${result.content}`
    })
    .join("\n\n---\n\n")
}
