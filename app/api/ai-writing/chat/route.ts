/**
 * API Route: AI Writing Assistant Chat
 * Streaming chat endpoint for real-time AI assistance with PDF context
 */

import { NextRequest } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import Groq from 'groq-sdk';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

interface ChatRequest {
  messages: ChatMessage[];
  selectedPDFs?: string[];
  model?: string;
  language?: 'tr' | 'en';
}

export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();

    if (!supabase) {
      return new Response('Database connection failed', { status: 500 });
    }

    // Verify authentication
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const body: ChatRequest = await req.json();
    const {
      messages,
      selectedPDFs = [],
      model = 'llama-3.3-70b-versatile',
      language = 'en',
    } = body;

    if (!messages || messages.length === 0) {
      return new Response('No messages provided', { status: 400 });
    }

    // Fetch PDF context if provided
    let contextText = '';
    if (selectedPDFs.length > 0) {
      const { data: pdfs } = await supabase
        .from('writing_pdfs')
        .select('title, author, text_content')
        .in('id', selectedPDFs)
        .eq('user_id', user.id);

      if (pdfs && pdfs.length > 0) {
        contextText = pdfs
          .map((pdf, index) => {
            const limitedContent = pdf.text_content?.substring(0, 2000) || '';
            return `Source ${index + 1}: ${pdf.title || 'Document'} by ${pdf.author || 'Unknown'}\n${limitedContent}`;
          })
          .join('\n\n---\n\n');
      }
    }

    // Build system message
    const systemMessage =
      language === 'tr'
        ? `Sen akademik yazım konusunda yardımcı olan bir AI asistansın. Kullanıcının akademik yazılarını geliştirmesine, kaynak kullanımına ve yapılandırmasına yardımcı ol.

${contextText ? `Mevcut PDF Kaynakları:\n${contextText}\n\nKullanıcı sorularını yanıtlarken bu kaynaklara atıfta bulunabilirsin.` : ''}

Görevin:
- Akademik yazım konusunda rehberlik et
- Kaynak kullanımı ve alıntılama konusunda önerilerde bulun
- Metin yapısını iyileştir
- Akademik dil kullanımına yardımcı ol
- Mantıklı ve yapıcı geri bildirim ver`
        : `You are an AI assistant specialized in academic writing. Help users improve their academic writing, source usage, and document structure.

${contextText ? `Available PDF Sources:\n${contextText}\n\nYou can reference these sources when answering user questions.` : ''}

Your tasks:
- Guide on academic writing best practices
- Suggest proper citation and referencing
- Help improve text structure
- Assist with academic language usage
- Provide logical and constructive feedback`;

    // Initialize Groq
    const groqApiKey = process.env.GROQ_API_KEY;
    if (!groqApiKey) {
      return new Response('Groq API key not configured', { status: 500 });
    }

    const groq = new Groq({ apiKey: groqApiKey });

    // Prepare messages with system context
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemMessage },
      ...messages,
    ];

    // Create streaming response
    const stream = await groq.chat.completions.create({
      messages: chatMessages as any,
      model: model,
      temperature: 0.7,
      max_tokens: 4000,
      top_p: 0.9,
      stream: true,
    });

    // Create ReadableStream for streaming response
    const encoder = new TextEncoder();
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              controller.enqueue(encoder.encode(content));
            }
          }
          controller.close();
        } catch (error) {
          console.error('[AI Chat] Streaming error:', error);
          controller.error(error);
        }
      },
    });

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });
  } catch (error) {
    console.error('[AI Chat] Error:', error);
    return new Response(
      `Error: ${error instanceof Error ? error.message : 'Unknown error'}`,
      { status: 500 }
    );
  }
}
