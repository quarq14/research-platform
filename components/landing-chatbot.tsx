"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Lightbulb, Code, Search, BookOpen, Copy, Check, Moon, Sun, Trash2, Send } from "lucide-react"
import { useTheme } from "next-themes"
import { cn } from "@/lib/utils"

interface Message {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

const suggestions = [
  {
    text: "Help me understand research methodology for my thesis",
    icon: BookOpen,
  },
  {
    text: "What are the best practices for academic citations?",
    icon: Lightbulb,
  },
  {
    text: "Find recent papers on machine learning in healthcare",
    icon: Search,
  },
  {
    text: "Write a literature review outline for my research",
    icon: Code,
  },
]

export function LandingChatbot() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const chatContainerRef = useRef<HTMLDivElement>(null)
  const { theme, setTheme } = useTheme()
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  }, [])

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [messages])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      role: "user",
      content: input.trim(),
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch("/api/chatbot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...messages, userMessage].map(m => ({
            role: m.role,
            content: m.content,
          })),
          context: {
            page: "landing",
            additionalInfo: "Landing page conversation",
          },
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to get response")
      }

      const data = await response.json()

      const assistantMessage: Message = {
        role: "assistant",
        content: data.message || "I apologize, but I couldn't generate a response.",
        timestamp: new Date(),
      }

      setMessages((prev) => [...prev, assistantMessage])
    } catch (error) {
      console.error("Chat error:", error)
      const errorMessage: Message = {
        role: "assistant",
        content: "I'm sorry, I encountered an error. Please try again.",
        timestamp: new Date(),
      }
      setMessages((prev) => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (text: string) => {
    setInput(text)
  }

  const copyMessage = (index: number, text: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  const clearChat = () => {
    setMessages([])
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)] max-w-5xl mx-auto">
      {/* Header - only show when no messages */}
      {messages.length === 0 && (
        <div className="flex-shrink-0 px-4 pt-12 pb-8">
          <h1 className="text-4xl md:text-5xl font-semibold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Welcome to Academic AI
          </h1>
          <p className="text-xl md:text-2xl text-muted-foreground">
            How can I help you today?
          </p>

          {/* Suggestions */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-8">
            {suggestions.map((suggestion, index) => {
              const Icon = suggestion.icon
              return (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion.text)}
                  className="flex flex-col items-start p-4 rounded-xl bg-secondary hover:bg-secondary/80 transition-colors text-left group"
                >
                  <p className="text-sm font-medium mb-3">{suggestion.text}</p>
                  <div className="self-end mt-auto">
                    <div className="w-10 h-10 rounded-full bg-background flex items-center justify-center group-hover:scale-110 transition-transform">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}

      {/* Chat Messages */}
      {messages.length > 0 && (
        <div
          ref={chatContainerRef}
          className="flex-1 overflow-y-auto px-4 py-8 space-y-6"
        >
          {messages.map((message, index) => (
            <div
              key={index}
              className={cn(
                "flex gap-4 items-start",
                message.role === "user" ? "justify-end" : "justify-start"
              )}
            >
              {message.role === "assistant" && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                  <BookOpen className="w-5 h-5 text-white" />
                </div>
              )}

              <div
                className={cn(
                  "flex flex-col gap-2 max-w-[80%]",
                  message.role === "user" && "items-end"
                )}
              >
                <div
                  className={cn(
                    "rounded-2xl px-4 py-3",
                    message.role === "user"
                      ? "bg-blue-600 text-white"
                      : "bg-secondary text-foreground"
                  )}
                >
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>

                {message.role === "assistant" && (
                  <button
                    onClick={() => copyMessage(index, message.content)}
                    className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors px-2"
                  >
                    {copiedIndex === index ? (
                      <>
                        <Check className="w-3 h-3" />
                        Copied
                      </>
                    ) : (
                      <>
                        <Copy className="w-3 h-3" />
                        Copy
                      </>
                    )}
                  </button>
                )}
              </div>

              {message.role === "user" && (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center flex-shrink-0">
                  <span className="text-white font-medium">U</span>
                </div>
              )}
            </div>
          ))}

          {isLoading && (
            <div className="flex gap-4 items-start">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                <BookOpen className="w-5 h-5 text-white" />
              </div>
              <div className="flex flex-col gap-2 max-w-[80%]">
                <div className="rounded-2xl px-4 py-3 bg-secondary">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                    <div className="w-2 h-2 rounded-full bg-muted-foreground/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Input Area */}
      <div className="flex-shrink-0 border-t bg-background/80 backdrop-blur-sm">
        <div className="px-4 py-4">
          <form onSubmit={handleSubmit} className="flex gap-2">
            <div className="relative flex-1">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me anything about academic research..."
                className="w-full px-4 py-3 pr-12 rounded-full bg-secondary border-0 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                disabled={isLoading}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed hover:bg-blue-700 transition-colors"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>

            <div className="flex gap-2">
              {mounted && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                >
                  {theme === "dark" ? (
                    <Sun className="w-5 h-5" />
                  ) : (
                    <Moon className="w-5 h-5" />
                  )}
                </Button>
              )}

              {messages.length > 0 && (
                <Button
                  type="button"
                  size="icon"
                  variant="outline"
                  className="rounded-full"
                  onClick={clearChat}
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
            </div>
          </form>

          <p className="text-xs text-center text-muted-foreground mt-3">
            AI may display inaccurate information. Please verify important facts.
          </p>
        </div>
      </div>
    </div>
  )
}
