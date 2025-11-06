import Groq from 'groq-sdk'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
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
// CLAUDE (Anthropic) Provider
// ==============================================================================
export class ClaudeProvider {
  private client: Anthropic

  constructor(apiKey?: string) {
    this.client = new Anthropic({
      apiKey: apiKey || process.env.ANTHROPIC_API_KEY || '',
    })
  }

  async chat(messages: any[], model = 'claude-3-5-sonnet-20241022', options: any = {}) {
    try {
      // Extract system message if present
      const systemMessage = messages.find((m: any) => m.role === 'system')?.content || ''
      const chatMessages = messages.filter((m: any) => m.role !== 'system')

      const response = await this.client.messages.create({
        model,
        max_tokens: options.maxTokens ?? 4000,
        temperature: options.temperature ?? 0.7,
        system: systemMessage,
        messages: chatMessages,
      })

      // Convert to OpenAI-compatible format
      return {
        choices: [{
          message: {
            role: 'assistant',
            content: response.content[0].type === 'text' ? response.content[0].text : '',
          },
        }],
        usage: {
          prompt_tokens: response.usage.input_tokens,
          completion_tokens: response.usage.output_tokens,
          total_tokens: response.usage.input_tokens + response.usage.output_tokens,
        },
      }
    } catch (error: any) {
      throw new Error(`Claude API error: ${error.message}`)
    }
  }

  async streamChat(messages: any[], model = 'claude-3-5-sonnet-20241022', options: any = {}) {
    try {
      const systemMessage = messages.find((m: any) => m.role === 'system')?.content || ''
      const chatMessages = messages.filter((m: any) => m.role !== 'system')

      const stream = await this.client.messages.create({
        model,
        max_tokens: options.maxTokens ?? 4000,
        temperature: options.temperature ?? 0.7,
        system: systemMessage,
        messages: chatMessages,
        stream: true,
      })

      return stream
    } catch (error: any) {
      throw new Error(`Claude stream error: ${error.message}`)
    }
  }
}

// ==============================================================================
// GEMINI (Google) Provider
// ==============================================================================
export class GeminiProvider {
  private apiKey: string
  private baseUrl = 'https://generativelanguage.googleapis.com/v1beta'

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.GEMINI_API_KEY || ''
  }

  async chat(messages: any[], model = 'gemini-1.5-pro', options: any = {}) {
    try {
      // Convert messages to Gemini format
      const contents = messages
        .filter((m: any) => m.role !== 'system')
        .map((m: any) => ({
          role: m.role === 'assistant' ? 'model' : 'user',
          parts: [{ text: m.content }],
        }))

      const systemMessage = messages.find((m: any) => m.role === 'system')?.content

      const response = await axios.post(
        `${this.baseUrl}/models/${model}:generateContent?key=${this.apiKey}`,
        {
          contents,
          systemInstruction: systemMessage ? { parts: [{ text: systemMessage }] } : undefined,
          generationConfig: {
            temperature: options.temperature ?? 0.7,
            maxOutputTokens: options.maxTokens ?? 4000,
          },
        },
        {
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      // Convert to OpenAI-compatible format
      const text = response.data.candidates?.[0]?.content?.parts?.[0]?.text || ''

      return {
        choices: [{
          message: {
            role: 'assistant',
            content: text,
          },
        }],
        usage: {
          prompt_tokens: response.data.usageMetadata?.promptTokenCount || 0,
          completion_tokens: response.data.usageMetadata?.candidatesTokenCount || 0,
          total_tokens: response.data.usageMetadata?.totalTokenCount || 0,
        },
      }
    } catch (error: any) {
      throw new Error(`Gemini API error: ${error.response?.data?.error?.message || error.message}`)
    }
  }

  async streamChat(messages: any[], model = 'gemini-1.5-pro', options: any = {}) {
    // Gemini streaming would require SSE handling
    // For now, fall back to non-streaming
    return this.chat(messages, model, options)
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
    case 'claude':
    case 'anthropic':
      return new ClaudeProvider(apiKey)
    case 'gemini':
    case 'google':
      return new GeminiProvider(apiKey)
    default:
      return new GroqProvider(apiKey) // Default to Groq
  }
}

// Available models per provider
export const PROVIDER_MODELS = {
  groq: [
    { id: 'llama-3.3-70b-versatile', name: 'Llama 3.3 70B' },
    { id: 'mixtral-8x7b-32768', name: 'Mixtral 8x7B' },
    { id: 'llama-3.1-70b-versatile', name: 'Llama 3.1 70B' },
  ],
  openai: [
    { id: 'gpt-4o', name: 'GPT-4O' },
    { id: 'gpt-4o-mini', name: 'GPT-4O Mini' },
    { id: 'gpt-4-turbo', name: 'GPT-4 Turbo' },
    { id: 'gpt-3.5-turbo', name: 'GPT-3.5 Turbo' },
  ],
  claude: [
    { id: 'claude-3-5-sonnet-20241022', name: 'Claude 3.5 Sonnet' },
    { id: 'claude-3-opus-20240229', name: 'Claude 3 Opus' },
    { id: 'claude-3-sonnet-20240229', name: 'Claude 3 Sonnet' },
    { id: 'claude-3-haiku-20240307', name: 'Claude 3 Haiku' },
  ],
  gemini: [
    { id: 'gemini-1.5-pro', name: 'Gemini 1.5 Pro' },
    { id: 'gemini-1.5-flash', name: 'Gemini 1.5 Flash' },
    { id: 'gemini-pro', name: 'Gemini Pro' },
  ],
  openrouter: [
    { id: 'anthropic/claude-3.5-sonnet', name: 'Claude 3.5 Sonnet (OpenRouter)' },
    { id: 'openai/gpt-4-turbo', name: 'GPT-4 Turbo (OpenRouter)' },
    { id: 'meta-llama/llama-3.1-70b-instruct', name: 'Llama 3.1 70B (OpenRouter)' },
  ],
}
