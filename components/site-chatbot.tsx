"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { MessageCircle, X, Send, Sparkles, Bot } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

export function SiteChatbot() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/site-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [...messages, userMessage] }),
      })

      if (!response.ok) throw new Error("Failed to get response")

      const data = await response.json()
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.message,
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("[v0] Chat error:", error)
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I encountered an error. Please try again.",
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-16 w-16 rounded-full shadow-2xl z-50 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 hover:from-blue-700 hover:via-purple-700 hover:to-pink-700 transition-all duration-300 hover:scale-110 group"
          size="icon"
        >
          <MessageCircle className="h-7 w-7 group-hover:scale-110 transition-transform" />
          <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-[420px] h-[600px] flex flex-col shadow-2xl z-50 border-2 border-purple-200 dark:border-purple-800 overflow-hidden animate-in slide-in-from-bottom-4 duration-300">
          {/* Header with gradient */}
          <div className="flex items-center justify-between p-5 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 text-white">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Bot className="h-6 w-6" />
                <Sparkles className="h-3 w-3 absolute -top-1 -right-1 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-lg">AI Assistant</h3>
                <p className="text-xs text-white/80">Powered by Multi-AI</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="hover:bg-white/20 text-white"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages area with custom scrollbar */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 dark:from-gray-900 dark:via-blue-950 dark:to-purple-950">
            {messages.length === 0 && (
              <div className="text-center mt-16 space-y-4">
                <div className="inline-flex p-4 bg-gradient-to-br from-blue-100 to-purple-100 dark:from-blue-900 dark:to-purple-900 rounded-full">
                  <Bot className="h-12 w-12 text-purple-600 dark:text-purple-400" />
                </div>
                <div>
                  <p className="text-lg font-semibold text-gray-700 dark:text-gray-300">
                    Hi! I'm your AI assistant 👋
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Ask me anything about the platform!
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("How do I upload a PDF?")}
                    className="text-xs"
                  >
                    📄 Upload PDF
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("What features are available?")}
                    className="text-xs"
                  >
                    ✨ Features
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInput("How do I change my AI provider?")}
                    className="text-xs"
                  >
                    🤖 AI Settings
                  </Button>
                </div>
              </div>
            )}
            {messages.map((message, index) => (
              <div
                key={message.id}
                className={`flex ${message.role === "user" ? "justify-end" : "justify-start"} animate-in slide-in-from-bottom-2 duration-300`}
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-md ${
                    message.role === "user"
                      ? "bg-gradient-to-r from-blue-600 to-purple-600 text-white"
                      : "bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  <div className="flex items-start gap-2">
                    {message.role === "assistant" && (
                      <Bot className="h-4 w-4 mt-1 flex-shrink-0 text-purple-600 dark:text-purple-400" />
                    )}
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
                  </div>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start animate-in slide-in-from-bottom-2 duration-300">
                <div className="bg-white dark:bg-gray-800 rounded-2xl px-4 py-3 shadow-md border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <Bot className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce" />
                      <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce [animation-delay:0.15s]" />
                      <div className="w-2 h-2 bg-purple-600 dark:bg-purple-400 rounded-full animate-bounce [animation-delay:0.3s]" />
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input area */}
          <form onSubmit={handleSubmit} className="p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 rounded-full px-4 border-2 border-purple-200 dark:border-purple-800 focus:border-purple-500 dark:focus:border-purple-500"
              />
              <Button
                type="submit"
                size="icon"
                disabled={isLoading || !input.trim()}
                className="rounded-full h-10 w-10 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
              >
                <Send className="h-4 w-4" />
              </Button>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
              Powered by your selected AI provider
            </p>
          </form>
        </Card>
      )}
    </>
  )
}
