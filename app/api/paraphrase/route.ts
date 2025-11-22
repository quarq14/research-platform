import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"
import { routeModelRequest, ChatMessage } from "@/lib/ai/model-router"

export const dynamic = "force-dynamic"

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

    // Prepare messages for the AI model router
    const messages: ChatMessage[] = [
      {
        role: 'system',
        content: `You are an expert academic writing assistant. Your task is to paraphrase text while:
1. Maintaining factual accuracy
2. Preserving all citations and references
3. Keeping the academic integrity
4. Improving clarity and flow
5. Never fabricating information

${prompt}`,
      },
      {
        role: 'user',
        content: text,
      },
    ]

    // Use the intelligent routing system with automatic fallback to Groq
    const result = await routeModelRequest(
      user.id,
      'paraphrase', // feature type
      messages,
      0.7, // temperature
      2000 // max tokens
    )

    // Log usage
    await supabase.from("usage_events").insert({
      user_id: user.id,
      type: "paraphrase",
      amount: text.length,
      unit: "characters",
      metadata: {
        model_used: result.model_used,
        provider_used: result.provider_used,
        fell_back_to_default: result.fell_back_to_default,
      },
    })

    return NextResponse.json({
      paraphrasedText: result.response,
      model_used: result.model_used,
      provider_used: result.provider_used,
    })
  } catch (error) {
    console.error("[v0] Paraphrase error:", error)
    return NextResponse.json({ error: "Failed to paraphrase text" }, { status: 500 })
  }
}
