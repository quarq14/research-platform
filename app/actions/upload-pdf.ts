"use server"

import { createClient } from "@/lib/supabase/server"
import { chunkText } from "@/lib/pdf-utils"
import { generateEmbedding } from "@/lib/embeddings"

export async function uploadPDFAction(formData: FormData) {
  try {
    const file = formData.get("file") as File
    const userId = formData.get("userId") as string

    if (!file || !userId) {
      return { success: false, error: "File or user information missing" }
    }

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

    const filePath = `${userId}/${Date.now()}-${file.name}`
    const { error: uploadError } = await supabase.storage.from("pdfs").upload(filePath, file)

    if (uploadError) {
      console.error("[v0] Storage upload error:", uploadError)
      return { success: false, error: "File upload failed" }
    }

    const estimatedPages = Math.max(1, Math.floor(file.size / 102400))

    const { data: fileData, error: fileError } = await supabase
      .from("files")
      .insert({
        user_id: userId,
        storage_path: filePath,
        original_name: file.name,
        mime_type: file.type,
        file_size: file.size,
        pages: estimatedPages,
        status: "completed",
      })
      .select()
      .single()

    if (fileError) {
      console.error("[v0] File metadata error:", fileError)
      return { success: false, error: "Failed to save file metadata" }
    }

    const sampleContent = `[PDF: ${file.name}]

This is a ${estimatedPages}-page academic document. 

In a production environment, this would contain the actual extracted text from the PDF using libraries like pdf.js or pdf-parse. The text would be processed page by page, maintaining structure and formatting.

Key features of the RAG pipeline:
1. Text extraction with page numbers
2. Semantic chunking with overlap
3. Vector embeddings for similarity search
4. Hybrid search combining vector and keyword matching
5. Citation tracking with page references

For demonstration purposes, this placeholder text allows you to test the chat functionality. In production, integrate with a PDF parsing service to extract real content.`

    const chunks = chunkText(sampleContent, 800, 150)

    const chunkRecords = await Promise.all(
      chunks.map(async (chunk, idx) => {
        const embedding = await generateEmbedding(chunk)
        return {
          file_id: fileData.id,
          content: chunk,
          embedding: JSON.stringify(embedding), // Store as JSON for now
          page_number: Math.floor(idx / 2) + 1,
          chunk_index: idx,
        }
      }),
    )

    const { error: chunkError } = await supabase.from("chunks").insert(chunkRecords)

    if (chunkError) {
      console.error("[v0] Chunk insert error:", chunkError)
      return { success: false, error: "Failed to save text chunks" }
    }

    // Try to increment profile stats
    const { error: rpcError } = await supabase.rpc("increment_profile_stats", {
      p_user_id: userId,
      p_pages: estimatedPages,
    })

    // Fallback if RPC doesn't exist or fails
    if (rpcError) {
      await supabase
        .from("profiles")
        .update({
          pages_analyzed: estimatedPages,
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId)
    }

    await supabase.from("usage_events").insert({
      user_id: userId,
      type: "pdf_upload",
      amount: estimatedPages,
      unit: "pages",
    })

    return { success: true, fileId: fileData.id }
  } catch (error: any) {
    console.error("[v0] Upload action error:", error)
    return { success: false, error: error.message || "Unexpected error occurred" }
  }
}
