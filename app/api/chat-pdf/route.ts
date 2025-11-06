import { createServerClient } from "@/lib/supabase/server"
import { streamChatCompletion, getUserAIPreferences, getUserAPIKey, AIConfig, ChatMessage } from "@/lib/ai-providers"

export const dynamic = "force-dynamic"
export const maxDuration = 60

export async function POST(req: Request) {
  try {
    const { fileId, message, chatHistory } = await req.json()

    const supabase = await createServerClient()
    if (!supabase) {
      return new Response(JSON.stringify({ error: "Database not configured" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Get user's AI preferences
    const preferences = await getUserAIPreferences(user.id, supabase)
    const apiKey = await getUserAPIKey(user.id, preferences.provider, supabase)

    const aiConfig: AIConfig = {
      provider: preferences.provider,
      model: preferences.model,
      apiKey: apiKey || undefined,
    }

    // Get all chunks for the file
    const { data: allChunks, error: chunksError } = await supabase
      .from("chunks")
      .select("*")
      .eq("file_id", fileId)
      .order("chunk_index", { ascending: true })

    if (chunksError || !allChunks) {
      return new Response(JSON.stringify({ error: "Failed to load document chunks" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      })
    }

    // Simple keyword-based retrieval
    const queryKeywords = message
      .toLowerCase()
      .split(/\s+/)
      .filter((w: string) => w.length > 3)

    const scoredChunks = allChunks
      .map((chunk) => {
        const content = chunk.content.toLowerCase()
        const keywordScore = queryKeywords.reduce((score: number, keyword: string) => {
          const occurrences = (content.match(new RegExp(keyword, "g")) || []).length
          return score + occurrences
        }, 0)
        return { ...chunk, score: keywordScore }
      })
      .sort((a, b) => b.score - a.score)
      .slice(0, 5)

    const context = scoredChunks.map((c) => `[Page ${c.page_number}] ${c.content}`).join("\n\n")

    const systemPrompt = `You are an academic research assistant. Answer questions about the uploaded PDF document.
Here is the relevant content from the PDF:

${context}

Provide answers in English and cite page numbers when referencing specific information. Format citations as [Page X].
Be precise and academic in your responses.`

    // Prepare messages
    const messages: ChatMessage[] = [
      { role: 'system', content: systemPrompt },
      ...(chatHistory || []).map((m: any) => ({
        role: m.role as 'user' | 'assistant',
        content: m.content,
      })),
      { role: 'user', content: message },
    ]

    // Use streaming for real-time responses
    const encoder = new TextEncoder()
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of streamChatCompletion(aiConfig, messages, 0.7, 2000)) {
            controller.enqueue(encoder.encode(chunk))
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error("[v0] Chat PDF API error:", error)
    return new Response(JSON.stringify({ error: "Error processing chat" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
