import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { streamText } from "ai"
import { createGroq } from "@ai-sdk/groq"

export const dynamic = "force-dynamic"

const groq = createGroq({
  apiKey: process.env.API_KEY_GROQ_API_KEY || "",
})

const modePrompts = {
  standard: "Paraphrase the following text while maintaining its meaning and academic tone. Keep all citations intact.",
  formal: "Rewrite the following text in a more formal, academic style. Maintain all citations and factual accuracy.",
  simple:
    "Simplify the following text to make it easier to understand while keeping the core meaning. Preserve all citations.",
  creative:
    "Rephrase the following text using more varied and creative expressions while maintaining accuracy. Keep all citations.",
  humanize:
    "Rewrite the following text to sound more natural and conversational while maintaining professionalism. Preserve all citations and factual accuracy. Add natural transitions and vary sentence structure.",
}

export async function POST(req: Request) {
  try {
    const supabase = await createServerClient()

    if (!supabase) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { text, mode = "standard" } = await req.json()

    if (!text || text.length < 20) {
      return NextResponse.json({ error: "Text must be at least 20 characters" }, { status: 400 })
    }

    const prompt = modePrompts[mode as keyof typeof modePrompts] || modePrompts.standard

    const result = await streamText({
      model: groq("llama-3.3-70b-versatile"),
      system: `You are an expert academic writing assistant. Your task is to paraphrase text while:
1. Maintaining factual accuracy
2. Preserving all citations and references
3. Keeping the academic integrity
4. Improving clarity and flow
5. Never fabricating information

${prompt}`,
      prompt: text,
    })

    const paraphrasedText = await result.text

    // Log usage
    await supabase.from("usage_events").insert({
      user_id: user.id,
      type: "paraphrase",
      amount: text.length,
      unit: "characters",
    })

    return NextResponse.json({ paraphrasedText })
  } catch (error) {
    console.error("[v0] Paraphrase error:", error)
    return NextResponse.json({ error: "Failed to paraphrase text" }, { status: 500 })
  }
}
