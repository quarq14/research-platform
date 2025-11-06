import OpenAI from 'openai'
import axios from 'axios'

// ==============================================================================
// Embedding Service Interface
// ==============================================================================
export interface EmbeddingProvider {
  createEmbedding(text: string): Promise<number[]>
  createBatchEmbeddings(texts: string[]): Promise<number[][]>
  getDimension(): number
}

// ==============================================================================
// OpenAI Embeddings Provider
// ==============================================================================
export class OpenAIEmbeddingsProvider implements EmbeddingProvider {
  private client: OpenAI
  private model: string
  private dimension: number

  constructor(apiKey?: string, model = 'text-embedding-3-small') {
    this.client = new OpenAI({
      apiKey: apiKey || process.env.OPENAI_API_KEY || '',
    })
    this.model = model
    this.dimension = model === 'text-embedding-3-small' ? 1536 : 1536
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: text,
      })

      return response.data[0].embedding
    } catch (error: any) {
      throw new Error(`OpenAI embedding error: ${error.message}`)
    }
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await this.client.embeddings.create({
        model: this.model,
        input: texts,
      })

      return response.data.map((item) => item.embedding)
    } catch (error: any) {
      throw new Error(`OpenAI batch embedding error: ${error.message}`)
    }
  }

  getDimension(): number {
    return this.dimension
  }
}

// ==============================================================================
// Nomic Embeddings Provider (free alternative)
// ==============================================================================
export class NomicEmbeddingsProvider implements EmbeddingProvider {
  private apiKey: string
  private baseUrl = 'https://api-atlas.nomic.ai/v1'
  private dimension = 768

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.NOMIC_API_KEY || ''
  }

  async createEmbedding(text: string): Promise<number[]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/embedding/text`,
        {
          texts: [text],
          model: 'nomic-embed-text-v1.5',
          task_type: 'search_document',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      // Nomic returns 768-dim embeddings, pad to 1536 for compatibility
      const embedding = response.data.embeddings[0]
      return this.padEmbedding(embedding)
    } catch (error: any) {
      throw new Error(`Nomic embedding error: ${error.response?.data?.detail || error.message}`)
    }
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    try {
      const response = await axios.post(
        `${this.baseUrl}/embedding/text`,
        {
          texts,
          model: 'nomic-embed-text-v1.5',
          task_type: 'search_document',
        },
        {
          headers: {
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
          },
        }
      )

      return response.data.embeddings.map((emb: number[]) => this.padEmbedding(emb))
    } catch (error: any) {
      throw new Error(`Nomic batch embedding error: ${error.response?.data?.detail || error.message}`)
    }
  }

  private padEmbedding(embedding: number[]): number[] {
    // Pad 768-dim to 1536-dim with zeros for compatibility
    const padded = [...embedding]
    while (padded.length < 1536) {
      padded.push(0)
    }
    return padded
  }

  getDimension(): number {
    return this.dimension
  }
}

// ==============================================================================
// Free Local Embeddings Provider (using transformers.js in future)
// For now, this is a placeholder that uses a simple hashing approach
// ==============================================================================
export class SimpleEmbeddingsProvider implements EmbeddingProvider {
  private dimension = 1536

  async createEmbedding(text: string): Promise<number[]> {
    // Simple hash-based embedding (NOT for production, just fallback)
    return this.hashToEmbedding(text)
  }

  async createBatchEmbeddings(texts: string[]): Promise<number[][]> {
    return texts.map((text) => this.hashToEmbedding(text))
  }

  private hashToEmbedding(text: string): number[] {
    const embedding = new Array(this.dimension).fill(0)

    // Simple hash function
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i)
      const index = (charCode * (i + 1)) % this.dimension
      embedding[index] += charCode / 1000
    }

    // Normalize
    const magnitude = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0))
    return embedding.map((val) => val / (magnitude || 1))
  }

  getDimension(): number {
    return this.dimension
  }
}

// ==============================================================================
// Embedding Service Factory
// ==============================================================================
export class EmbeddingService {
  private provider: EmbeddingProvider

  constructor(providerName?: string, apiKey?: string) {
    const provider = providerName || 'simple'

    switch (provider.toLowerCase()) {
      case 'openai':
        this.provider = new OpenAIEmbeddingsProvider(apiKey)
        break
      case 'nomic':
        this.provider = new NomicEmbeddingsProvider(apiKey)
        break
      case 'simple':
      default:
        this.provider = new SimpleEmbeddingsProvider()
        break
    }
  }

  async embed(text: string): Promise<number[]> {
    return this.provider.createEmbedding(text)
  }

  async embedBatch(texts: string[]): Promise<number[][]> {
    return this.provider.createBatchEmbeddings(texts)
  }

  getDimension(): number {
    return this.provider.getDimension()
  }
}

// ==============================================================================
// Default export
// ==============================================================================
export const embeddingService = new EmbeddingService()
