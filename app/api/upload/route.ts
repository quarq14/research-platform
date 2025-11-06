import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { processPDF, chunkText } from '@/lib/pdf/processor'
import { EmbeddingService } from '@/lib/embeddings/service'

export const runtime = 'nodejs'
export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database not configured' },
        { status: 500 }
      )
    }

    // Get authenticated user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Parse form data
    const formData = await request.formData()
    const file = formData.get('file') as File | null
    const documentTitle = formData.get('title') as string || 'Untitled Document'

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are supported' },
        { status: 400 }
      )
    }

    // Validate file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      return NextResponse.json(
        { error: 'File size exceeds 50MB limit' },
        { status: 400 }
      )
    }

    // Convert file to buffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Process PDF
    const pdfResult = await processPDF(buffer)

    // Create document record
    const { data: document, error: docError } = await supabase
      .from('documents')
      .insert({
        user_id: user.id,
        title: documentTitle,
        content: pdfResult.text,
        source_type: 'upload',
        metadata: {
          totalPages: pdfResult.metadata.totalPages,
          ocrApplied: pdfResult.ocrApplied,
        },
      })
      .select()
      .single()

    if (docError) {
      console.error('Document creation error:', docError)
      return NextResponse.json(
        { error: 'Failed to create document record' },
        { status: 500 }
      )
    }

    // Upload file to Supabase Storage
    const fileName = `${user.id}/${document.id}/${file.name}`
    const { error: uploadError } = await supabase.storage
      .from('documents')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
      })

    if (uploadError) {
      console.error('File upload error:', uploadError)
      // Don't fail the request, continue with processing
    }

    // Create file record
    const { data: fileRecord, error: fileError } = await supabase
      .from('files')
      .insert({
        document_id: document.id,
        storage_path: fileName,
        filename: file.name,
        mime_type: file.type,
        size_bytes: file.size,
        pages: pdfResult.metadata.totalPages,
        ocr_applied: pdfResult.ocrApplied,
      })
      .select()
      .single()

    if (fileError) {
      console.error('File record error:', fileError)
    }

    // Chunk the text
    const chunks = chunkText(pdfResult.pages, 1000, 200)

    // Create embeddings (using simple provider for now to avoid API costs)
    const embeddingService = new EmbeddingService('simple')

    // Insert chunks with embeddings
    const chunksToInsert = []
    for (let i = 0; i < Math.min(chunks.length, 100); i++) {
      // Limit to 100 chunks for free tier
      const chunk = chunks[i]
      const embedding = await embeddingService.embed(chunk.text)

      chunksToInsert.push({
        document_id: document.id,
        file_id: fileRecord?.id || null,
        page_number: chunk.pageNumber,
        content: chunk.text,
        tokens: chunk.tokens,
        embedding,
        metadata: {
          startIndex: chunk.startIndex,
          endIndex: chunk.endIndex,
        },
      })
    }

    if (chunksToInsert.length > 0) {
      const { error: chunksError } = await supabase
        .from('chunks')
        .insert(chunksToInsert)

      if (chunksError) {
        console.error('Chunks insertion error:', chunksError)
      }
    }

    // Track usage
    await supabase.from('usage_events').insert({
      user_id: user.id,
      event_type: 'page_processed',
      amount: pdfResult.metadata.totalPages,
      ref_id: document.id,
    })

    return NextResponse.json({
      success: true,
      document: {
        id: document.id,
        title: document.title,
        totalPages: pdfResult.metadata.totalPages,
        chunksCreated: chunksToInsert.length,
      },
    })
  } catch (error: any) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { error: error.message || 'Upload failed' },
      { status: 500 }
    )
  }
}
