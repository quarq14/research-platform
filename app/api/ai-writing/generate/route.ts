/**
 * API Route: AI Writing Generation
 * Generates academic content using Groq AI with citations from uploaded PDFs
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';
import { CitationFormatter, type CitationStyle } from '@/lib/services/citations';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60; // 60 seconds for AI generation

interface GenerationRequest {
  topic: string;
  wordCount: number;
  language: 'tr' | 'en';
  citationStyle: CitationStyle;
  selectedPDFs: string[]; // PDF IDs
  model?: string;
  instructions?: string;
  documentType?: 'article' | 'review' | 'essay' | 'thesis';
}

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

    const body: GenerationRequest = await req.json();
    const {
      topic,
      wordCount,
      language,
      citationStyle,
      selectedPDFs,
      model = 'llama-3.3-70b-versatile',
      instructions = '',
      documentType = 'article',
    } = body;

    // Validate input
    if (!topic || !wordCount || !language || !citationStyle) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!selectedPDFs || selectedPDFs.length === 0) {
      return NextResponse.json(
        { error: 'Please select at least one PDF source' },
        { status: 400 }
      );
    }

    // Fetch selected PDFs content
    const { data: pdfs, error: pdfError } = await supabase
      .from('writing_pdfs')
      .select('id, file_name, title, author, text_content')
      .in('id', selectedPDFs)
      .eq('user_id', user.id);

    if (pdfError || !pdfs || pdfs.length === 0) {
      return NextResponse.json(
        { error: 'Failed to fetch PDF sources' },
        { status: 400 }
      );
    }

    // Initialize Groq
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return NextResponse.json(
        { error: 'Groq API key not configured' },
        { status: 500 }
      );
    }

    const groq = new Groq({ apiKey: groqApiKey });

    // Prepare sources context
    const sourcesContext = pdfs
      .map((pdf, index) => {
        const limitedContent = pdf.text_content?.substring(0, 3000) || '';
        return `
### Source ${index + 1}: ${pdf.title || pdf.file_name}
**Author:** ${pdf.author || 'Unknown'}
**Content Extract:**
${limitedContent}
---
`;
      })
      .join('\n');

    // Create citations map
    const citationFormatter = new CitationFormatter(citationStyle);
    const citationsMap = pdfs.map((pdf, index) => ({
      id: index + 1,
      title: pdf.title || pdf.file_name,
      author: pdf.author || 'Unknown',
      citation: `[${index + 1}]`,
    }));

    // Build system prompt based on language
    const systemPrompt =
      language === 'tr'
        ? `Sen akademik yazım konusunda uzman bir asistansın. Sana verilen PDF kaynaklarından YALNIZCA doğru alıntılar yaparak akademik içerik üreteceksin.

ÖNEMLİ KURALLAR:
1. SADECE verilen PDF kaynaklarından bilgi kullan
2. Her bilgi için MUTLAKA kaynak göster: [1], [2], vb.
3. Alıntılama stili: ${citationStyle.toUpperCase()}
4. Kaynak olmayan bilgi EKLEME
5. ${wordCount} kelime civarında yaz
6. Akademik dil ve format kullan
7. Doğru paragraf yapısı oluştur
8. Nesnel ve bilimsel bir üslup kullan

Belge türü: ${documentType}
${instructions ? `Ek talimatlar: ${instructions}` : ''}`
        : `You are an expert academic writing assistant. You will generate academic content using ONLY accurate citations from the provided PDF sources.

IMPORTANT RULES:
1. Use information ONLY from the provided PDF sources
2. ALWAYS cite sources using: [1], [2], etc.
3. Citation style: ${citationStyle.toUpperCase()}
4. DO NOT add information without citations
5. Write approximately ${wordCount} words
6. Use academic language and format
7. Create proper paragraph structure
8. Use objective and scientific tone

Document type: ${documentType}
${instructions ? `Additional instructions: ${instructions}` : ''}`;

    const userPrompt =
      language === 'tr'
        ? `Konu: ${topic}

Kaynak Belgeler:
${sourcesContext}

Lütfen yukarıdaki kaynaklardan bilgi kullanarak "${topic}" konusunda akademik bir metin yaz. Her bilgi için mutlaka kaynak belirt.

Metin sonunda kaynakça bölümü ekle (${citationStyle.toUpperCase()} formatında).`
        : `Topic: ${topic}

Source Documents:
${sourcesContext}

Please write an academic text about "${topic}" using information from the sources above. Always cite your sources.

Include a reference section at the end (${citationStyle.toUpperCase()} format).`;

    // Generate content with Groq
    const completion = await groq.chat.completions.create({
      messages: [
        {
          role: 'system',
          content: systemPrompt,
        },
        {
          role: 'user',
          content: userPrompt,
        },
      ],
      model: model,
      temperature: 0.7,
      max_tokens: Math.min(8000, wordCount * 5),
      top_p: 0.9,
    });

    const generatedText = completion.choices[0]?.message?.content || '';

    if (!generatedText) {
      return NextResponse.json(
        { error: 'Failed to generate content' },
        { status: 500 }
      );
    }

    // Generate bibliography
    const bibliography = citationsMap
      .map(
        (cite) =>
          `[${cite.id}] ${cite.author}. "${cite.title}". (PDF Document).`
      )
      .join('\n');

    // Prepare response
    const response = {
      success: true,
      content: generatedText,
      bibliography: bibliography,
      metadata: {
        topic,
        wordCount: generatedText.split(/\s+/).length,
        language,
        citationStyle,
        sourcesUsed: pdfs.length,
        model: model,
        generatedAt: new Date().toISOString(),
      },
      sources: citationsMap,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('[AI Writing] Generation error:', error);
    return NextResponse.json(
      {
        error: 'Failed to generate content',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}
