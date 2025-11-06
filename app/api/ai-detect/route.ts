import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

function calculatePerplexity(text: string): number {
  const words = text.split(/\s+/)
  const uniqueWords = new Set(words)
  return (uniqueWords.size / words.length) * 100
}

function calculateBurstiness(text: string): number {
  const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0)
  const lengths = sentences.map((s) => s.trim().split(/\s+/).length)
  const avg = lengths.reduce((a, b) => a + b, 0) / lengths.length
  const variance = lengths.reduce((sum, len) => sum + Math.pow(len - avg, 2), 0) / lengths.length
  return Math.sqrt(variance)
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

    const { text } = await req.json()

    if (!text || text.length < 100) {
      return NextResponse.json({ error: "Text must be at least 100 characters" }, { status: 400 })
    }

    // Heuristic AI detection (free fallback)
    // In production, integrate with Copyleaks or Originality.ai
    const perplexity = calculatePerplexity(text)
    const burstiness = calculateBurstiness(text)

    const patterns = []

    // Check for AI patterns
    if (perplexity < 40) patterns.push("Low vocabulary diversity")
    if (burstiness < 5) patterns.push("Uniform sentence structure")
    if (text.includes("As an AI") || text.includes("I don't have")) patterns.push("AI self-reference")
    if (/\b(furthermore|moreover|additionally|consequently)\b/gi.test(text)) {
      patterns.push("Formal transition words")
    }

    // Calculate AI probability based on heuristics
    let aiProbability = 50
    if (perplexity < 40) aiProbability += 15
    if (burstiness < 5) aiProbability += 15
    if (patterns.length >= 3) aiProbability += 10
    aiProbability = Math.min(95, Math.max(5, aiProbability))

    const humanProbability = 100 - aiProbability

    const confidence =
      aiProbability >= 70 || humanProbability >= 70
        ? "High"
        : aiProbability >= 55 || humanProbability >= 55
          ? "Medium"
          : "Low"

    // Log usage
    await supabase.from("usage_events").insert({
      user_id: user.id,
      type: "ai_detection",
      amount: text.length,
      unit: "characters",
    })

    return NextResponse.json({
      aiProbability,
      humanProbability,
      confidence,
      analysis: {
        perplexity,
        burstiness,
        patterns,
      },
    })
  } catch (error) {
    console.error("[v0] AI detection error:", error)
    return NextResponse.json({ error: "Failed to detect AI content" }, { status: 500 })
  }
}
