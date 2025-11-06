import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createProvider } from '@/lib/llm/providers'

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
    const { messages, context } = body

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Invalid messages format' },
        { status: 400 }
      )
    }

    // Get user's profile to check their selected provider
    const { data: profile } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    // Get user's API keys
    const { data: apiKeys } = await supabase
      .from('api_keys')
      .select('*, api_providers(*)')
      .eq('user_id', user.id)
      .eq('is_active', true)

    // Determine which provider to use
    let providerName = 'groq' // Default to free Groq
    let apiKey: string | undefined
    let model: string | undefined

    // Check if user has a preferred chatbot provider
    const preferredProvider = profile?.chatbot_provider

    if (preferredProvider && apiKeys) {
      const userKey = apiKeys.find(
        (k: any) => k.api_providers.name === preferredProvider
      )

      if (userKey) {
        providerName = preferredProvider
        apiKey = userKey.encrypted_key // In production, decrypt this
        model = profile?.chatbot_model
      }
    }

    // Create context-aware system prompt
    const systemPrompt = `You are an AI assistant for the Academic Research Platform. You help users with academic writing, research, citations, and using the platform features.

Current context: ${context?.page || 'Dashboard'}
${context?.additionalInfo || ''}

Your capabilities:
- Help with academic writing and research
- Guide users through the platform features
- Answer questions about citations, plagiarism detection, and AI tools
- Provide tips for effective academic research

Available platform features:
- Upload PDFs: Users can upload academic papers and chat with them
- Scholarly Search: Search Semantic Scholar, OpenAlex, and Crossref for papers
- Citation Manager: Generate citations in APA, MLA, Chicago, IEEE, Harvard
- Writing Tools: Plagiarism checking, AI detection, paraphrasing
- Chat with PDFs: RAG-based Q&A with uploaded documents

Be helpful, professional, and concise. If you're not sure about something, say so.`

    // Build complete messages
    const completeMessages: Message[] = [
      { role: 'system', content: systemPrompt },
      ...messages,
    ]

    // Create provider instance
    const provider = createProvider(providerName, apiKey)

    try {
      const response = await provider.chat(completeMessages, model, {
        temperature: 0.7,
        maxTokens: 2000,
      })

      const assistantMessage = response.choices[0].message.content

      // Track usage
      const tokensUsed = response.usage?.total_tokens || 0
      await supabase.from('usage_events').insert({
        user_id: user.id,
        event_type: 'token_usage',
        amount: tokensUsed,
        metadata: {
          provider: providerName,
          model: model || 'default',
          context: 'chatbot',
        },
      })

      return NextResponse.json({
        message: assistantMessage,
        provider: providerName,
        tokensUsed,
      })
    } catch (llmError: any) {
      console.error('LLM error:', llmError)

      // Fallback to Groq if user's provider fails
      if (providerName !== 'groq') {
        try {
          const groqProvider = createProvider('groq')
          const fallbackResponse = await groqProvider.chat(completeMessages, undefined, {
            temperature: 0.7,
            maxTokens: 2000,
          })

          const assistantMessage = fallbackResponse.choices[0].message.content

          return NextResponse.json({
            message: assistantMessage,
            provider: 'groq (fallback)',
            tokensUsed: fallbackResponse.usage?.total_tokens || 0,
          })
        } catch (fallbackError) {
          return NextResponse.json(
            { error: 'Failed to generate response' },
            { status: 500 }
          )
        }
      }

      return NextResponse.json(
        { error: llmError.message || 'Failed to generate response' },
        { status: 500 }
      )
    }
  } catch (error: any) {
    console.error('Chatbot error:', error)
    return NextResponse.json(
      { error: error.message || 'Chatbot failed' },
      { status: 500 }
    )
  }
}
