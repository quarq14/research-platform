/**
 * Unified AI Provider System
 * Supports multiple AI providers: Groq (free), OpenRouter, Claude, OpenAI, Gemini
 */

export type AIProvider = 'groq' | 'openrouter' | 'claude' | 'openai' | 'gemini' | 'kimi'

export interface AIConfig {
  provider: AIProvider
  apiKey?: string
  model?: string
}

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface StreamResponse {
  text: string
  done: boolean
}

/**
 * Default models for each provider
 */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  groq: 'llama-3.3-70b-versatile',
  openrouter: 'meta-llama/llama-3.3-70b-instruct',
  claude: 'claude-3-5-sonnet-20241022',
  openai: 'gpt-4o',
  gemini: 'gemini-2.0-flash-exp',
  kimi: 'moonshot-v1-8k',
}

/**
 * Provider display names
 */
export const PROVIDER_NAMES: Record<AIProvider, string> = {
  groq: 'Groq (Free)',
  openrouter: 'OpenRouter',
  claude: 'Claude (Anthropic)',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  kimi: 'Kimi (Moonshot AI)',
}

/**
 * Provider API endpoints
 */
const PROVIDER_ENDPOINTS: Record<AIProvider, string> = {
  groq: 'https://api.groq.com/openai/v1/chat/completions',
  openrouter: 'https://openrouter.ai/api/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  openai: 'https://api.openai.com/v1/chat/completions',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  kimi: 'https://api.moonshot.cn/v1/chat/completions',
}

/**
 * Get API key from environment or user config
 */
function getApiKey(provider: AIProvider, userKey?: string): string | null {
  if (userKey) return userKey

  // Fallback to environment variables
  const envKeys: Record<AIProvider, string | undefined> = {
    groq: process.env.API_KEY_GROQ_API_KEY || process.env.GROQ_API_KEY,
    openrouter: process.env.OPENROUTER_API_KEY,
    claude: process.env.ANTHROPIC_API_KEY,
    openai: process.env.OPENAI_API_KEY,
    gemini: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    kimi: process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY,
  }

  return envKeys[provider] || null
}

/**
 * Chat completion for OpenAI-compatible APIs (Groq, OpenRouter, OpenAI)
 */
async function chatOpenAICompatible(
  endpoint: string,
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens: number = 2000
) {
  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`API error: ${response.statusText} - ${error}`)
  }

  return response.json()
}

/**
 * Chat completion for Claude (Anthropic) API
 */
