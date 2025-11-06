// Groq AI Service for RAG Chat
import Groq from 'groq-sdk'

const groqApiKey = import.meta.env.VITE_GROQ_API_KEY

let groq: Groq | null = null

if (groqApiKey) {
  groq = new Groq({
    apiKey: groqApiKey,
    dangerouslyAllowBrowser: true // For client-side usage
  })
}

export type ChatMessage = {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export async function chatWithContext(
  messages: ChatMessage[],
  context?: string
): Promise<string> {
  if (!groq) {
    // Fallback to mock response if no API key
    return `[DEMO MODE - API key gerekli] ${messages[messages.length - 1].content} hakkında bilgi: Bu bir demo yanıtıdır. Gerçek AI yanıtları için GROQ_API_KEY gereklidir.`
  }

  try {
    const systemMessage: ChatMessage = {
      role: 'system',
      content: context
        ? `Sen bir akademik araştırma asistanısın. Aşağıdaki bağlamı kullanarak soruları yanıtla:\n\n${context}`
        : 'Sen bir akademik araştırma ve yazma asistanısın.'
    }

    const completion = await groq.chat.completions.create({
      messages: [systemMessage, ...messages],
      model: 'llama-3.1-70b-versatile',
      temperature: 0.7,
      max_tokens: 2048,
      top_p: 1,
      stream: false
    })

    return completion.choices[0]?.message?.content || 'Yanıt oluşturulamadı.'
  } catch (error: any) {
    console.error('Groq API error:', error)
    throw new Error(`AI yanıt hatası: ${error.message}`)
  }
}

export async function generateEmbedding(text: string): Promise<number[]> {
  // Groq doesn't provide embeddings directly
  // For production, use OpenAI embeddings or similar
  // For now, return mock embedding
  return Array(1536).fill(0).map(() => Math.random())
}

export function isGroqConfigured(): boolean {
  return !!groq
}
