import type React from "react"
import type { Metadata } from "next"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "sonner"
import { ThemeProvider } from "next-themes"
import { SiteChatbot } from "@/components/site-chatbot"
import "./globals.css"

export const metadata: Metadata = {
  title: "Academic Research Platform - AI-Powered Writing & Research",
  description: "Professional academic writing assistant with multi-PDF chat, citation management, plagiarism checking, and AI-powered research tools.",
  keywords: "academic writing, research assistant, citation manager, plagiarism checker, AI writing, PDF chat",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="font-sans antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <SiteChatbot />
          <Toaster position="top-right" richColors />
          <Analytics />
          <SpeedInsights />
        </ThemeProvider>
      </body>
    </html>
  )
}
