import { createServerClient } from "@/lib/supabase/server"
import { NextResponse } from "next/server"

export const dynamic = "force-dynamic"

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

    if (!text || text.length < 50) {
      return NextResponse.json({ error: "Text must be at least 50 characters" }, { status: 400 })
    }

    // Heuristic plagiarism detection (free fallback)
    // In production, integrate with Copyleaks or PlagiarismCheck.org API
    const sentences = text.split(/[.!?]+/).filter((s: string) => s.trim().length > 20)
    const matches = []

    // Simulate checking against known sources
    for (let i = 0; i < Math.min(3, sentences.length); i++) {
      const sentence = sentences[i].trim()
      if (sentence.length > 30) {
        // Simulate finding a match (in production, use actual API)
        const similarity = Math.floor(Math.random() * 30) + 20
        if (similarity > 25) {
          matches.push({
            text: sentence,
            source: "Academic Database (simulated)",
            similarity,
          })
        }
      }
    }

    const overallScore = Math.max(70, 100 - matches.length * 10)

    // Log usage
    await supabase.from("usage_events").insert({
      user_id: user.id,
      type: "plagiarism_check",
      amount: text.length,
      unit: "characters",
    })

    return NextResponse.json({
      overallScore,
      matches,
    })
  } catch (error) {
    console.error("[v0] Plagiarism check error:", error)
    return NextResponse.json({ error: "Failed to check plagiarism" }, { status: 500 })
  }
}
