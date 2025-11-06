"use client"

import { useState, useEffect, useRef } from "react"
import { Send, File, Loader2, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { chatWithPDFAction } from "@/app/actions/chat-with-pdf"

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
  citations?: { page: number; text: string }[]
}

type FileData = {
  id: string
  original_name: string
  pages: number
}

export function ChatInterface({ userId, initialFiles }: { userId: string; initialFiles: FileData[] }) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedFileId, setSelectedFileId] = useState<string>(initialFiles[0]?.id || "")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  const sendMessage = async () => {
    if (!input.trim() || loading || !selectedFileId) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = input
    setInput("")
    setLoading(true)

    try {
      const result = await chatWithPDFAction({
        userId,
        fileId: selectedFileId,
        message: currentInput,
        chatHistory: messages,
      })

      if (!result.success) {
        throw new Error(result.error || "Chat error")
      }

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: result.response || "",
        citations: result.citations,
      }

      setMessages((prev) => [...prev, aiMessage])
    } catch (error: any) {
      console.error("[v0] Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${error.message}`,
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">PDF Chat</h1>
              <p className="text-sm text-gray-600 mt-1">{initialFiles.length} PDFs uploaded</p>
            </div>

            {initialFiles.length > 0 && (
              <select
                value={selectedFileId}
                onChange={(e) => setSelectedFileId(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              >
                {initialFiles.map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.original_name}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="mt-4 flex items-start gap-2 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <strong>NOTE:</strong> Using Groq AI for responses. PDF text extraction is handled server-side with full
              RAG pipeline.
            </div>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-4xl mx-auto space-y-4">
          {messages.length === 0 ? (
            <div className="text-center py-12">
              <File className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">Start Chatting</h3>
              <p className="text-gray-600">Ask questions about your PDF content</p>
            </div>
          ) : (
            messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-2xl rounded-2xl px-4 py-3 ${
                    msg.role === "user" ? "bg-blue-600 text-white" : "bg-white text-gray-900 shadow-sm"
                  }`}
                >
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  {msg.citations && msg.citations.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-200">
                      <p className="text-xs text-gray-500 mb-2">Sources:</p>
                      {msg.citations.map((citation, idx) => (
                        <div key={idx} className="text-xs text-gray-600 mb-1">
                          📄 Page {citation.page}
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
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
              placeholder="Ask a question..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              disabled={loading || initialFiles.length === 0}
            />
            <Button
              onClick={sendMessage}
              disabled={loading || !input.trim() || initialFiles.length === 0}
              className="px-6"
            >
              <Send className="w-5 h-5" />
            </Button>
          </div>
          {initialFiles.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">Upload a PDF first to start chatting</p>
          )}
        </div>
      </div>
    </>
  )
}
