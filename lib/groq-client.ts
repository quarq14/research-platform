/**
 * Groq API Client - AI Asistan için
 * Ücretsiz Llama-3.1-8B-Instant modelini kullanır
 */

export interface GroqMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

export interface GroqChatCompletion {
  id: string
  object: string
  created: number
  model: string
  choices: {
    index: number
    message: {
      role: string
      content: string
    }
    finish_reason: string
  }[]
  usage: {
    prompt_tokens: number
    completion_tokens: number
    total_tokens: number
  }
}

export class GroqClient {
  private apiKey: string
  private baseUrl: string
  private model: string

  constructor() {
    this.apiKey = process.env.GROQ_API_KEY || ''
    this.baseUrl = process.env.GROQ_BASE_URL || 'https://api.groq.com'
    this.model = process.env.GROQ_MODEL || 'llama-3.1-8b-instant'
  }

  async chat(messages: GroqMessage[]): Promise<string> {
    if (!this.apiKey || this.apiKey === 'demo-key') {
      // Demo mode - Mock response
      return this.getDemoResponse(messages)
    }

    try {
      const response = await fetch(`${this.baseUrl}/openai/v1/chat/completions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: this.model,
          messages,
          temperature: 0.7,
          max_tokens: 1024,
        }),
      })

      if (!response.ok) {
        throw new Error(`Groq API error: ${response.status}`)
      }

      const data: GroqChatCompletion = await response.json()
      return data.choices[0]?.message?.content || 'Üzgünüm, bir yanıt alamadım.'
    } catch (error) {
      console.error('Groq API Error:', error)
      return this.getDemoResponse(messages)
    }
  }

  private getDemoResponse(messages: GroqMessage[]): string {
    const userMessage = messages.find(m => m.role === 'user')?.content || ''
    
    // Türkçe demo yanıtlar
    const demoResponses = [
      'Merhaba! Size nasıl yardımcı olabilirim?',
      'Bu konuda size detaylı bilgi verebilirim. Daha spesifik sorularınız var mı?',
      'Araştırma konusunda size destek olmaktan mutluluk duyarım.',
      'İstatistiksel analiz konusunda yardımcı olabilirim.',
      'Proje yönetimi konusunda tavsiyelerim bulunuyor.',
    ]

    // Basit keyword matching
    if (userMessage.toLowerCase().includes('merhaba') || userMessage.toLowerCase().includes('selam')) {
      return 'Merhaba! Ben AI araştırma asistanınızım. Size nasıl yardımcı olabilirim? Anket tasarımı, istatistiksel analiz veya rapor hazırlama konularında destek olabilirim.'
    }
    
    if (userMessage.toLowerCase().includes('anket') || userMessage.toLowerCase().includes('survey')) {
      return 'Anket tasarımı konusunda size yardımcı olabilirim! 5 farklı soru tipi mevcut: Çoktan seçmeli, Kısa metin, Uzun metin, Derecelendirme ve Evet/Hayır. Hangi tür anket tasarlamak istiyorsunuz?'
    }
    
    if (userMessage.toLowerCase().includes('istatistik') || userMessage.toLowerCase().includes('analiz')) {
      return 'İstatistiksel analiz konusunda kapsamlı destek sunuyorum! T-test, ANOVA, regresyon, lojistik regresyon, survival analizi gibi 15+ analiz türü mevcut. Hangi analizi yapmak istiyorsunuz?'
    }
    
    if (userMessage.toLowerCase().includes('rapor') || userMessage.toLowerCase().includes('report')) {
      return 'Otomatik rapor oluşturma konusunda size yardımcı olabilirim! Verilerinizi analiz edip detaylı raporlar hazırlayabilirim. Hangi konuda rapor oluşturmak istiyorsunuz?'
    }

    // Varsayılan yanıt
    const randomResponse = demoResponses[Math.floor(Math.random() * demoResponses.length)]
    return `${randomResponse} (Demo modu - Gerçek API key ile tam yanıtlar alabilirsiniz)`
  }
}

// Singleton instance
export const groqClient = new GroqClient()
