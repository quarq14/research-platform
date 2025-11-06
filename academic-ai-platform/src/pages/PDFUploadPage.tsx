import { useState, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useLocale } from '@/contexts/LocaleContext'
import { supabase } from '@/lib/supabase'
import { Upload, File, X, CheckCircle, AlertCircle } from 'lucide-react'
import { extractTextFromPDF, chunkText } from '@/utils/pdf'

export default function PDFUploadPage() {
  const { user } = useAuth()
  const { t } = useLocale()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [uploadStatus, setUploadStatus] = useState<{type: 'success' | 'error', message: string} | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    
    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === 'application/pdf'
    )
    setFiles(prev => [...prev, ...droppedFiles])
  }, [])

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files)
      setFiles(prev => [...prev, ...selectedFiles])
    }
  }

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index))
  }

  const uploadFiles = async () => {
    if (!user || files.length === 0) return

    setUploading(true)
    setUploadStatus(null)

    try {
      for (const file of files) {
        // Extract text
        const { text, pages } = await extractTextFromPDF(file)
        
        // Upload to Supabase Storage
        const filePath = `${user.id}/${Date.now()}-${file.name}`
        const { error: uploadError } = await supabase.storage
          .from('pdfs')
          .upload(filePath, file)

        if (uploadError) throw uploadError

        // Save file metadata
        const { data: fileData, error: fileError } = await supabase
          .from('files')
          .insert({
            user_id: user.id,
            storage_path: filePath,
            original_name: file.name,
            mime_type: file.type,
            file_size: file.size,
            pages: pages,
            status: 'completed'
          })
          .select()
          .maybeSingle()

        if (fileError) throw fileError

        // Chunk and save
        const chunks = chunkText(text, 1000, 200)
        const chunkRecords = chunks.map((chunk, idx) => ({
          file_id: fileData.id,
          content: chunk,
          page_number: Math.floor(idx / 3) + 1,
          chunk_index: idx
        }))

        const { error: chunkError } = await supabase
          .from('chunks')
          .insert(chunkRecords)

        if (chunkError) throw chunkError
      }

      setUploadStatus({ 
        type: 'success', 
        message: `${files.length} PDF başarıyla yüklendi ve işlendi!` 
      })
      setFiles([])
    } catch (error: any) {
      console.error('Upload error:', error)
      setUploadStatus({ 
        type: 'error', 
        message: error.message || 'Yükleme başarısız oldu' 
      })
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <h1 className="text-2xl font-bold text-gray-900">PDF Yükle ve İşle</h1>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Upload Zone */}
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
            isDragging 
              ? 'border-blue-500 bg-blue-50' 
              : 'border-gray-300 bg-white'
          }`}
        >
          <Upload className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            PDF dosyalarınızı sürükleyip bırakın
          </h3>
          <p className="text-gray-600 mb-4">
            veya
          </p>
          <label className="inline-block">
            <input
              type="file"
              multiple
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
            <span className="px-6 py-3 bg-blue-600 text-white rounded-lg cursor-pointer hover:bg-blue-700 inline-block">
              Dosya Seç
            </span>
          </label>
        </div>

        {/* File List */}
        {files.length > 0 && (
          <div className="mt-6 bg-white rounded-xl shadow-sm p-6">
            <h4 className="font-semibold mb-4">Seçilen Dosyalar ({files.length})</h4>
            <div className="space-y-3">
              {files.map((file, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <File className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-sm">{file.name}</div>
                      <div className="text-xs text-gray-500">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="p-2 text-gray-400 hover:text-red-600"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>

            <button
              onClick={uploadFiles}
              disabled={uploading}
              className="w-full mt-6 bg-blue-600 text-white py-3 rounded-lg font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploading ? 'Yükleniyor...' : `${files.length} PDF'i Yükle ve İşle`}
            </button>
          </div>
        )}

        {/* Status Messages */}
        {uploadStatus && (
          <div className={`mt-6 p-4 rounded-lg flex items-start gap-3 ${
            uploadStatus.type === 'success' ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
          }`}>
            {uploadStatus.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            )}
            <p>{uploadStatus.message}</p>
          </div>
        )}

        {/* Info */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-xl p-6">
          <h4 className="font-semibold text-blue-900 mb-2">PDF İşleme Hakkında</h4>
          <ul className="text-sm text-blue-800 space-y-2">
            <li>• PDF'leriniz güvenli bir şekilde saklanır</li>
            <li>• Metin otomatik olarak çıkarılır ve analiz edilir</li>
            <li>• AI ile PDF içeriğiniz hakkında sohbet edebilirsiniz</li>
            <li>• Maksimum dosya boyutu: 50 MB</li>
            <li>• Desteklenen format: PDF</li>
          </ul>
        </div>
      </main>
    </div>
  )
}
