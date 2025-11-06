import { createServerClient } from "@/lib/supabase/server"

export interface RateLimitConfig {
  maxRequests: number
  windowMs: number
}

const RATE_LIMITS: Record<string, RateLimitConfig> = {
  free: { maxRequests: 10, windowMs: 60000 }, // 10 requests per minute
  basic: { maxRequests: 50, windowMs: 60000 },
  pro: { maxRequests: 200, windowMs: 60000 },
  enterprise: { maxRequests: 1000, windowMs: 60000 },
}

export async function checkRateLimit(
  userId: string,
  endpoint: string,
  plan = "free",
): Promise<{ allowed: boolean; remaining: number; resetAt: Date }> {
  const supabase = await createServerClient()
  if (!supabase) {
    return { allowed: true, remaining: 999, resetAt: new Date() }
  }

  const config = RATE_LIMITS[plan] || RATE_LIMITS.free
  const now = new Date()
  const windowStart = new Date(now.getTime() - config.windowMs)

  const { data: rateLimit } = await supabase
    .from("rate_limits")
    .select("*")
    .eq("user_id", userId)
    .eq("endpoint", endpoint)
    .gte("window_start", windowStart.toISOString())
    .single()

  if (!rateLimit) {
    await supabase.from("rate_limits").insert({
      user_id: userId,
      endpoint,
      requests_count: 1,
      window_start: now.toISOString(),
    })
    return {
      allowed: true,
      remaining: config.maxRequests - 1,
      resetAt: new Date(now.getTime() + config.windowMs),
    }
  }

  if (rateLimit.requests_count >= config.maxRequests) {
    return {
      allowed: false,
      remaining: 0,
      resetAt: new Date(new Date(rateLimit.window_start).getTime() + config.windowMs),
    }
  }

  await supabase
    .from("rate_limits")
    .update({ requests_count: rateLimit.requests_count + 1 })
    .eq("id", rateLimit.id)

  return {
    allowed: true,
    remaining: config.maxRequests - rateLimit.requests_count - 1,
    resetAt: new Date(new Date(rateLimit.window_start).getTime() + config.windowMs),
  }
}
