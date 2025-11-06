import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import { supabase } from '@/lib/supabase'
import { chatWithContext, isGroqConfigured } from '@/services/groq'
import { Send, File, Loader2, AlertCircle } from 'lucide-react'

type Message = {
  id: string
  role: 'user' | 'assistant'
  content: string
  citations?: {page: number, text: string}[]
}

export default function ChatPage() {
  const { user } = useAuth()
  const { locale } = useLocale()
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [files, setFiles] = useState<any[]>([])
  const [selectedFileId, setSelectedFileId] = useState<string>('')
  const [chunks, setChunks] = useState<any[]>([])
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadUserFiles()
  }, [user])

  useEffect(() => {
    if (selectedFileId) {
      loadFileChunks(selectedFileId)
    }
  }, [selectedFileId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadUserFiles = async () => {
    if (!user) return
    
    const { data } = await supabase
      .from('files')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed')
      .order('created_at', { ascending: false })
    
    if (data && data.length > 0) {
      setFiles(data)
      setSelectedFileId(data[0].id)
    }
  }

  const loadFileChunks = async (fileId: string) => {
    const { data } = await supabase
      .from('chunks')
      .select('*')
      .eq('file_id', fileId)
      .order('chunk_index', { ascending: true })
    
    if (data) {
      setChunks(data)
    }
  }

  const sendMessage = async () => {
    if (!input.trim() || loading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input
    }

    setMessages(prev => [...prev, userMessage])
    setInput('')
    setLoading(true)

    try {
      // Get relevant chunks (simple: take first 5 chunks as context)
      const relevantChunks = chunks.slice(0, 5)
      const context = relevantChunks
        .map(c => `[Page ${c.page_number}] ${c.content}`)
        .join('\n\n')

      // Call Groq API with context
      const chatMessages = messages.map(m => ({
        role: m.role as 'user' | 'assistant',
        content: m.content
      }))

      chatMessages.push({
        role: 'user',
        content: input
      })

      const response = await chatWithContext(chatMessages, context)

      // Extract page numbers mentioned in response
      const pageMatches = response.match(/\[Page (\d+)\]/g) || []
      const citations = pageMatches.map(match => {
        const pageNum = parseInt(match.match(/\d+/)![0])
        const chunk = relevantChunks.find(c => c.page_number === pageNum)
        return {
          page: pageNum,
          text: chunk?.content.slice(0, 100) || ''
        }
      })

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        citations: citations.length > 0 ? citations : undefined
      }

      setMessages(prev => [...prev, aiMessage])

      // Save to database
      if (selectedFileId) {
        const file = files.find(f => f.id === selectedFileId)
        
        // Create chat session if needed
        const { data: chatData } = await supabase
          .from('chats')
          .select('id')
          .eq('user_id', user!.id)
          .eq('document_id', file?.document_id)
          .maybeSingle()

        let chatId = chatData?.id

        if (!chatId) {
          const { data: newChat } = await supabase
            .from('chats')
            .insert({
              user_id: user!.id,
              document_id: file?.document_id,
              title: input.slice(0, 100)
            })
            .select()
            .maybeSingle()
          
          chatId = newChat?.id
        }

        if (chatId) {
          await supabase.from('messages').insert([
            {
              chat_id: chatId,
              role: 'user',
              content: input
            },
            {
              chat_id: chatId,
              role: 'assistant',
              content: response,
              citations: citations
            }
          ])
        }
      }
    } catch (error: any) {
      console.error('Chat error:', error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: locale === 'tr' 
          ? `Hata: ${error.message}. Lütfen Groq API key'ini kontrol edin.`
          : `Error: ${error.message}. Please check your Groq API key.`
      }
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  const apiConfigured = isGroqConfigured()

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {locale === 'tr' ? 'PDF Sohbet' : 'PDF Chat'}
              </h1>
              <p className="text-sm text-gray-600 mt-1">
                {locale === 'tr' 
                  ? `${files.length} PDF yüklendi` 
                  : `${files.length} PDFs uploaded`}
              </p>
            </div>
            
            {files.length > 0 && (
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {files.map(f => (
                  <option key={f.id} value={f.id}>{f.original_name}</option>
                ))}
              </select>
            )}
          </div>

          {!apiConfigured && (
            <div className="mt-4 flex items-start gap-2 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <strong>{locale === 'tr' ? 'DEMO MOD:' : 'DEMO MODE:'}</strong>{' '}
                {locale === 'tr' 
                  ? 'Groq API key yapılandırılmamış. Sınırlı yanıtlar gösterilecek.' 
                  : 'Groq API key not configured. Limited responses will be shown.'}
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {locale === 'tr' ? 'Sohbete Başlayın' : 'Start Chatting'}
              </h3>
              <p className="text-gray-600">
                {locale === 'tr' 
                  ? 'PDF içeriğiniz hakkında sorular sorun' 
                  : 'Ask questions about your PDF content'}
              </p>
            </div>
          ) : (
            messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-900 shadow-sm'
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">
                        {locale === 'tr' ? 'Kaynaklar:' : 'Sources:'}
                      </p>
                      {msg.citations.map((citation, idx) => (
                        <div key={idx} className="text-xs text-gray-600 mb-1">
                          📄 {locale === 'tr' ? 'Sayfa' : 'Page'} {citation.page}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-white rounded-2xl px-4 py-3 shadow-sm">
                <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t px-4 py-4">
        <div className="max-w-4xl mx-auto">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder={locale === 'tr' ? 'Bir soru sorun...' : 'Ask a question...'}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || files.length === 0}
            />
            <button
              onClick={sendMessage}
              disabled={loading || !input.trim() || files.length === 0}
              className="px-6 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
          {files.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">
              {locale === 'tr' 
                ? 'Sohbet etmek için önce PDF yükleyin' 
                : 'Upload PDFs first to start chatting'}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}
