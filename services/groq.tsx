import { generateText } from "ai"
import { createGroq } from "@ai-sdk/groq"

const groq = createGroq({
  apiKey: process.env.GROQ_API_KEY,
})

export function isGroqConfigured(): boolean {
  return !!process.env.GROQ_API_KEY
}

export async function chatWithContext(message: string, context: string[]): Promise<string> {
  try {
    const contextText = context.join("\n\n")

    const { text } = await generateText({
      model: groq("llama-3.1-70b-versatile"),
      prompt: `You are an academic research assistant. Use the following context from academic papers to answer the question.

Context:
${contextText}

Question: ${message}

Provide a detailed, academic response based on the context provided. If the context doesn't contain relevant information, say so.`,
    })

    return text
  } catch (error) {
    console.error("Error in chatWithContext:", error)
    throw new Error("Failed to generate response")
  }
}
