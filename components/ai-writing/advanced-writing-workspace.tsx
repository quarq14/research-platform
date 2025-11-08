"use client"

import { useState, useRef, useEffect } from "react"
import {
  FileText, Upload, Trash2, BookOpen, Send, Loader2,
  Download, Save, Bot, Settings, Sparkles, FileCheck,
  MessageSquare, X, Check, AlertCircle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from "@/components/ui/resizable"

interface PDF {
  id: string
  file_name: string
  title: string
  author: string | null
  page_count: number
  created_at: string
}

interface ChatMessage {
  role: "user" | "assistant"
  content: string
  timestamp: Date
}

interface AIWritingWorkspaceProps {
  userId: string
}

export function AIWritingWorkspace({ userId }: AIWritingWorkspaceProps) {
  // State management
  const [pdfs, setPdfs] = useState<PDF[]>([])
  const [selectedPDFs, setSelectedPDFs] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState(false)
  const [generating, setGenerating] = useState(false)

  // Writing parameters
  const [topic, setTopic] = useState("")
  const [wordCount, setWordCount] = useState(1000)
  const [language, setLanguage] = useState<"tr" | "en">("en")
  const [citationStyle, setCitationStyle] = useState<"apa" | "mla" | "chicago" | "ieee">("apa")
  const [documentType, setDocumentType] = useState<"article" | "review" | "essay" | "thesis">("article")
  const [instructions, setInstructions] = useState("")
  const [aiModel, setAIModel] = useState("llama-3.3-70b-versatile")

  // Generated content
  const [generatedContent, setGeneratedContent] = useState("")
  const [bibliography, setBibliography] = useState("")

  // Chat
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])
  const [chatInput, setChatInput] = useState("")
  const [chatLoading, setChatLoading] = useState(false)
  const [showChat, setShowChat] = useState(true)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const chatScrollRef = useRef<HTMLDivElement>(null)

  // Load PDFs on mount
  useEffect(() => {
    loadPDFs()
  }, [])

  // Auto-scroll chat
  useEffect(() => {
    if (chatScrollRef.current) {
      chatScrollRef.current.scrollTop = chatScrollRef.current.scrollHeight
    }
  }, [chatMessages])

  const loadPDFs = async () => {
    try {
      const response = await fetch("/api/ai-writing/upload-pdf")
      if (response.ok) {
        const data = await response.json()
        setPdfs(data.pdfs || [])
      }
    } catch (error) {
      console.error("Failed to load PDFs:", error)
      toast.error("Failed to load PDF library")
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files || files.length === 0) return

    setUploading(true)
    let successCount = 0

    try {
      for (const file of Array.from(files)) {
        const formData = new FormData()
        formData.append("file", file)

        const response = await fetch("/api/ai-writing/upload-pdf", {
          method: "POST",
          body: formData,
        })

        if (response.ok) {
          successCount++
        } else {
          const error = await response.json()
          toast.error(`Failed to upload ${file.name}: ${error.error}`)
        }
      }

      if (successCount > 0) {
        toast.success(`Successfully uploaded ${successCount} PDF${successCount > 1 ? "s" : ""}`)
        await loadPDFs()
      }
    } catch (error) {
      toast.error("Upload failed")
    } finally {
      setUploading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const togglePDFSelection = (pdfId: string) => {
    const newSelection = new Set(selectedPDFs)
    if (newSelection.has(pdfId)) {
      newSelection.delete(pdfId)
    } else {
      newSelection.add(pdfId)
    }
    setSelectedPDFs(newSelection)
  }

  const handleGenerate = async () => {
    if (!topic.trim()) {
      toast.error(language === "tr" ? "Lütfen bir konu girin" : "Please enter a topic")
      return
    }

    if (selectedPDFs.size === 0) {
      toast.error(
        language === "tr"
          ? "Lütfen en az bir PDF kaynağı seçin"
          : "Please select at least one PDF source"
      )
      return
    }

    setGenerating(true)
    setGeneratedContent("")
    setBibliography("")

    try {
      const response = await fetch("/api/ai-writing/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic,
          wordCount,
          language,
          citationStyle,
          selectedPDFs: Array.from(selectedPDFs),
          model: aiModel,
          instructions,
          documentType,
        }),
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Generation failed")
      }

      const data = await response.json()
      setGeneratedContent(data.content)
      setBibliography(data.bibliography)

      toast.success(
        language === "tr"
          ? `${data.metadata.wordCount} kelime oluşturuldu!`
          : `${data.metadata.wordCount} words generated!`
      )
    } catch (error) {
      console.error("Generation error:", error)
      toast.error(
        language === "tr"
          ? "İçerik oluşturulamadı"
          : "Failed to generate content"
      )
    } finally {
      setGenerating(false)
    }
  }

  const handleSendMessage = async () => {
    if (!chatInput.trim()) return

    const userMessage: ChatMessage = {
      role: "user",
      content: chatInput,
      timestamp: new Date(),
    }

    setChatMessages((prev) => [...prev, userMessage])
    setChatInput("")
    setChatLoading(true)

    try {
      const response = await fetch("/api/ai-writing/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [...chatMessages, userMessage].map(m => ({
            role: m.role,
            content: m.content
          })),
          selectedPDFs: Array.from(selectedPDFs),
          model: aiModel,
          language,
        }),
      })

      if (!response.ok) {
        throw new Error("Chat request failed")
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      let assistantMessage = ""

      if (reader) {
        while (true) {
          const { done, value } = await reader.read()
          if (done) break

          const chunk = decoder.decode(value, { stream: true })
          assistantMessage += chunk

          // Update the last message
          setChatMessages((prev) => {
            const newMessages = [...prev]
            const lastMessage = newMessages[newMessages.length - 1]

            if (lastMessage?.role === "assistant") {
              lastMessage.content = assistantMessage
            } else {
              newMessages.push({
                role: "assistant",
                content: assistantMessage,
                timestamp: new Date(),
              })
            }

            return newMessages
          })
        }
      }
    } catch (error) {
      console.error("Chat error:", error)
      toast.error("Failed to send message")
    } finally {
      setChatLoading(false)
    }
  }

  const wordCountInContent = generatedContent.split(/\s+/).filter(Boolean).length

  return (
    <div className="h-[calc(100vh-8rem)]">
      <ResizablePanelGroup direction="horizontal" className="h-full rounded-lg border">
        {/* Main Content Area */}
        <ResizablePanel defaultSize={showChat ? 70 : 100} minSize={50}>
          <div className="h-full flex flex-col">
            <div className="p-6 border-b bg-gradient-to-r from-blue-50 to-purple-50">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <Sparkles className="w-6 h-6 text-purple-600" />
                    AI Academic Writing
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Generate academic content with proper citations from your PDF library
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowChat(!showChat)}
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {showChat ? "Hide" : "Show"} AI Assistant
                </Button>
              </div>
            </div>

            <Tabs defaultValue="setup" className="flex-1 flex flex-col">
              <TabsList className="mx-6 mt-4 w-fit">
                <TabsTrigger value="setup">Setup</TabsTrigger>
                <TabsTrigger value="library">PDF Library ({pdfs.length})</TabsTrigger>
                <TabsTrigger value="content">Generated Content</TabsTrigger>
              </TabsList>

              {/* Setup Tab */}
              <TabsContent value="setup" className="flex-1 overflow-auto px-6 pb-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Writing Parameters</CardTitle>
                    <CardDescription>
                      Configure your academic writing requirements
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="topic">Topic / Research Question</Label>
                        <Textarea
                          id="topic"
                          placeholder="Enter your research topic or question..."
                          value={topic}
                          onChange={(e) => setTopic(e.target.value)}
                          rows={3}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="instructions">Additional Instructions (Optional)</Label>
                        <Textarea
                          id="instructions"
                          placeholder="Any specific requirements or focus areas..."
                          value={instructions}
                          onChange={(e) => setInstructions(e.target.value)}
                          rows={3}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="wordCount">Word Count</Label>
                        <Input
                          id="wordCount"
                          type="number"
                          min={100}
                          max={10000}
                          value={wordCount}
                          onChange={(e) => setWordCount(parseInt(e.target.value) || 1000)}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="language">Language</Label>
                        <Select value={language} onValueChange={(v) => setLanguage(v as "tr" | "en")}>
                          <SelectTrigger id="language">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="en">English</SelectItem>
                            <SelectItem value="tr">Türkçe</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="citationStyle">Citation Style</Label>
                        <Select value={citationStyle} onValueChange={(v) => setCitationStyle(v as any)}>
                          <SelectTrigger id="citationStyle">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="apa">APA</SelectItem>
                            <SelectItem value="mla">MLA</SelectItem>
                            <SelectItem value="chicago">Chicago</SelectItem>
                            <SelectItem value="ieee">IEEE</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="documentType">Document Type</Label>
                        <Select value={documentType} onValueChange={(v) => setDocumentType(v as any)}>
                          <SelectTrigger id="documentType">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="article">Article</SelectItem>
                            <SelectItem value="review">Literature Review</SelectItem>
                            <SelectItem value="essay">Essay</SelectItem>
                            <SelectItem value="thesis">Thesis</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="aiModel">AI Model</Label>
                      <Select value={aiModel} onValueChange={setAIModel}>
                        <SelectTrigger id="aiModel">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="llama-3.3-70b-versatile">
                            Llama 3.3 70B (Recommended - Free)
                          </SelectItem>
                          <SelectItem value="llama-3.1-70b-versatile">
                            Llama 3.1 70B (Free)
                          </SelectItem>
                          <SelectItem value="mixtral-8x7b-32768">
                            Mixtral 8x7B (Free)
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Selected Sources ({selectedPDFs.size})</Label>
                      {selectedPDFs.size === 0 ? (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground p-4 border rounded-lg bg-muted/20">
                          <AlertCircle className="w-4 h-4" />
                          Please select PDF sources from the Library tab
                        </div>
                      ) : (
                        <div className="flex flex-wrap gap-2">
                          {Array.from(selectedPDFs).map((id) => {
                            const pdf = pdfs.find((p) => p.id === id)
                            return pdf ? (
                              <Badge key={id} variant="secondary" className="gap-1">
                                <FileCheck className="w-3 h-3" />
                                {pdf.title || pdf.file_name}
                              </Badge>
                            ) : null
                          })}
                        </div>
                      )}
                    </div>

                    <Button
                      onClick={handleGenerate}
                      disabled={generating || !topic.trim() || selectedPDFs.size === 0}
                      className="w-full"
                      size="lg"
                    >
                      {generating ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Generating...
                        </>
                      ) : (
                        <>
                          <Sparkles className="w-5 h-5 mr-2" />
                          Generate Academic Content
                        </>
                      )}
                    </Button>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Library Tab */}
              <TabsContent value="library" className="flex-1 overflow-auto px-6 pb-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>PDF Library</CardTitle>
                        <CardDescription>
                          Upload and manage your research sources
                        </CardDescription>
                      </div>
                      <div>
                        <input
                          ref={fileInputRef}
                          type="file"
                          accept=".pdf"
                          multiple
                          onChange={handleFileUpload}
                          className="hidden"
                        />
                        <Button
                          onClick={() => fileInputRef.current?.click()}
                          disabled={uploading}
                        >
                          {uploading ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : (
                            <Upload className="w-4 h-4 mr-2" />
                          )}
                          Upload PDFs
                        </Button>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ScrollArea className="h-[500px]">
                      {pdfs.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground">
                          <FileText className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p>No PDFs uploaded yet</p>
                          <p className="text-sm">Upload PDF research papers to get started</p>
                        </div>
                      ) : (
                        <div className="space-y-2">
                          {pdfs.map((pdf) => (
                            <div
                              key={pdf.id}
                              className={`p-4 border rounded-lg cursor-pointer transition-all ${
                                selectedPDFs.has(pdf.id)
                                  ? "bg-blue-50 border-blue-300"
                                  : "hover:bg-gray-50"
                              }`}
                              onClick={() => togglePDFSelection(pdf.id)}
                            >
                              <div className="flex items-start gap-3">
                                <div className={`mt-1 ${selectedPDFs.has(pdf.id) ? "text-blue-600" : "text-gray-400"}`}>
                                  {selectedPDFs.has(pdf.id) ? (
                                    <Check className="w-5 h-5" />
                                  ) : (
                                    <FileText className="w-5 h-5" />
                                  )}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="font-medium truncate">
                                    {pdf.title || pdf.file_name}
                                  </h4>
                                  {pdf.author && (
                                    <p className="text-sm text-muted-foreground">
                                      {pdf.author}
                                    </p>
                                  )}
                                  <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                                    <span>{pdf.page_count} pages</span>
                                    <span>•</span>
                                    <span>{new Date(pdf.created_at).toLocaleDateString()}</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </ScrollArea>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Content Tab */}
              <TabsContent value="content" className="flex-1 overflow-auto px-6 pb-6">
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <div>
                        <CardTitle>Generated Content</CardTitle>
                        <CardDescription>
                          {wordCountInContent > 0 && `${wordCountInContent} words`}
                        </CardDescription>
                      </div>
                      {generatedContent && (
                        <Button variant="outline" size="sm">
                          <Download className="w-4 h-4 mr-2" />
                          Export
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {!generatedContent ? (
                      <div className="text-center py-12 text-muted-foreground">
                        <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-20" />
                        <p>No content generated yet</p>
                        <p className="text-sm">Configure parameters and generate content to see it here</p>
                      </div>
                    ) : (
                      <>
                        <div>
                          <Label>Content</Label>
                          <Textarea
                            value={generatedContent}
                            onChange={(e) => setGeneratedContent(e.target.value)}
                            className="min-h-[400px] font-serif text-base leading-relaxed mt-2"
                          />
                        </div>

                        {bibliography && (
                          <div>
                            <Separator className="my-4" />
                            <Label>References ({citationStyle.toUpperCase()})</Label>
                            <Textarea
                              value={bibliography}
                              onChange={(e) => setBibliography(e.target.value)}
                              className="min-h-[150px] font-mono text-sm mt-2"
                            />
                          </div>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </ResizablePanel>

        {/* AI Chat Panel */}
        {showChat && (
          <>
            <ResizableHandle withHandle />
            <ResizablePanel defaultSize={30} minSize={25} maxSize={50}>
              <div className="h-full flex flex-col bg-gradient-to-b from-purple-50 to-blue-50">
                <div className="p-4 border-b bg-white/80 backdrop-blur">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-purple-600" />
                      <h3 className="font-semibold">AI Writing Assistant</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setShowChat(false)}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                  {selectedPDFs.size > 0 && (
                    <p className="text-xs text-muted-foreground mt-1">
                      Context: {selectedPDFs.size} PDF source{selectedPDFs.size > 1 ? "s" : ""}
                    </p>
                  )}
                </div>

                <ScrollArea className="flex-1 p-4" ref={chatScrollRef}>
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-20" />
                      <p className="text-sm">Ask me anything about academic writing!</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {chatMessages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex gap-2 ${
                            message.role === "user" ? "justify-end" : "justify-start"
                          }`}
                        >
                          <div
                            className={`max-w-[80%] rounded-lg p-3 ${
                              message.role === "user"
                                ? "bg-blue-600 text-white"
                                : "bg-white border"
                            }`}
                          >
                            <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                          </div>
                        </div>
                      ))}
                      {chatLoading && (
                        <div className="flex gap-2">
                          <div className="bg-white border rounded-lg p-3">
                            <Loader2 className="w-4 h-4 animate-spin" />
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </ScrollArea>

                <div className="p-4 border-t bg-white/80 backdrop-blur">
                  <div className="flex gap-2">
                    <Input
                      placeholder={
                        language === "tr"
                          ? "Mesajınızı yazın..."
                          : "Type your message..."
                      }
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault()
                          handleSendMessage()
                        }
                      }}
                      disabled={chatLoading}
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!chatInput.trim() || chatLoading}
                      size="icon"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </ResizablePanel>
          </>
        )}
      </ResizablePanelGroup>
    </div>
  )
}
