"use client"

import { useState } from "react"
import { Save, Download, BookOpen, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { saveDocumentAction } from "@/app/actions/save-document"
import { useRouter } from "next/navigation"
import { exportDocument, type ExportFormat } from "@/utils/export"

type DocumentType = "article" | "review" | "assignment" | "blog"

type Document = {
  id: string
  title: string
  content: string
  type: DocumentType
  updated_at: string
}

export function WritingWorkspace({ userId, initialDocuments }: { userId: string; initialDocuments: Document[] }) {
  const router = useRouter()
  const [title, setTitle] = useState("")
  const [content, setContent] = useState("")
  const [docType, setDocType] = useState<DocumentType>("article")
  const [saving, setSaving] = useState(false)
  const [exporting, setExporting] = useState(false)

  const wordCount = content.split(/\s+/).filter(Boolean).length

  const saveDocument = async () => {
    if (!title.trim()) {
      alert("Title cannot be empty!")
      return
    }

    setSaving(true)
    try {
      const result = await saveDocumentAction({
        userId,
        title,
        content,
        type: docType,
      })

      if (!result.success) {
        throw new Error(result.error || "Save failed")
      }

      alert("Document saved!")
      setTitle("")
      setContent("")
      router.refresh()
    } catch (error: any) {
      console.error("[v0] Save error:", error)
      alert(`Error: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const loadDocument = (doc: Document) => {
    setTitle(doc.title)
    setContent(doc.content || "")
    setDocType(doc.type)
  }

  const handleExport = async (format: ExportFormat) => {
    if (!title.trim() || !content.trim()) {
      alert("Title and content cannot be empty!")
      return
    }

    setExporting(true)
    try {
      const blob = await exportDocument(title, content, format)
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${title}.${format}`
      a.click()
      URL.revokeObjectURL(url)
    } catch (error: any) {
      console.error("[v0] Export error:", error)
      alert(`Export error: ${error.message}`)
    } finally {
      setExporting(false)
    }
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Editor */}
      <div className="lg:col-span-2 bg-white rounded-xl shadow-sm p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Document Type</label>
          <select
            value={docType}
            onChange={(e) => setDocType(e.target.value as DocumentType)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="article">Article</option>
            <option value="review">Literature Review</option>
            <option value="assignment">Assignment</option>
            <option value="blog">Blog</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter document title..."
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="Start writing..."
            rows={20}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono text-sm"
          />
          <div className="mt-2 text-sm text-gray-500">Word count: {wordCount}</div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <Button onClick={saveDocument} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Save className="w-5 h-5 mr-2" />}
            {saving ? "Saving..." : "Save"}
          </Button>
          <Button onClick={() => handleExport("docx")} disabled={exporting || !title.trim()} variant="outline">
            {exporting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
            DOCX
          </Button>
          <Button onClick={() => handleExport("pdf")} disabled={exporting || !title.trim()} variant="outline">
            {exporting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
            PDF
          </Button>
          <Button onClick={() => handleExport("md")} disabled={exporting || !title.trim()} variant="outline">
            {exporting ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <Download className="w-5 h-5 mr-2" />}
            MD
          </Button>
        </div>
      </div>

      {/* Sidebar - Documents List */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="font-semibold mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5" />
          Documents
        </h3>
        <div className="space-y-3">
          {initialDocuments.length === 0 ? (
            <p className="text-sm text-gray-500">No documents yet</p>
          ) : (
            initialDocuments.map((doc) => (
              <button
                key={doc.id}
                onClick={() => loadDocument(doc)}
                className="w-full text-left p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <div className="font-medium text-sm truncate">{doc.title}</div>
                <div className="text-xs text-gray-500 mt-1">{new Date(doc.updated_at).toLocaleDateString("en-US")}</div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
