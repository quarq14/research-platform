import { createServerClient } from "@/lib/supabase/server"
import { streamText } from "ai"
import { createGroq } from "@ai-sdk/groq"

export const dynamic = "force-dynamic"
export const maxDuration = 60

const groq = createGroq({
  apiKey: process.env.API_KEY_GROQ_API_KEY || "",
})

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

    const result = streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are an academic research assistant. Answer questions about the uploaded PDF document. 
Here is the relevant content from the PDF:

${context}

Provide answers in English and cite page numbers when referencing specific information. Format citations as [Page X].
Be precise and academic in your responses.`,
      messages: [
        ...(chatHistory || []),
        {
          role: "user",
          content: message,
        },
      ],
      temperature: 0.7,
      maxTokens: 2000,
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("[v0] Chat PDF API error:", error)
    return new Response(JSON.stringify({ error: "Error processing chat" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}
