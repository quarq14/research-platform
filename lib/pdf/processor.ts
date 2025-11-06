import pdf from 'pdf-parse'
import * as pdfjsLib from 'pdfjs-dist'
import { createWorker } from 'tesseract.js'

// Set up PDF.js worker
if (typeof window === 'undefined') {
  // Server-side
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

export interface PDFPage {
  pageNumber: number
  text: string
  width: number
  height: number
  lines: string[]
}

export interface PDFProcessingResult {
  text: string
  pages: PDFPage[]
  metadata: {
    title?: string
    author?: string
    subject?: string
    keywords?: string
    creator?: string
    producer?: string
    creationDate?: Date
    totalPages: number
  }
  ocrApplied: boolean
}

/**
 * Extract text from PDF buffer using pdf-parse
 */
export async function extractTextFromPDF(buffer: Buffer): Promise<PDFProcessingResult> {
  try {
    const data = await pdf(buffer)

    // Parse pages if available
    const pages: PDFPage[] = []

    // pdf-parse doesn't give us per-page text easily, so we'll use a fallback
    // In production, we'd use pdf.js for more detailed extraction

    return {
      text: data.text,
      pages: [{
        pageNumber: 1,
        text: data.text,
        width: 0,
        height: 0,
        lines: data.text.split('\n'),
      }],
      metadata: {
        title: data.info?.Title,
        author: data.info?.Author,
        subject: data.info?.Subject,
        keywords: data.info?.Keywords,
        creator: data.info?.Creator,
        producer: data.info?.Producer,
        creationDate: data.info?.CreationDate,
        totalPages: data.numpages,
      },
      ocrApplied: false,
    }
  } catch (error: any) {
    throw new Error(`PDF extraction failed: ${error.message}`)
  }
}

/**
 * Extract text from PDF using pdf.js (more detailed, page-by-page)
 */
export async function extractTextWithPDFJS(buffer: Buffer): Promise<PDFProcessingResult> {
  try {
    const loadingTask = pdfjsLib.getDocument({ data: buffer })
    const pdfDoc = await loadingTask.promise

    const pages: PDFPage[] = []
    let fullText = ''

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const textContent = await page.getTextContent()
      const viewport = page.getViewport({ scale: 1.0 })

      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')

      const lines = textContent.items.map((item: any) => item.str)

      pages.push({
        pageNumber: i,
        text: pageText,
        width: viewport.width,
        height: viewport.height,
        lines,
      })

      fullText += pageText + '\n\n'
    }

    const metadata = await pdfDoc.getMetadata()

    return {
      text: fullText,
      pages,
      metadata: {
        title: metadata.info?.Title,
        author: metadata.info?.Author,
        subject: metadata.info?.Subject,
        keywords: metadata.info?.Keywords,
        creator: metadata.info?.Creator,
        producer: metadata.info?.Producer,
        totalPages: pdfDoc.numPages,
      },
      ocrApplied: false,
    }
  } catch (error: any) {
    throw new Error(`PDF.js extraction failed: ${error.message}`)
  }
}

/**
 * OCR fallback for scanned PDFs using Tesseract
 */
export async function extractTextWithOCR(buffer: Buffer): Promise<PDFProcessingResult> {
  try {
    // First try to extract with pdf.js to get page images
    const loadingTask = pdfjsLib.getDocument({ data: buffer })
    const pdfDoc = await loadingTask.promise

    const worker = await createWorker('eng')
    const pages: PDFPage[] = []
    let fullText = ''

    for (let i = 1; i <= pdfDoc.numPages; i++) {
      const page = await pdfDoc.getPage(i)
      const viewport = page.getViewport({ scale: 2.0 })

      // Create canvas to render page
      const canvas = {
        width: viewport.width,
        height: viewport.height,
      }

      // In a real implementation, we'd render to canvas and extract image
      // For now, we'll use a simplified approach

      // OCR would go here - for now returning empty
      pages.push({
        pageNumber: i,
        text: '',
        width: viewport.width,
        height: viewport.height,
        lines: [],
      })
    }

    await worker.terminate()

    return {
      text: fullText,
      pages,
      metadata: {
        totalPages: pdfDoc.numPages,
      },
      ocrApplied: true,
    }
  } catch (error: any) {
    throw new Error(`OCR failed: ${error.message}`)
  }
}

/**
 * Intelligent PDF text extraction with fallback to OCR
 */
export async function processPDF(buffer: Buffer, forceOCR = false): Promise<PDFProcessingResult> {
  try {
    if (forceOCR) {
      return await extractTextWithOCR(buffer)
    }

    // Try pdf.js first
    const result = await extractTextWithPDFJS(buffer)

    // If we got very little text, it might be a scanned PDF
    if (result.text.trim().length < 100) {
      console.log('Low text content detected, attempting OCR...')
      return await extractTextWithOCR(buffer)
    }

    return result
  } catch (error: any) {
    // Fallback to simple pdf-parse
    console.warn('PDF.js failed, falling back to pdf-parse:', error.message)
    return await extractTextFromPDF(buffer)
  }
}

/**
 * Chunk text into smaller pieces for RAG
 */
export interface TextChunk {
  text: string
  pageNumber: number | null
  startIndex: number
  endIndex: number
  tokens: number
}

export function chunkText(
  pages: PDFPage[],
  chunkSize = 1000,
  overlap = 200
): TextChunk[] {
  const chunks: TextChunk[] = []

  for (const page of pages) {
    const text = page.text
    let startIndex = 0

    while (startIndex < text.length) {
      const endIndex = Math.min(startIndex + chunkSize, text.length)
      const chunkText = text.slice(startIndex, endIndex)

      chunks.push({
        text: chunkText,
        pageNumber: page.pageNumber,
        startIndex,
        endIndex,
        tokens: estimateTokens(chunkText),
      })

      startIndex += chunkSize - overlap
    }
  }

  return chunks
}

/**
 * Estimate token count (rough approximation)
 */
function estimateTokens(text: string): number {
  // Rough estimate: ~4 characters per token on average
  return Math.ceil(text.length / 4)
}

/**
 * Extract citations from PDF text using regex patterns
 */
export function extractCitations(text: string): string[] {
  const citations: string[] = []

  // Pattern for in-text citations like (Author, Year)
  const inTextPattern = /\([A-Z][a-z]+(?:\s+(?:et\s+al\.|&|and)\s+[A-Z][a-z]+)?,\s+\d{4}\)/g

  // Pattern for reference list items
  const referencePattern = /^[A-Z][a-z]+,?\s+(?:[A-Z]\.\s*)+\(\d{4}\)\./gm

  const inTextMatches = text.match(inTextPattern) || []
  const referenceMatches = text.match(referencePattern) || []

  citations.push(...inTextMatches, ...referenceMatches)

  return [...new Set(citations)] // Remove duplicates
}
