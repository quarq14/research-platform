import { createServerClient } from "@/lib/supabase/server"

export async function trackUsage(
  userId: string,
  type: "words" | "documents" | "pages" | "searches" | "api_calls",
  amount: number,
): Promise<void> {
  const supabase = await createServerClient()
  if (!supabase) return

  await supabase.from("usage_events").insert({
    user_id: userId,
    type,
    amount,
    unit: type === "words" ? "words" : "count",
  })

  const updateField =
    type === "words"
      ? "word_count_used"
      : type === "documents"
        ? "documents_used"
        : type === "pages"
          ? "pages_uploaded"
          : "searches_used"

  await supabase.rpc("increment_usage", {
    user_id: userId,
    field: updateField,
    amount,
  })
}

export async function checkUsageLimit(
  userId: string,
  plan: string,
): Promise<{ allowed: boolean; usage: any; limits: any }> {
  const supabase = await createServerClient()
  if (!supabase) {
    return { allowed: true, usage: {}, limits: {} }
  }

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", userId).single()

  const limits = {
    free: { words: 10000, documents: 5, pages: 50, searches: 20 },
    basic: { words: 100000, documents: 50, pages: 500, searches: 200 },
    pro: { words: 1000000, documents: 500, pages: 5000, searches: 2000 },
    enterprise: { words: -1, documents: -1, pages: -1, searches: -1 },
  }

  const planLimits = limits[plan as keyof typeof limits] || limits.free

  return {
    allowed: planLimits.words === -1 || (profile?.word_count_used || 0) < planLimits.words,
    usage: {
      words: profile?.word_count_used || 0,
      documents: profile?.documents_used || 0,
      pages: profile?.pages_uploaded || 0,
      searches: profile?.searches_used || 0,
    },
    limits: planLimits,
  }
}
