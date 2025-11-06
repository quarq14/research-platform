import { createServerClient } from "@/lib/supabase/server"

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

    if (supabase) {
      const {
        data: { user },
      } = await supabase.auth.getUser()
      if (user) {
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

    const groqApiKey = process.env.API_KEY_GROQ_API_KEY
    if (!groqApiKey) {
      return new Response(
        JSON.stringify({
          message: "I'm currently unavailable. Please check back later or contact support.",
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      )
    }

    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        model: "llama-3.3-70b-versatile",
        messages: [{ role: "system", content: systemPrompt }, ...messages],
        temperature: 0.7,
        max_tokens: 1000,
      }),
    })

    if (!response.ok) {
      throw new Error(`Groq API error: ${response.statusText}`)
    }

    const data = await response.json()
    const assistantMessage = data.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response."

    return new Response(JSON.stringify({ message: assistantMessage }), {
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
