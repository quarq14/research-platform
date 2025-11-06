// PDF text extraction utility
// Note: For production, implement server-side PDF extraction using pdf-parse
// Client-side PDF parsing has limitations with complex PDFs

export async function extractTextFromPDF(file: File): Promise<{ text: string; pages: number }> {
  try {
    // For production: Call backend API endpoint
    // const response = await fetch('/api/pdf/extract', {
    //   method: 'POST',
    //   body: formData
    // })
    
    // Temporary: Estimate pages from file size (1 page ≈ 100KB)
    const estimatedPages = Math.max(1, Math.floor(file.size / 102400))
    
    // Return placeholder text for now
    return {
      text: `[PDF Upload Başarılı: ${file.name}]\n\nBu PDF ${estimatedPages} sayfa içeriyor. Gerçek metin çıkarma için lütfen backend PDF extraction servisi ekleyin.\n\nÖnerilen yaklaşım:\n1. Supabase Edge Function oluşturun\n2. pdf-parse veya Apache Tika kullanın\n3. Çıkarılan metni chunks tablosuna kaydedin`,
      pages: estimatedPages
    }
  } catch (error: any) {
    console.error('PDF extraction error:', error)
    return {
      text: `[PDF içeriği okunamadı: ${file.name}] Hata: ${error.message}`,
      pages: 1
    }
  }
}

// Chunk text into smaller pieces for RAG
export function chunkText(text: string, chunkSize: number = 1000, overlap: number = 200): string[] {
  const chunks: string[] = []
  let start = 0
  
  while (start < text.length) {
    const end = Math.min(start + chunkSize, text.length)
    chunks.push(text.slice(start, end))
    start = end - overlap
  }
  
  return chunks
}

// Generate embedding (mock - in production use OpenAI/Groq)
export async function generateEmbedding(text: string): Promise<number[]> {
  // Mock embedding - 1536 dimensions
  return Array(1536).fill(0).map(() => Math.random())
}
