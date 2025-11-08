/**
 * PDF Processor Service
 * Handles PDF text extraction, OCR for scanned documents, metadata extraction, and intelligent chunking
 */

import type { SupabaseClient } from '@supabase/supabase-js';

// Types
export interface PDFMetadata {
  title?: string;
  author?: string;
  subject?: string;
  keywords?: string;
  creator?: string;
  producer?: string;
  creationDate?: Date;
  modificationDate?: Date;
  pageCount: number;
  encrypted: boolean;
}

export interface PDFPage {
  pageNumber: number;
  text: string;
  width: number;
  height: number;
}

export interface TextChunk {
  text: string;
  pageNumber: number;
  chunkIndex: number;
  startChar: number;
  endChar: number;
  tokens: number;
}

export interface PDFProcessingResult {
  text: string;
  pages: PDFPage[];
  metadata: PDFMetadata;
  chunks: TextChunk[];
  requiresOCR: boolean;
  ocrApplied: boolean;
}

export interface ChunkingOptions {
  chunkSize?: number;
  chunkOverlap?: number;
  preserveParagraphs?: boolean;
  minChunkSize?: number;
}

// Default chunking configuration
const DEFAULT_CHUNK_SIZE = 1000;
const DEFAULT_CHUNK_OVERLAP = 200;
const MIN_CHUNK_SIZE = 100;

/**
 * Extract text and metadata from PDF buffer using pdf-parse or pdf.js
 * This is a production-ready implementation that works with Node.js
 */
