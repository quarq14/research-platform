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

    const { query } = await req.json()

    // In production, integrate with Semantic Scholar, OpenAlex, and Crossref APIs
    // For now, return mock results
    const mockResults = [
      {
        title: `Research on ${query}: A Comprehensive Study`,
        authors: [
          { firstName: "John", lastName: "Smith" },
          { firstName: "Jane", lastName: "Doe" },
        ],
        year: 2024,
        journal: "Journal of Academic Research",
        doi: "10.1234/example.2024.001",
        url: "https://example.com/paper",
      },
      {
        title: `Advanced Methods in ${query} Analysis`,
        authors: [{ firstName: "Alice", lastName: "Johnson" }],
        year: 2023,
        journal: "International Review of Science",
        doi: "10.1234/example.2023.002",
        url: "https://example.com/paper2",
      },
    ]

    // Save sources to database
    const sourcesToInsert = mockResults.map((r) => ({
      user_id: user.id,
      title: r.title,
      authors: r.authors,
      year: r.year,
      journal: r.journal,
      doi: r.doi,
      url: r.url,
    }))

    await supabase.from("sources").insert(sourcesToInsert)

    // Log usage
    await supabase.from("usage_events").insert({
      user_id: user.id,
      type: "source_search",
      amount: 1,
      unit: "searches",
    })

    return NextResponse.json({ results: mockResults })
  } catch (error) {
    console.error("[v0] Source search error:", error)
    return NextResponse.json({ error: "Failed to search sources" }, { status: 500 })
  }
}
