"use client"

import dynamic from "next/dynamic"

const SiteChatbot = dynamic(() => import("@/components/site-chatbot").then((mod) => ({ default: mod.SiteChatbot })), {
  ssr: false,
})

export function ChatbotWrapper() {
  return <SiteChatbot />
}
