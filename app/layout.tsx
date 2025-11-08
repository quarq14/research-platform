import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import "./globals.css"
import { AuthProvider } from "@/contexts/AuthContext"
import { LocaleProvider } from "@/contexts/LocaleContext"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { ChatbotWrapper } from "@/components/chatbot-wrapper"

export const metadata: Metadata = {
  title: "Academic AI Research Platform - AI-Powered Writing & Research Assistant",
  description: "Professional AI-powered academic writing, research, and citation management platform. Upload PDFs, chat with documents, search scholarly sources, and create academic papers with proper citations. Supports multiple AI providers including Groq (free), OpenAI, Claude, Gemini, and MiniMax.",
  keywords: "academic writing, AI research assistant, PDF chat, citation manager, plagiarism checker, scholarly search, academic papers, literature review, thesis writing",
  authors: [{ name: "Academic AI Platform" }],
  creator: "Academic AI Platform",
  publisher: "Academic AI Platform",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"),
  openGraph: {
    type: "website",
    locale: "en_US",
    alternateLocale: ["tr_TR"],
    url: process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000",
    title: "Academic AI Research Platform",
    description: "AI-powered academic writing and research assistant with multilingual support",
    siteName: "Academic AI Platform",
  },
  twitter: {
    card: "summary_large_image",
    title: "Academic AI Research Platform",
    description: "AI-powered academic writing and research assistant",
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased font-sans">
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <LocaleProvider>
            <AuthProvider>
              {children}
              <ChatbotWrapper />
              <Toaster />
            </AuthProvider>
          </LocaleProvider>
        </ThemeProvider>
        <Analytics />
      </body>
    </html>
  )
}
