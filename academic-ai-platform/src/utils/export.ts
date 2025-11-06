// Document Export Utilities
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'
import jsPDF from 'jspdf'

export type ExportFormat = 'docx' | 'pdf' | 'md'

// Export to DOCX
export async function exportToDocx(
  title: string,
  content: string
): Promise<Blob> {
  try {
    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              text: title,
              heading: HeadingLevel.HEADING_1,
            }),
            new Paragraph({
              text: '',
            }),
            ...content.split('\n\n').map(
              (para) =>
                new Paragraph({
                  children: [
                    new TextRun({
                      text: para,
                    }),
                  ],
                })
            ),
          ],
        },
      ],
    })

    const blob = await Packer.toBlob(doc)
    return blob
  } catch (error: any) {
    throw new Error(`DOCX export hatası: ${error.message}`)
  }
}

// Export to PDF
export async function exportToPdf(
  title: string,
  content: string
): Promise<Blob> {
  try {
    const pdf = new jsPDF()
    
    // Title
    pdf.setFontSize(20)
    pdf.text(title, 20, 20)
    
    // Content
    pdf.setFontSize(12)
    const lines = pdf.splitTextToSize(content, 170)
    pdf.text(lines, 20, 40)
    
    const blob = pdf.output('blob')
    return blob
  } catch (error: any) {
    throw new Error(`PDF export hatası: ${error.message}`)
  }
}

// Export to Markdown
export function exportToMarkdown(
  title: string,
  content: string
): Blob {
  const markdown = `# ${title}\n\n${content}`
  const blob = new Blob([markdown], { type: 'text/markdown' })
  return blob
}

// Download blob as file
export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

// Main export function
export async function exportDocument(
  title: string,
  content: string,
  format: ExportFormat
): Promise<void> {
  try {
    let blob: Blob
    let filename: string

    switch (format) {
      case 'docx':
        blob = await exportToDocx(title, content)
        filename = `${title}.docx`
        break
      
      case 'pdf':
        blob = await exportToPdf(title, content)
        filename = `${title}.pdf`
        break
      
      case 'md':
        blob = exportToMarkdown(title, content)
        filename = `${title}.md`
        break
      
      default:
        throw new Error(`Desteklenmeyen format: ${format}`)
    }

    downloadBlob(blob, filename)
  } catch (error: any) {
    throw new Error(`Export hatası: ${error.message}`)
  }
}