async function chatClaude(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens: number = 2000
) {
  // Extract system message
  const systemMessage = messages.find((m) => m.role === 'system')
  const conversationMessages = messages.filter((m) => m.role !== 'system')

  const response = await fetch(PROVIDER_ENDPOINTS.claude, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: maxTokens,
      temperature,
      system: systemMessage?.content || '',
      messages: conversationMessages,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Claude API error: ${response.statusText} - ${error}`)
  }

  const data = await response.json()
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: data.content[0].text,
        },
      },
    ],
  }
}

/**
 * Chat completion for Google Gemini API
 */
async function chatGemini(
  apiKey: string,
  model: string,
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens: number = 2000
) {
  // Convert messages to Gemini format
  const contents = messages
    .filter((m) => m.role !== 'system')
    .map((m) => ({
      role: m.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: m.content }],
    }))

  const systemInstruction = messages.find((m) => m.role === 'system')?.content

  const endpoint = `${PROVIDER_ENDPOINTS.gemini}/${model}:generateContent?key=${apiKey}`

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents,
      systemInstruction: systemInstruction
        ? {
            parts: [{ text: systemInstruction }],
          }
        : undefined,
      generationConfig: {
        temperature,
        maxOutputTokens: maxTokens,
      },
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    throw new Error(`Gemini API error: ${response.statusText} - ${error}`)
  }

  const data = await response.json()
  return {
    choices: [
      {
        message: {
          role: 'assistant',
          content: data.candidates[0].content.parts[0].text,
        },
      },
    ],
  }
}

/**
 * Main chat completion function that routes to the appropriate provider
 */
export async function chatCompletion(
  config: AIConfig,
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<string> {
  const apiKey = getApiKey(config.provider, config.apiKey)

  if (!apiKey) {
    throw new Error(
      `No API key configured for ${PROVIDER_NAMES[config.provider]}. Please add your API key in settings.`
    )
  }

  const model = config.model || DEFAULT_MODELS[config.provider]

  let data: any

  switch (config.provider) {
    case 'groq':
    case 'openrouter':
    case 'openai':
    case 'kimi':
      data = await chatOpenAICompatible(
        PROVIDER_ENDPOINTS[config.provider],
        apiKey,
        model,
        messages,
        temperature,
        maxTokens
      )
      break

    case 'claude':
      data = await chatClaude(apiKey, model, messages, temperature, maxTokens)
      break

    case 'gemini':
      data = await chatGemini(apiKey, model, messages, temperature, maxTokens)
      break

    default:
      throw new Error(`Unsupported provider: ${config.provider}`)
  }

  return data.choices[0]?.message?.content || 'No response generated'
}

/**
 * Stream chat completion (for real-time responses)
 */
export async function* streamChatCompletion(
  config: AIConfig,
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens: number = 2000
): AsyncGenerator<string> {
  const apiKey = getApiKey(config.provider, config.apiKey)

  if (!apiKey) {
    throw new Error(
      `No API key configured for ${PROVIDER_NAMES[config.provider]}. Please add your API key in settings.`
    )
  }

  const model = config.model || DEFAULT_MODELS[config.provider]

  // For OpenAI-compatible APIs (Groq, OpenRouter, OpenAI, Kimi)
  if (config.provider === 'groq' || config.provider === 'openrouter' || config.provider === 'openai' || config.provider === 'kimi') {
    const response = await fetch(PROVIDER_ENDPOINTS[config.provider], {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model,
        messages,
        temperature,
        max_tokens: maxTokens,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data: '))

      for (const line of lines) {
        const data = line.replace('data: ', '').trim()
        if (data === '[DONE]') return

        try {
          const json = JSON.parse(data)
          const content = json.choices[0]?.delta?.content
          if (content) yield content
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
  // For Claude
  else if (config.provider === 'claude') {
    const systemMessage = messages.find((m) => m.role === 'system')
    const conversationMessages = messages.filter((m) => m.role !== 'system')

    const response = await fetch(PROVIDER_ENDPOINTS.claude, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model,
        max_tokens: maxTokens,
        temperature,
        system: systemMessage?.content || '',
        messages: conversationMessages,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data: '))

      for (const line of lines) {
        const data = line.replace('data: ', '').trim()

        try {
          const json = JSON.parse(data)
          if (json.type === 'content_block_delta' && json.delta?.text) {
            yield json.delta.text
          }
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
  // For Gemini (streaming)
  else if (config.provider === 'gemini') {
    const contents = messages
      .filter((m) => m.role !== 'system')
      .map((m) => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))

    const systemInstruction = messages.find((m) => m.role === 'system')?.content

    const endpoint = `${PROVIDER_ENDPOINTS.gemini}/${model}:streamGenerateContent?key=${apiKey}&alt=sse`

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        systemInstruction: systemInstruction
          ? {
              parts: [{ text: systemInstruction }],
            }
          : undefined,
        generationConfig: {
          temperature,
          maxOutputTokens: maxTokens,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()

    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim().startsWith('data: '))

      for (const line of lines) {
        const data = line.replace('data: ', '').trim()

        try {
          const json = JSON.parse(data)
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

/**
 * Get user's AI preferences from database
 */
export async function getUserAIPreferences(userId: string, supabase: any): Promise<AIConfig> {
  const { data: settings } = await supabase
    .from('user_settings')
    .select('ai_provider, ai_model')
    .eq('user_id', userId)
    .single()

  return {
    provider: (settings?.ai_provider as AIProvider) || 'groq',
    model: settings?.ai_model,
  }
}

/**
 * Get user's API key for a provider
 */
export async function getUserAPIKey(
  userId: string,
  provider: AIProvider,
  supabase: any
): Promise<string | null> {
  const { data } = await supabase
    .from('api_keys')
    .select('encrypted_key')
    .eq('user_id', userId)
    .eq('provider', provider)
    .eq('is_active', true)
    .single()

  // In production, you should decrypt this
  return data?.encrypted_key || null
}
