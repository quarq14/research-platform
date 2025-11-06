"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Upload, File, X, CheckCircle, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { uploadPDFAction } from "@/app/actions/upload-pdf"

export function PDFUploadForm({ userId }: { userId: string }) {
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{ type: "success" | "error"; message: string } | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    const droppedFiles = Array.from(e.dataTransfer.files).filter((file) => file.type === "application/pdf")
    setFiles((prev) => [...prev, ...droppedFiles])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles((prev) => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (files.length === 0) return

    setUploading(true)
    setUploadStatus(null)

    try {
      for (const file of files) {
        const formData = new FormData()
        formData.append("file", file)
        formData.append("userId", userId)

        const result = await uploadPDFAction(formData)

        if (!result.success) {
          throw new Error(result.error || "Upload failed")
        }
      }

      setUploadStatus({
        type: "success",
        message: `${files.length} PDF${files.length > 1 ? "s" : ""} successfully uploaded and processed!`,
      })
      setFiles([])
    } catch (error: any) {
      console.error("Upload error:", error)
      const errorMessage = error.message || "Upload failed"
      const isDatabaseError = errorMessage.includes("relation") || errorMessage.includes("does not exist")

      setUploadStatus({
        type: "error",
        message: isDatabaseError
          ? "Database not set up. Please run the setup scripts in DATABASE_SETUP.md first."
          : errorMessage,
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <>
      {/* Upload Zone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
          isDragging ? "border-blue-500 bg-blue-50" : "border-gray-300 bg-white"
        }`}
      >
        <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Drag and drop your PDF files here</h3>
        <p className="text-gray-600 mb-4">or</p>
        <label className="inline-block">
          <input type="file" multiple accept=".pdf" onChange={handleFileSelect} className="hidden" />
          <span className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 inline-block">
            Choose Files
          </span>
        </label>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
          <h4 className="font-semibold mb-4">Selected Files ({files.length})</h4>
          <div className="space-y-3">
            {files.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <File className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium text-sm">{file.name}</div>
                    <div className="text-xs text-gray-500">{(file.size / 1024 / 1024).toFixed(2)} MB</div>
                  </div>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  className="p-2 text-gray-400 hover:text-red-600"
                  type="button"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>

          <Button onClick={uploadFiles} disabled={uploading} className="w-full mt-6">
            {uploading ? "Uploading..." : `Upload and Process ${files.length} PDF${files.length > 1 ? "s" : ""}`}
          </Button>
        </div>
      )}

      {/* Status Messages */}
      {uploadStatus && (
        <div
          className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
            uploadStatus.type === "success" ? "bg-green-50 text-green-800" : "bg-red-50 text-red-800"
          }`}
        >
          {uploadStatus.type === "success" ? (
            <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          )}
          <p>{uploadStatus.message}</p>
        </div>
      )}

      {/* Info */}
      <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
        <h4 className="font-semibold text-blue-900 mb-2">About PDF Processing</h4>
        <ul className="text-sm text-blue-800 space-y-2">
          <li>• Your PDFs are stored securely</li>
          <li>• Text is automatically extracted and analyzed</li>
          <li>• Chat with AI about your PDF content</li>
          <li>• Maximum file size: 50 MB</li>
          <li>• Supported format: PDF</li>
        </ul>
      </div>
    </>
  )
}
