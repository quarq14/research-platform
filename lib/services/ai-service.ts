/**
 * AI Service - Manages AI provider selection with user key priority
 * Priority: User's API Key > Default Environment Key
 */

import { createServerClient } from '@/lib/supabase/server'
import type { AIProvider, AIConfig, ChatMessage } from '@/lib/ai-providers'
import {
  chatCompletion,
  streamChatCompletion,
  getUserAIPreferences,
  getUserAPIKey,
  DEFAULT_MODELS
} from '@/lib/ai-providers'

/**
 * Get AI configuration for a user with fallback to defaults
 * 1. Try to get user's preferred provider and their API key
 * 2. If user has no API key, fall back to default environment key
 * 3. If no environment key, fall back to Groq default
 */
export async function getUserAIConfig(userId?: string): Promise<AIConfig> {
  // Default config (Groq with environment key)
  const defaultConfig: AIConfig = {
    provider: 'groq',
    model: DEFAULT_MODELS.groq,
  }

  // If no user ID, return default
  if (!userId) {
    return defaultConfig
  }

  try {
    const supabase = await createServerClient()
    if (!supabase) {
      return defaultConfig
    }

    // Get user's AI preferences
    const preferences = await getUserAIPreferences(userId, supabase)
    const provider = preferences.provider || 'groq'
    const model = preferences.model || DEFAULT_MODELS[provider]

    // Try to get user's API key for this provider
    const userApiKey = await getUserAPIKey(userId, provider, supabase)

    return {
      provider,
      model,
      apiKey: userApiKey || undefined, // Use user's key if available
    }
  } catch (error) {
    console.error('Failed to get user AI config:', error)
    return defaultConfig
  }
}

/**
 * Execute AI chat completion with automatic key management
 */
export async function executeAIChat(
  messages: ChatMessage[],
  userId?: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
): Promise<string> {
  const config = await getUserAIConfig(userId)
  return chatCompletion(config, messages, temperature, maxTokens)
}

/**
 * Execute streaming AI chat completion with automatic key management
 */
export async function* executeAIChatStream(
  messages: ChatMessage[],
  userId?: string,
  temperature: number = 0.7,
  maxTokens: number = 2000
): AsyncGenerator<string> {
  const config = await getUserAIConfig(userId)
  yield* streamChatCompletion(config, messages, temperature, maxTokens)
}

/**
 * Get available providers for a user
 * Shows which providers have API keys configured
 */
export async function getAvailableProviders(userId?: string): Promise<{
  provider: AIProvider
  hasUserKey: boolean
  hasDefaultKey: boolean
  available: boolean
}[]> {
  const providers: AIProvider[] = ['groq', 'openrouter', 'claude', 'openai', 'gemini']

  const result = []

  for (const provider of providers) {
    let hasUserKey = false
    let hasDefaultKey = false

    // Check for user key
    if (userId) {
      try {
        const supabase = await createServerClient()
        if (supabase) {
          const userKey = await getUserAPIKey(userId, provider, supabase)
          hasUserKey = !!userKey
        }
      } catch (error) {
        console.error(`Error checking user key for ${provider}:`, error)
      }
    }

    // Check for default environment key
    const envKeys: Record<AIProvider, string | undefined> = {
      groq: process.env.GROQ_API_KEY || process.env.API_KEY_GROQ_API_KEY,
      openrouter: process.env.OPENROUTER_API_KEY,
      claude: process.env.ANTHROPIC_API_KEY,
      openai: process.env.OPENAI_API_KEY,
      gemini: process.env.GOOGLE_API_KEY || process.env.GEMINI_API_KEY,
    }
    hasDefaultKey = !!envKeys[provider]

    result.push({
      provider,
      hasUserKey,
      hasDefaultKey,
      available: hasUserKey || hasDefaultKey,
    })
  }

  return result
}

/**
 * Validate if a provider is available for use
 */
export async function isProviderAvailable(
  provider: AIProvider,
  userId?: string
): Promise<boolean> {
  const providers = await getAvailableProviders(userId)
  const providerInfo = providers.find(p => p.provider === provider)
  return providerInfo?.available || false
}
