import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from "@/lib/supabase/server"
import { checkRateLimit } from "./rate-limiter"

export async function withAuth(handler: (req: NextRequest, userId: string) => Promise<NextResponse>) {
  return async (req: NextRequest) => {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    return handler(req, user.id)
  }
}

export async function withRateLimit(
  handler: (req: NextRequest, userId: string) => Promise<NextResponse>,
  endpoint: string,
) {
  return async (req: NextRequest) => {
    const supabase = await createServerClient()
    if (!supabase) {
      return NextResponse.json({ error: "Database not configured" }, { status: 503 })
    }

    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: profile } = await supabase.from("profiles").select("plan").eq("id", user.id).single()

    const rateLimit = await checkRateLimit(user.id, endpoint, profile?.plan || "free")

    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: "Rate limit exceeded",
          resetAt: rateLimit.resetAt,
        },
        {
          status: 429,
          headers: {
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": rateLimit.resetAt.toISOString(),
          },
        },
      )
    }

    const response = await handler(req, user.id)

    response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString())
    response.headers.set("X-RateLimit-Reset", rateLimit.resetAt.toISOString())

    return response
  }
}
