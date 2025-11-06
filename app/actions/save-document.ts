"use server"

import { createClient } from "@/lib/supabase/server"

export async function saveDocumentAction({
  userId,
  title,
  content,
  type,
}: {
  userId: string
  title: string
  content: string
  type: string
}) {
  try {
    const supabase = await createClient()

    if (!supabase) {
      return { success: false, error: "Veritabanı bağlantısı yapılandırılmamış" }
    }

    // Verify user
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser()
    if (authError || !user || user.id !== userId) {
      return { success: false, error: "Yetkilendirme hatası" }
    }

    // Count words
    const wordCount = content.split(/\s+/).filter(Boolean).length

    // Save document
    const { error } = await supabase.from("documents").insert({
      user_id: userId,
      title,
      content,
      type,
      language: "tr",
      status: "draft",
    })

    if (error) {
      console.error("[v0] Document save error:", error)
      return { success: false, error: "Döküman kaydedilemedi" }
    }

    // Update profile stats
    const { data: profile } = await supabase
      .from("profiles")
      .select("word_count_used, documents_used")
      .eq("id", userId)
      .single()

    if (profile) {
      await supabase
        .from("profiles")
        .update({
          word_count_used: (profile.word_count_used || 0) + wordCount,
          documents_used: (profile.documents_used || 0) + 1,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    }

    return { success: true }
  } catch (error: any) {
    console.error("[v0] Save document action error:", error)
    return { success: false, error: error.message || "Beklenmeyen bir hata oluştu" }
  }
}
