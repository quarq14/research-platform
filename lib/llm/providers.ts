import Groq from 'groq-sdk'
import OpenAI from 'openai'
import axios from 'axios'

// ==============================================================================
// GROQ Provider (Default Free Provider)
// ==============================================================================
export class GroqProvider {
  private client: Groq

  constructor(apiKey?: string) {
    this.client = new Groq({
      apiKey: apiKey || process.env.GROQ_API_KEY || '',
    })
  }

  async chat(messages: any[], model = 'llama-3.3-70b-versatile', options: any = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        stream: options.stream ?? false,
      })

      return response
    } catch (error: any) {
      throw new Error(`Groq API error: ${error.message}`)
    }
  }

  async streamChat(messages: any[], model = 'llama-3.3-70b-versatile', options: any = {}) {
    const stream = await this.client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      stream: true,
    })

    return stream
  }
}

// ==============================================================================
// MINIMAX Provider (for interleaved thinking)
// ==============================================================================
export class MiniMaxProvider {
  private apiKey: string
  private baseUrl = 'https://api.minimax.chat/v1'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.MINIMAX_API_KEY || ''
  }

  async chat(messages: any[], model = 'minimax-m2', options: any = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/text/chatcompletion`,
        {
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 8000,
          stream: options.stream ?? false,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data
    } catch (error: any) {
      throw new Error(`MiniMax API error: ${error.response?.data?.message || error.message}`)
    }
  }

  async streamChat(messages: any[], model = 'minimax-m2', options: any = {}) {
    const response = await axios.post(
      `${this.baseUrl}/text/chatcompletion`,
      {
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 8000,
        stream: true,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    )

    return response.data
  }
}

// ==============================================================================
// OPENROUTER Provider (user-supplied keys)
// ==============================================================================
export class OpenRouterProvider {
  private apiKey: string
  private baseUrl = 'https://openrouter.ai/api/v1'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.OPENROUTER_API_KEY || ''
  }

  async chat(messages: any[], model = 'meta-llama/llama-3.1-70b-instruct', options: any = {}) {
    try {
      const response = await axios.post(
        `${this.baseUrl}/chat/completions`,
        {
          model,
          messages,
          temperature: options.temperature ?? 0.7,
          max_tokens: options.maxTokens ?? 4000,
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
          },
        }
      )

      return response.data
    } catch (error: any) {
      throw new Error(`OpenRouter API error: ${error.response?.data?.error?.message || error.message}`)
    }
  }
}

// ==============================================================================
// OPENAI Provider (optional, user-supplied keys)
// ==============================================================================
export class OpenAIProvider {
  private client: OpenAI

  constructor(apiKey?: string) {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || '',
    })
  }

  async chat(messages: any[], model = 'gpt-4o-mini', options: any = {}) {
    try {
      const response = await this.client.chat.completions.create({
        model,
        messages,
        temperature: options.temperature ?? 0.7,
        max_tokens: options.maxTokens ?? 4000,
        stream: options.stream ?? false,
      })

      return response
    } catch (error: any) {
      throw new Error(`OpenAI API error: ${error.message}`)
    }
  }

  async streamChat(messages: any[], model = 'gpt-4o-mini', options: any = {}) {
    const stream = await this.client.chat.completions.create({
      model,
      messages,
      temperature: options.temperature ?? 0.7,
      max_tokens: options.maxTokens ?? 4000,
      stream: true,
    })

    return stream
  }

  async createEmbedding(text: string, model = 'text-embedding-3-small') {
    try {
      const response = await this.client.embeddings.create({
        model,
        input: text,
      })

      return response.data[0].embedding
    } catch (error: any) {
      throw new Error(`OpenAI embeddings error: ${error.message}`)
    }
  }
}

// ==============================================================================
// Provider Factory
// ==============================================================================
export function createProvider(providerName: string, apiKey?: string) {
  switch (providerName.toLowerCase()) {
    case 'groq':
      return new GroqProvider(apiKey)
    case 'minimax':
      return new MiniMaxProvider(apiKey)
    case 'openrouter':
      return new OpenRouterProvider(apiKey)
    case 'openai':
      return new OpenAIProvider(apiKey)
    default:
      return new GroqProvider(apiKey) // Default to Groq
  }
}
