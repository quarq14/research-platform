import { createServerClient } from "@/lib/supabase/server"
import { routeModelRequest, ChatMessage } from "@/lib/ai/model-router"

export const dynamic = "force-dynamic"
export const maxDuration = 30

interface Message {
  role: "user" | "assistant"
  content: string
}

export async function POST(req: Request) {
  try {
    const { messages }: { messages: Message[] } = await req.json()

    const supabase = await createServerClient()
    let userName = "there"
    let userId: string | null = null

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
        userId = user.id
        const { data: profile } = await supabase.from("profiles").select("full_name").eq("id", user.id).single()
        if (profile?.full_name) {
          userName = profile.full_name
        }
      }
    }

    const systemPrompt = `You are a helpful AI assistant for the Academic AI Platform.
Your role is to help users understand and navigate the platform's features.

Platform features:
- PDF Upload: Users can upload academic papers and research documents
- RAG Chat: Chat with uploaded documents using AI with citations
- Academic Search: Find scholarly sources using Semantic Scholar and OpenAlex APIs
- Writing Assistant: AI-powered editor for academic writing with proper citations
- Citation Manager: Manage references in APA, MLA, and Chicago styles
- Plagiarism Checker: Check originality of written content
- AI Detection: Detect AI-generated content with detailed reports
- Paraphrasing Tool: Rephrase text for clarity and naturalness
- Export: Export documents to DOCX, PDF, and Markdown formats

Be friendly, concise, and helpful. Guide users to the right features based on their needs.
The user's name is ${userName}.`

    // Prepare messages with system prompt
    const chatMessages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...messages.map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }))
    ]

    // Use the new intelligent routing system with automatic fallback to Groq
    const result = await routeModelRequest(
      userId,
      'chat', // feature type
      chatMessages,
      0.7, // temperature
      1000 // max tokens
    )

    return new Response(JSON.stringify({
      message: result.response,
      model_used: result.model_used,
      provider_used: result.provider_used,
      fell_back_to_default: result.fell_back_to_default
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    })
  } catch (error) {
    console.error("[v0] Site chat error:", error)
    return new Response(
      JSON.stringify({
        message: "I encountered an error. Please try again or contact support if the issue persists.",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      },
    )
  }
}
