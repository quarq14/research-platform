// Embedding utilities for RAG pipeline

export async function generateEmbedding(text: string): Promise<number[]> {
  try {
    // Use Groq's embedding model or fallback to a simple hash-based approach
    // In production, use a proper embedding API like OpenAI, Cohere, or Voyage

    // For now, return a mock embedding (in production, call actual API)
    const mockEmbedding = new Array(1536).fill(0).map(() => Math.random())
    return mockEmbedding
  } catch (error) {
    console.error("[v0] Embedding generation error:", error)
    throw error
  }
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) return 0

  let dotProduct = 0
  let normA = 0
  let normB = 0

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i]
    normA += a[i] * a[i]
    normB += b[i] * b[i]
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB))
}

export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    const chunk = text.slice(start, end)
    chunks.push(chunk)
    start = end - overlap

    if (start >= text.length) break
  }

  return chunks
}
