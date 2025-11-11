// Unified AI Provider Interface
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface AICompletionParams {
  messages: AIMessage[]
  model?: string
  temperature?: number
  maxTokens?: number
  stream?: boolean
}

export interface AIProvider {
  name: string
  generateCompletion(params: AICompletionParams): Promise<string>
  streamCompletion(params: AICompletionParams): AsyncGenerator<string>
  isConfigured(): boolean
}

// Groq Provider (Free default)
export class GroqProvider implements AIProvider {
  name = 'groq'
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GROQ_API_KEY || null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async generateCompletion(params: AICompletionParams): Promise<string> {
    if (!this.apiKey) throw new Error('Groq API key not configured')

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'llama-3.1-70b-versatile',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async *streamCompletion(params: AICompletionParams): AsyncGenerator<string> {
    if (!this.apiKey) throw new Error('Groq API key not configured')

    const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'llama-3.1-70b-versatile',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) yield content
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// OpenAI Provider
export class OpenAIProvider implements AIProvider {
  name = 'openai'
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENAI_API_KEY || null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async generateCompletion(params: AICompletionParams): Promise<string> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'gpt-4o-mini',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async *streamCompletion(params: AICompletionParams): AsyncGenerator<string> {
    if (!this.apiKey) throw new Error('OpenAI API key not configured')

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'gpt-4o-mini',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) yield content
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// Claude Provider
export class ClaudeProvider implements AIProvider {
  name = 'claude'
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.ANTHROPIC_API_KEY || null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async generateCompletion(params: AICompletionParams): Promise<string> {
    if (!this.apiKey) throw new Error('Claude API key not configured')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'claude-3-5-sonnet-20241022',
        max_tokens: params.maxTokens || 2000,
        messages: params.messages.filter((m) => m.role !== 'system'),
        system: params.messages.find((m) => m.role === 'system')?.content,
      }),
    })

    if (!response.ok) {
      throw new Error(`Claude API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.content[0].text
  }

  async *streamCompletion(params: AICompletionParams): AsyncGenerator<string> {
    if (!this.apiKey) throw new Error('Claude API key not configured')

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'claude-3-5-sonnet-20241022',
        max_tokens: params.maxTokens || 2000,
        messages: params.messages.filter((m) => m.role !== 'system'),
        system: params.messages.find((m) => m.role === 'system')?.content,
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
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)

          try {
            const parsed = JSON.parse(data)
            if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
              yield parsed.delta.text
            }
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// Gemini Provider
export class GeminiProvider implements AIProvider {
  name = 'gemini'
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GOOGLE_API_KEY || null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async generateCompletion(params: AICompletionParams): Promise<string> {
    if (!this.apiKey) throw new Error('Gemini API key not configured')

    const model = params.model || 'gemini-2.0-flash-exp'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.apiKey}`

    const contents = params.messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: params.temperature || 0.7,
          maxOutputTokens: params.maxTokens || 2000,
        },
      }),
    })

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.candidates[0].content.parts[0].text
  }

  async *streamCompletion(params: AICompletionParams): AsyncGenerator<string> {
    if (!this.apiKey) throw new Error('Gemini API key not configured')

    const model = params.model || 'gemini-2.0-flash-exp'
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?key=${this.apiKey}`

    const contents = params.messages.map((msg) => ({
      role: msg.role === 'assistant' ? 'model' : 'user',
      parts: [{ text: msg.content }],
    }))

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents,
        generationConfig: {
          temperature: params.temperature || 0.7,
          maxOutputTokens: params.maxTokens || 2000,
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
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        try {
          const parsed = JSON.parse(line)
          const text = parsed.candidates?.[0]?.content?.parts?.[0]?.text
          if (text) yield text
        } catch (e) {
          // Skip invalid JSON
        }
      }
    }
  }
}

// OpenRouter Provider
export class OpenRouterProvider implements AIProvider {
  name = 'openrouter'
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async generateCompletion(params: AICompletionParams): Promise<string> {
    if (!this.apiKey) throw new Error('OpenRouter API key not configured')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: params.model || 'anthropic/claude-3.5-sonnet',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async *streamCompletion(params: AICompletionParams): AsyncGenerator<string> {
    if (!this.apiKey) throw new Error('OpenRouter API key not configured')

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: params.model || 'anthropic/claude-3.5-sonnet',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) yield content
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// MiniMax Provider
export class MiniMaxProvider implements AIProvider {
  name = 'minimax'
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MINIMAX_API_KEY || null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async generateCompletion(params: AICompletionParams): Promise<string> {
    if (!this.apiKey) throw new Error('MiniMax API key not configured')

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'abab6.5s-chat',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
      }),
    })

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async *streamCompletion(params: AICompletionParams): AsyncGenerator<string> {
    if (!this.apiKey) throw new Error('MiniMax API key not configured')

    const response = await fetch('https://api.minimax.chat/v1/text/chatcompletion_v2', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'abab6.5s-chat',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`MiniMax API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) yield content
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// Kimi Provider (Moonshot AI)
export class KimiProvider implements AIProvider {
  name = 'kimi'
  private apiKey: string | null

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.KIMI_API_KEY || process.env.MOONSHOT_API_KEY || null
  }

  isConfigured(): boolean {
    return this.apiKey !== null
  }

  async generateCompletion(params: AICompletionParams): Promise<string> {
    if (!this.apiKey) throw new Error('Kimi API key not configured')

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'moonshot-v1-8k',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
        stream: false,
      }),
    })

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.statusText}`)
    }

    const data = await response.json()
    return data.choices[0].message.content
  }

  async *streamCompletion(params: AICompletionParams): AsyncGenerator<string> {
    if (!this.apiKey) throw new Error('Kimi API key not configured')

    const response = await fetch('https://api.moonshot.cn/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: params.model || 'moonshot-v1-8k',
        messages: params.messages,
        temperature: params.temperature || 0.7,
        max_tokens: params.maxTokens || 2000,
        stream: true,
      }),
    })

    if (!response.ok) {
      throw new Error(`Kimi API error: ${response.statusText}`)
    }

    const reader = response.body?.getReader()
    if (!reader) throw new Error('No response body')

    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break

      const chunk = decoder.decode(value)
      const lines = chunk.split('\n').filter((line) => line.trim() !== '')

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6)
          if (data === '[DONE]') return

          try {
            const parsed = JSON.parse(data)
            const content = parsed.choices[0]?.delta?.content
            if (content) yield content
          } catch (e) {
            // Skip invalid JSON
          }
        }
      }
    }
  }
}

// Provider Factory
export function createAIProvider(providerName: string, apiKey?: string): AIProvider {
  switch (providerName.toLowerCase()) {
    case 'groq':
      return new GroqProvider(apiKey)
    case 'openai':
      return new OpenAIProvider(apiKey)
    case 'claude':
    case 'anthropic':
      return new ClaudeProvider(apiKey)
    case 'gemini':
    case 'google':
      return new GeminiProvider(apiKey)
    case 'openrouter':
      return new OpenRouterProvider(apiKey)
    case 'minimax':
      return new MiniMaxProvider(apiKey)
    case 'kimi':
    case 'moonshot':
      return new KimiProvider(apiKey)
    default:
      throw new Error(`Unknown AI provider: ${providerName}`)
  }
}

// Default provider (Groq - free)
export const defaultAIProvider = new GroqProvider()
