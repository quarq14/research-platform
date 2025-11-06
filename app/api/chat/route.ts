import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { EmbeddingService } from '@/lib/embeddings/service'
import { GroqProvider } from '@/lib/llm/providers'

export const runtime = 'nodejs'
export const maxDuration = 60

interface Message {
  role: 'user' | 'assistant' | 'system'
  content: string
}

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

    // Parse request body
    const body = await request.json()
    const { messages, documentIds } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    const lastMessage = messages[messages.length - 1]
    if (!lastMessage || lastMessage.role !== 'user') {
      return NextResponse.json(
        { error: 'Last message must be from user' },
        { status: 400 }
      )
    }

    const query = lastMessage.content

    // Create embedding for the query
    const embeddingService = new EmbeddingService('simple')
    const queryEmbedding = await embeddingService.embed(query)

    // Search for relevant chunks using vector similarity
    let relevantChunks: any[] = []

    if (documentIds && documentIds.length > 0) {
      // Search within specific documents
      const { data: chunks, error: searchError } = await supabase.rpc(
        'search_chunks',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 10,
          user_uuid: user.id,
        }
      )

      if (!searchError && chunks) {
        relevantChunks = chunks.filter((chunk: any) =>
          documentIds.includes(chunk.document_id)
        )
      }
    } else {
      // Search across all user documents
      const { data: chunks, error: searchError } = await supabase.rpc(
        'search_chunks',
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 10,
          user_uuid: user.id,
        }
      )

      if (!searchError && chunks) {
        relevantChunks = chunks
      }
    }

    // Build context from relevant chunks
    const context = relevantChunks
      .map(
        (chunk, idx) =>
          `[Source ${idx + 1}, Page ${chunk.page_number || 'N/A'}]\n${chunk.content}`
      )
      .join('\n\n---\n\n')

    // Build system prompt
    const systemPrompt = `You are an academic research assistant. Answer the user's question based on the provided context from their uploaded documents.

IMPORTANT GUIDELINES:
1. Always cite your sources using [Source X, Page Y] format
2. If you're not sure about something, say so
3. Don't fabricate information
4. Be precise and academic in your responses
5. If the context doesn't contain relevant information, say that clearly

CONTEXT:
${context || 'No relevant context found in the uploaded documents.'}

If there is no relevant context, politely inform the user and suggest they might need to upload more documents or rephrase their question.`

    // Prepare messages for LLM
    const llmMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages.slice(0, -1), // Previous messages for context
      { role: 'user', content: query },
    ]

    // Get response from LLM (using Groq as default)
    const groqProvider = new GroqProvider()

    try {
      const completion = await groqProvider.chat(llmMessages, 'llama-3.3-70b-versatile', {
        temperature: 0.7,
        maxTokens: 2000,
      })

      const assistantMessage = completion.choices[0].message.content

      // Extract citations from the response
      const citationPattern = /\[Source (\d+), Page ([^\]]+)\]/g
      const citations: Array<{ sourceIndex: number; page: string }> = []
      let match

      while ((match = citationPattern.exec(assistantMessage || '')) !== null) {
        citations.push({
          sourceIndex: parseInt(match[1]) - 1,
          page: match[2],
        })
      }

      // Build citations metadata
      const citationsMetadata = citations.map((citation) => {
        const chunk = relevantChunks[citation.sourceIndex]
        return chunk
          ? {
              documentId: chunk.document_id,
              pageNumber: chunk.page_number,
              content: chunk.content.slice(0, 200),
            }
          : null
      }).filter(Boolean)

      // Track usage
      const tokensUsed = completion.usage?.total_tokens || 0
      await supabase.from('usage_events').insert({
        user_id: user.id,
        event_type: 'token_usage',
        amount: tokensUsed,
        metadata: { model: 'llama-3.3-70b-versatile' },
      })

      return NextResponse.json({
        message: assistantMessage,
        citations: citationsMetadata,
        tokensUsed,
        chunksRetrieved: relevantChunks.length,
      })
    } catch (llmError: any) {
      console.error('LLM error:', llmError)

      // Fallback response
      return NextResponse.json({
        message: `I apologize, but I encountered an error processing your request. Here's what I found in your documents:\n\n${
          relevantChunks.length > 0
            ? relevantChunks
                .slice(0, 3)
                .map(
                  (chunk, idx) =>
                    `[Source ${idx + 1}] ${chunk.content.slice(0, 200)}...`
                )
                .join('\n\n')
            : 'No relevant information found. Please try rephrasing your question or upload more documents.'
        }`,
        citations: [],
        tokensUsed: 0,
        chunksRetrieved: relevantChunks.length,
      })
    }
  } catch (error: any) {
    console.error('Chat error:', error)
    return NextResponse.json(
      { error: error.message || 'Chat failed' },
      { status: 500 }
    )
  }
}
