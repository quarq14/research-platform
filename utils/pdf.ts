export async function extractTextFromPDF(file: File): Promise<string> {
  // In a real implementation, you would use pdf.js or similar
  // For now, we'll return a placeholder
  return `Extracted text from ${file.name}\n\nThis is a placeholder for PDF text extraction. In production, this would use pdf.js to extract actual text content from the PDF file.`
}

export function chunkText(text: string, chunkSize = 1000): string[] {
  const chunks: string[] = []
  const sentences = text.split(/[.!?]+/)

  let currentChunk = ""

  for (const sentence of sentences) {
    if ((currentChunk + sentence).length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim())
      currentChunk = sentence
    } else {
      currentChunk += sentence + ". "
    }
  }

  if (currentChunk.trim().length > 0) {
    chunks.push(currentChunk.trim())
  }

  return chunks
}
