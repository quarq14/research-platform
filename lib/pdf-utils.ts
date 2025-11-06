// Chunk text into smaller pieces for RAG
export function chunkText(text: string, chunkSize = 1000, overlap = 200): string[] {
  const chunks: string[] = []
  let start = 0

  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start = end - overlap
  }

  return chunks.length > 0 ? chunks : [text]
}

// Generate embedding (mock - in production use OpenAI/Groq)
export async function generateEmbedding(text: string): Promise<number[]> {
  // Mock embedding - 1536 dimensions
  return Array(1536)
    .fill(0)
    .map(() => Math.random())
}
