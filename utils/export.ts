import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx"
import { jsPDF } from "jspdf"

export type ExportFormat = "docx" | "pdf" | "md"

export async function exportDocument(
  title: string,
  content: string,
  format: ExportFormat,
  citations?: Array<{ text: string; style: string }>,
): Promise<Blob> {
  switch (format) {
    case "docx":
      return exportToDocx(title, content, citations)
    case "pdf":
      return exportToPdf(title, content, citations)
    case "md":
      return exportToMarkdown(title, content, citations)
    default:
      throw new Error(`Unsupported format: ${format}`)
  }
}

async function exportToDocx(
  title: string,
  content: string,
  citations?: Array<{ text: string; style: string }>,
): Promise<Blob> {
  const paragraphs: Paragraph[] = [
    new Paragraph({
      text: title,
      heading: HeadingLevel.HEADING_1,
    }),
    new Paragraph({ text: "" }),
  ]

  const contentParagraphs = content.split("\n\n").map(
    (para) =>
      new Paragraph({
        children: [new TextRun(para)],
        spacing: { after: 200 },
      }),
  )
  paragraphs.push(...contentParagraphs)

  if (citations && citations.length > 0) {
    paragraphs.push(
      new Paragraph({ text: "" }),
      new Paragraph({
        text: "References",
        heading: HeadingLevel.HEADING_2,
      }),
    )
    citations.forEach((citation) => {
      paragraphs.push(
        new Paragraph({
          children: [new TextRun(citation.text)],
          spacing: { after: 100 },
        }),
      )
    })
  }

  const doc = new Document({
    sections: [{ properties: {}, children: paragraphs }],
  })

  return await Packer.toBlob(doc)
}

async function exportToPdf(
  title: string,
  content: string,
  citations?: Array<{ text: string; style: string }>,
): Promise<Blob> {
  const doc = new jsPDF()
  let yPosition = 20

  doc.setFontSize(20)
  doc.text(title, 20, yPosition)
  yPosition += 15

  doc.setFontSize(12)
  const contentLines = doc.splitTextToSize(content, 170)
  contentLines.forEach((line: string) => {
    if (yPosition > 280) {
      doc.addPage()
      yPosition = 20
    }
    doc.text(line, 20, yPosition)
    yPosition += 7
  })

  if (citations && citations.length > 0) {
    if (yPosition > 250) {
      doc.addPage()
      yPosition = 20
    }
    yPosition += 10
    doc.setFontSize(16)
    doc.text("References", 20, yPosition)
    yPosition += 10

    doc.setFontSize(10)
    citations.forEach((citation) => {
      const citationLines = doc.splitTextToSize(citation.text, 170)
      citationLines.forEach((line: string) => {
        if (yPosition > 280) {
          doc.addPage()
          yPosition = 20
        }
        doc.text(line, 20, yPosition)
        yPosition += 5
      })
      yPosition += 3
    })
  }

  return doc.output("blob")
}

async function exportToMarkdown(
  title: string,
  content: string,
  citations?: Array<{ text: string; style: string }>,
): Promise<Blob> {
  let markdown = `# ${title}\n\n${content}\n\n`

  if (citations && citations.length > 0) {
    markdown += `## References\n\n`
    citations.forEach((citation) => {
      markdown += `- ${citation.text}\n`
    })
  }

  return new Blob([markdown], { type: "text/markdown" })
}
