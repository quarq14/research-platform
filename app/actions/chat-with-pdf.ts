"use server"

import { createClient } from "@/lib/supabase/server"
import { streamText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.API_KEY_GROQ_API_KEY || "",
})

type Message = {
  id: string
  role: "user" | "assistant"
  content: string
}

export async function chatWithPDFAction({
  userId,
  fileId,
  message,
  chatHistory,
}: {
  userId: string
  fileId: string
  message: string
  chatHistory: Message[]
}) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { success: false, error: "Database not configured" }
    }

    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return { success: false, error: "Unauthorized" }
    }

    // Get all chunks for the file
    const { data: allChunks, error: chunksError } = await supabase
      .from("chunks")
      .select("*")
      .eq("file_id", fileId)
      .order("chunk_index", { ascending: true })

    if (chunksError) {
      console.error("[v0] Chunks error:", chunksError)
      return { success: false, error: "Failed to load document chunks" }
    }

    const queryKeywords = message
      .toLowerCase()
      .split(/\s+/)
      .filter((w) => w.length > 3)
    const scoredChunks =
      allChunks
        ?.map((chunk) => {
          const content = chunk.content.toLowerCase()
          const keywordScore = queryKeywords.reduce((score, keyword) => {
            const occurrences = (content.match(new RegExp(keyword, "g")) || []).length
            return score + occurrences
          }, 0)
          return { ...chunk, score: keywordScore }
        })
        .sort((a, b) => b.score - a.score)
        .slice(0, 5) || []

    const context = scoredChunks.map((c) => `[Page ${c.page_number}] ${c.content}`).join("\n\n")

    const aiMessages = chatHistory.map((m) => ({
      role: m.role,
      content: m.content,
    }))

    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are an academic research assistant. Answer questions about the uploaded PDF document. 
Here is the relevant content from the PDF:

${context}

Provide answers in English and cite page numbers when referencing specific information. Format citations as [Page X].
Be precise and academic in your responses.`,
      messages: [
        ...aiMessages,
        {
          role: "user",
          content: message,
        },
      ],
    })

    const responseText = await result.text

    const pageMatches = responseText.match(/\[Page (\d+)\]/g) || []
    const citations = pageMatches.map((match) => {
      const pageNum = Number.parseInt(match.match(/\d+/)![0])
      const chunk = scoredChunks.find((c) => c.page_number === pageNum)
      return {
        page: pageNum,
        text: chunk?.content.slice(0, 150) || "",
      }
    })

    const { data: file } = await supabase.from("files").select("document_id").eq("id", fileId).single()

    let chatId: string | null = null
    const { data: existingChat } = await supabase
      .from("chats")
      .select("id")
      .eq("user_id", userId)
      .eq("document_id", file?.document_id)
      .maybeSingle()

    if (existingChat) {
      chatId = existingChat.id
    } else {
      const { data: newChat } = await supabase
        .from("chats")
        .insert({
          user_id: userId,
          document_id: file?.document_id,
          title: message.slice(0, 100),
        })
        .select()
        .single()

      chatId = newChat?.id || null
    }

    if (chatId) {
      await supabase.from("messages").insert([
        {
          chat_id: chatId,
          role: "user",
          content: message,
        },
        {
          chat_id: chatId,
          role: "assistant",
          content: responseText,
          citations: citations.length > 0 ? citations : null,
        },
      ])
    }

    await supabase.from("usage_events").insert({
      user_id: userId,
      type: "rag_chat",
      amount: message.length + responseText.length,
      unit: "characters",
    })

    return {
      success: true,
      response: responseText,
      citations: citations.length > 0 ? citations : undefined,
    }
  } catch (error: any) {
    console.error("[v0] Chat action error:", error)
    return { success: false, error: error.message || "Unexpected error occurred" }
  }
}
