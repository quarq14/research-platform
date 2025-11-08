/**
 * API Route: Upload PDF for AI Writing
 * Handles PDF uploads, text extraction, and metadata storage
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { processPDF } from '@/lib/services/pdf-processor';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse form data
    const formData = await req.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file type
    if (file.type !== 'application/pdf') {
      return NextResponse.json(
        { error: 'Only PDF files are allowed' },
        { status: 400 }
      );
    }

    // Convert to buffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Process PDF
    const processingResult = await processPDF(buffer, {
      chunkSize: 1000,
      chunkOverlap: 200,
      preserveParagraphs: true,
    });

    // Generate unique file ID
    const fileId = crypto.randomUUID();

    // Upload PDF to Supabase Storage
    const fileName = `${user.id}/${fileId}/${file.name}`;
    const { error: uploadError } = await supabase.storage
      .from('research-pdfs')
      .upload(fileName, buffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[Upload PDF] Storage error:', uploadError);
      return NextResponse.json(
        { error: 'Failed to upload PDF' },
        { status: 500 }
      );
    }

    // Get public URL
    const {
      data: { publicUrl },
    } = supabase.storage.from('research-pdfs').getPublicUrl(fileName);

    // Store metadata in database
    const { data: pdfRecord, error: dbError } = await supabase
      .from('writing_pdfs')
      .insert({
        id: fileId,
        user_id: user.id,
        file_name: file.name,
        file_url: publicUrl,
        file_size: file.size,
        page_count: processingResult.metadata.pageCount,
        title: processingResult.metadata.title || file.name,
        author: processingResult.metadata.author,
        text_content: processingResult.text,
        metadata: {
          ...processingResult.metadata,
          chunks: processingResult.chunks.length,
        },
      })
      .select()
      .single();

    if (dbError) {
      console.error('[Upload PDF] Database error:', dbError);
      // Clean up uploaded file
      await supabase.storage.from('research-pdfs').remove([fileName]);
      return NextResponse.json(
        { error: 'Failed to save PDF metadata' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      pdf: {
        id: pdfRecord.id,
        fileName: pdfRecord.file_name,
        pageCount: pdfRecord.page_count,
        title: pdfRecord.title,
        author: pdfRecord.author,
        uploadedAt: pdfRecord.created_at,
      },
    });
  } catch (error) {
    console.error('[Upload PDF] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Get user's uploaded PDFs
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return NextResponse.json(
        { error: 'Database connection failed' },
        { status: 500 }
      );
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch user's PDFs
    const { data: pdfs, error: fetchError } = await supabase
      .from('writing_pdfs')
      .select('id, file_name, title, author, page_count, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (fetchError) {
      console.error('[Get PDFs] Error:', fetchError);
      return NextResponse.json(
        { error: 'Failed to fetch PDFs' },
        { status: 500 }
      );
    }

    return NextResponse.json({ pdfs: pdfs || [] });
  } catch (error) {
    console.error('[Get PDFs] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