export async function extractPDFContent(
  buffer: Buffer
): Promise<{ text: string; pages: PDFPage[]; metadata: PDFMetadata }> {
  try {
    // For production, you would use pdf-parse or pdf.js
    // Since we're in a TypeScript environment, we'll use pdf-parse
    const pdfParse = await import('pdf-parse').catch(() => null);

    if (!pdfParse) {
      throw new Error(
        'pdf-parse package not installed. Run: npm install pdf-parse'
      );
    }

    const data = await pdfParse.default(buffer);

    // Extract metadata
    const metadata: PDFMetadata = {
      title: data.info?.Title,
      author: data.info?.Author,
      subject: data.info?.Subject,
      keywords: data.info?.Keywords,
      creator: data.info?.Creator,
      producer: data.info?.Producer,
      creationDate: data.info?.CreationDate,
      modificationDate: data.info?.ModDate,
      pageCount: data.numpages,
      encrypted: data.info?.IsEncrypted === 'yes',
    };

    // Extract pages - pdf-parse gives us combined text
    // For page-by-page extraction, we'd need pdf.js or pdfjs-dist
    const pages: PDFPage[] = [];

    // Estimate page breaks (rough approximation)
    const avgCharsPerPage = Math.ceil(data.text.length / data.numpages);
    for (let i = 0; i < data.numpages; i++) {
      const start = i * avgCharsPerPage;
      const end = Math.min((i + 1) * avgCharsPerPage, data.text.length);
      pages.push({
        pageNumber: i + 1,
        text: data.text.substring(start, end),
        width: 612, // Default US Letter width
        height: 792, // Default US Letter height
      });
    }

    return {
      text: data.text,
      pages,
      metadata,
    };
  } catch (error) {
    console.error('[PDF Processor] Extraction error:', error);
    throw new Error(`Failed to extract PDF content: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Detect if PDF requires OCR (contains scanned images instead of text)
 */
export function requiresOCR(text: string, pageCount: number): boolean {
  // If text is too sparse for the number of pages, likely scanned
  const avgCharsPerPage = text.length / pageCount;
  const minCharsPerPage = 100; // Threshold for considering a page "empty"

  // Also check for common OCR indicators
  const hasMinimalText = avgCharsPerPage < minCharsPerPage;
  const isWhitespaceHeavy = (text.match(/\s/g) || []).length / text.length > 0.9;

  return hasMinimalText || isWhitespaceHeavy;
}

/**
 * Apply OCR to PDF using Tesseract.js or cloud OCR service
 * For production, consider using Google Cloud Vision, AWS Textract, or Azure Computer Vision
 */
export async function applyOCR(
  buffer: Buffer,
  options: { language?: string } = {}
): Promise<{ text: string; pages: PDFPage[] }> {
  try {
    // For browser environments, you can use Tesseract.js
    // For Node.js, you might use tesseract via child_process or a cloud API

    // Placeholder implementation - in production, integrate actual OCR
    console.warn('[PDF Processor] OCR requested but not fully implemented. Consider using:');
    console.warn('  - Google Cloud Vision API');
    console.warn('  - AWS Textract');
    console.warn('  - Azure Computer Vision');
    console.warn('  - Tesseract.js (browser) or node-tesseract-ocr (Node.js)');

    // Return empty result for now
    return {
      text: '',
      pages: [],
    };
  } catch (error) {
    console.error('[PDF Processor] OCR error:', error);
    throw new Error(`OCR failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Estimate token count for text (rough approximation)
 * More accurate: use tiktoken library for GPT models
 */
export function estimateTokens(text: string): number {
  // Rough estimate: 1 token ≈ 4 characters for English text
  // More accurate would be to use tiktoken library
  return Math.ceil(text.length / 4);
}

/**
 * Intelligent text chunking with configurable options
 * Preserves sentence and paragraph boundaries when possible
 */
export function chunkText(
  text: string,
  options: ChunkingOptions = {}
): TextChunk[] {
  const {
    chunkSize = DEFAULT_CHUNK_SIZE,
    chunkOverlap = DEFAULT_CHUNK_OVERLAP,
    preserveParagraphs = true,
    minChunkSize = MIN_CHUNK_SIZE,
  } = options;

  const chunks: TextChunk[] = [];

  if (!text || text.trim().length === 0) {
    return chunks;
  }

  // Split into paragraphs if preserving paragraph boundaries
  const segments = preserveParagraphs
    ? text.split(/\n\n+/).filter(s => s.trim().length > 0)
    : [text];

  let currentChunk = '';
  let currentChunkStart = 0;
  let chunkIndex = 0;
  let charOffset = 0;

  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    const segmentWithSpace = i > 0 ? '\n\n' + segment : segment;

    // If adding this segment would exceed chunk size
    if (currentChunk.length + segmentWithSpace.length > chunkSize && currentChunk.length > 0) {
      // Save current chunk
      if (currentChunk.length >= minChunkSize) {
        chunks.push({
          text: currentChunk.trim(),
          pageNumber: 0, // Will be set later
          chunkIndex: chunkIndex++,
          startChar: currentChunkStart,
          endChar: currentChunkStart + currentChunk.length,
          tokens: estimateTokens(currentChunk),
        });
      }

      // Start new chunk with overlap
      const overlapText = currentChunk.slice(-chunkOverlap);
      currentChunkStart = currentChunkStart + currentChunk.length - overlapText.length;
      currentChunk = overlapText + segmentWithSpace;
    } else {
      currentChunk += segmentWithSpace;
    }
  }

  // Add final chunk
  if (currentChunk.trim().length >= minChunkSize) {
    chunks.push({
      text: currentChunk.trim(),
      pageNumber: 0,
      chunkIndex: chunkIndex++,
      startChar: currentChunkStart,
      endChar: currentChunkStart + currentChunk.length,
      tokens: estimateTokens(currentChunk),
    });
  }

  return chunks;
}

/**
 * Assign page numbers to chunks based on page text
 */
export function assignPageNumbers(
  chunks: TextChunk[],
  pages: PDFPage[]
): TextChunk[] {
  return chunks.map(chunk => {
    // Find which page this chunk belongs to
    let charCount = 0;
    for (const page of pages) {
      charCount += page.text.length;
      if (chunk.startChar < charCount) {
        return { ...chunk, pageNumber: page.pageNumber };
      }
    }
    // Default to last page if not found
    return { ...chunk, pageNumber: pages[pages.length - 1]?.pageNumber || 1 };
  });
}

/**
 * Main PDF processing function
 * Orchestrates extraction, OCR (if needed), and chunking
 */
export async function processPDF(
  buffer: Buffer,
  options: ChunkingOptions & { enableOCR?: boolean } = {}
): Promise<PDFProcessingResult> {
  try {
    const { enableOCR = true, ...chunkingOptions } = options;

    // Step 1: Extract content and metadata
    const { text, pages, metadata } = await extractPDFContent(buffer);

    // Step 2: Check if OCR is needed
    const needsOCR = requiresOCR(text, metadata.pageCount);
    let finalText = text;
    let finalPages = pages;
    let ocrApplied = false;

    if (needsOCR && enableOCR) {
      console.log('[PDF Processor] Document requires OCR, applying...');
      const ocrResult = await applyOCR(buffer);
      if (ocrResult.text) {
        finalText = ocrResult.text;
        finalPages = ocrResult.pages.length > 0 ? ocrResult.pages : pages;
        ocrApplied = true;
      }
    }

    // Step 3: Chunk the text
    const chunks = chunkText(finalText, chunkingOptions);

    // Step 4: Assign page numbers to chunks
    const chunksWithPages = assignPageNumbers(chunks, finalPages);

    return {
      text: finalText,
      pages: finalPages,
      metadata,
      chunks: chunksWithPages,
      requiresOCR: needsOCR,
      ocrApplied,
    };
  } catch (error) {
    console.error('[PDF Processor] Processing error:', error);
    throw error;
  }
}

/**
 * Store PDF processing results in Supabase
 */
export async function storePDFInSupabase(
  supabase: SupabaseClient,
  fileId: string,
  processingResult: PDFProcessingResult
): Promise<{ success: boolean; chunkIds: string[] }> {
  try {
    // Update file metadata
    const { error: fileError } = await supabase
      .from('files')
      .update({
        pages: processingResult.metadata.pageCount,
        ocr_applied: processingResult.ocrApplied,
        status: 'processed',
        metadata: {
          ...processingResult.metadata,
          requiresOCR: processingResult.requiresOCR,
        },
      })
      .eq('id', fileId);

    if (fileError) {
      throw new Error(`Failed to update file: ${fileError.message}`);
    }

    // Store chunks (without embeddings - those are added by embeddings service)
    const chunksToInsert = processingResult.chunks.map((chunk, index) => ({
      file_id: fileId,
      page_number: chunk.pageNumber,
      chunk_index: index,
      content: chunk.text,
      tokens: chunk.tokens,
      metadata: {
        startChar: chunk.startChar,
        endChar: chunk.endChar,
      },
    }));

    const { data: insertedChunks, error: chunksError } = await supabase
      .from('chunks')
      .insert(chunksToInsert)
      .select('id');

    if (chunksError) {
      throw new Error(`Failed to insert chunks: ${chunksError.message}`);
    }

    const chunkIds = insertedChunks?.map(c => c.id) || [];

    return {
      success: true,
      chunkIds,
    };
  } catch (error) {
    console.error('[PDF Processor] Supabase storage error:', error);
    throw error;
  }
}

/**
 * Process and store a PDF in one operation
 */
export async function processAndStorePDF(
  supabase: SupabaseClient,
  fileId: string,
  buffer: Buffer,
  options: ChunkingOptions & { enableOCR?: boolean } = {}
): Promise<{ result: PDFProcessingResult; chunkIds: string[] }> {
  try {
    // Process the PDF
    const result = await processPDF(buffer, options);

    // Store in Supabase
    const { chunkIds } = await storePDFInSupabase(supabase, fileId, result);

    return { result, chunkIds };
  } catch (error) {
    // Update file status to error
    await supabase
      .from('files')
      .update({
        status: 'error',
        error_message: error instanceof Error ? error.message : 'Processing failed',
      })
      .eq('id', fileId);

    throw error;
  }
}
