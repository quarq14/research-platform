/**
 * AI Model Router
 * Intelligent routing system that:
 * 1. Routes requests to user-selected models
 * 2. Falls back to free Groq API if user's provider fails
 * 3. Supports dynamic model/provider addition
 * 4. Tracks usage and handles rate limiting
 */

import { createClient } from '@supabase/supabase-js'
import { decryptApiKey } from '../encryption'
import { chatCompletion as legacyChatCompletion, ChatMessage } from '../ai-providers'

// Feature types (should match database enum)
export type FeatureType =
  | 'chat'
  | 'paraphrase'
  | 'summarize'
  | 'translate'
  | 'citation'
  | 'academic_search'
  | 'plagiarism_check'
  | 'ai_detection'
  | 'pdf_chat'
  | 'writing_assistant'
  | 'global_default'

export interface AIProvider {
  id: string
  name: string
  display_name: string
  api_endpoint: string
  auth_type: 'bearer' | 'api_key' | 'oauth'
  is_free: boolean
  is_default: boolean
  is_active: boolean
  requires_user_key: boolean
}

export interface AIModel {
  id: string
  provider_id: string
  name: string
  display_name: string
  model_family: string
  context_window: number
  max_tokens: number
  supports_streaming: boolean
  supports_functions: boolean
  supports_vision: boolean
  is_recommended: boolean
  is_active: boolean
}

export interface ModelSelection {
  provider: AIProvider
  model: AIModel
  apiKey?: string
  useCustomKey: boolean
}

export interface RoutingResult {
  response: string
  provider_used: string
  model_used: string
  tokens_used?: number
  latency_ms: number
  fell_back_to_default: boolean
}

/**
 * Get Supabase client (server-side)
 */
function getSupabaseAdmin() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase configuration missing')
  }

  return createClient(supabaseUrl, supabaseKey)
}

/**
 * Get all active providers from database
 */
export async function getActiveProviders(): Promise<AIProvider[]> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('ai_providers')
    .select('*')
    .eq('is_active', true)
    .order('is_default', { ascending: false })

  if (error) {
    console.error('Error fetching providers:', error)
    return []
  }

  return data as AIProvider[]
}

/**
 * Get all active models for a provider
 */
export async function getProviderModels(providerId: string): Promise<AIModel[]> {
  const supabase = getSupabaseAdmin()

  const { data, error } = await supabase
    .from('ai_models')
    .select('*')
    .eq('provider_id', providerId)
    .eq('is_active', true)
    .order('is_recommended', { ascending: false })

  if (error) {
    console.error('Error fetching models:', error)
    return []
  }

  return data as AIModel[]
}

/**
 * Get user's preferred model for a specific feature
 */
export async function getUserModelPreference(
  userId: string,
  feature: FeatureType
): Promise<ModelSelection | null> {
  const supabase = getSupabaseAdmin()

  // First try to get user's specific preference for this feature
  let { data: preference } = await supabase
    .from('feature_model_preferences')
    .select(`
      *,
      model:ai_models(*),
      provider:ai_providers(*)
    `)
    .eq('user_id', userId)
    .eq('feature', feature)
    .single()

  // If no specific preference, try global default
  if (!preference) {
    const { data: globalPref } = await supabase
      .from('feature_model_preferences')
      .select(`
        *,
        model:ai_models(*),
        provider:ai_providers(*)
      `)
      .eq('user_id', userId)
      .eq('feature', 'global_default')
      .single()

    preference = globalPref
  }

  if (!preference || !preference.model || !preference.provider) {
    return null
  }

  let apiKey: string | undefined

  // If user wants to use custom key, fetch it
  if (preference.use_custom_key) {
    const { data: keyData } = await supabase
      .from('api_keys')
      .select('encrypted_key')
      .eq('user_id', userId)
      .eq('provider_id', preference.provider.id)
      .eq('is_active', true)
      .single()

    if (keyData?.encrypted_key) {
      try {
        apiKey = decryptApiKey(keyData.encrypted_key)
      } catch (error) {
        console.error('Error decrypting API key:', error)
        // Will fall back to platform key or default
      }
    }
  }

  return {
    provider: preference.provider as AIProvider,
    model: preference.model as AIModel,
    apiKey,
    useCustomKey: preference.use_custom_key,
  }
}

/**
 * Get default Groq model (fallback)
 */
export async function getDefaultGroqModel(): Promise<ModelSelection> {
  const supabase = getSupabaseAdmin()

  // Get Groq provider
  const { data: provider } = await supabase
    .from('ai_providers')
    .select('*')
    .eq('name', 'groq')
    .eq('is_active', true)
    .single()

  if (!provider) {
    throw new Error('Default Groq provider not found')
  }

  // Get recommended Groq model
  const { data: model } = await supabase
    .from('ai_models')
    .select('*')
    .eq('provider_id', provider.id)
    .eq('is_active', true)
    .eq('is_recommended', true)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!model) {
    throw new Error('Default Groq model not found')
  }

  // Use platform Groq API key
  const groqApiKey = process.env.GROQ_API_KEY || process.env.API_KEY_GROQ_API_KEY

  return {
    provider: provider as AIProvider,
    model: model as AIModel,
    apiKey: groqApiKey,
    useCustomKey: false,
  }
}

/**
 * Execute chat completion with the selected model
 */
async function executeModelRequest(
  selection: ModelSelection,
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens?: number
): Promise<{ response: string; tokens_used?: number }> {
  const startTime = Date.now()

  try {
    // Use legacy chat completion function for now
    // This routes to the correct provider based on the model
    const response = await legacyChatCompletion(
      {
        provider: selection.provider.name as any,
        apiKey: selection.apiKey,
        model: selection.model.name,
      },
      messages,
      temperature,
      maxTokens || selection.model.max_tokens
    )

    return {
      response,
      tokens_used: undefined, // Could be extracted from response headers
    }
  } catch (error: any) {
    console.error(`Error with ${selection.provider.name}:`, error)
    throw error
  }
}

/**
 * Main routing function - intelligently routes to the right model with fallback
 */
export async function routeModelRequest(
  userId: string | null,
  feature: FeatureType,
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens?: number
): Promise<RoutingResult> {
  const startTime = Date.now()
  let fellBackToDefault = false
  let selection: ModelSelection

  try {
    // Try to get user's preference if user is logged in
    if (userId) {
      const userPreference = await getUserModelPreference(userId, feature)

      if (userPreference) {
        selection = userPreference

        try {
          // Try user's preferred model
          const { response, tokens_used } = await executeModelRequest(
            selection,
            messages,
            temperature,
            maxTokens
          )

          // Log successful usage
          await logModelUsage(
            userId,
            selection,
            feature,
            tokens_used || 0,
            Date.now() - startTime,
            true
          )

          return {
            response,
            provider_used: selection.provider.display_name,
            model_used: selection.model.display_name,
            tokens_used,
            latency_ms: Date.now() - startTime,
            fell_back_to_default: false,
          }
        } catch (error: any) {
          console.error('User model failed, falling back to Groq:', error)

          // Log failed attempt
          await logModelUsage(
            userId,
            selection,
            feature,
            0,
            Date.now() - startTime,
            false,
            error.message
          )

          fellBackToDefault = true
        }
      }
    }

    // Fall back to default Groq
    selection = await getDefaultGroqModel()

    const { response, tokens_used } = await executeModelRequest(
      selection,
      messages,
      temperature,
      maxTokens
    )

    // Log usage
    if (userId) {
      await logModelUsage(
        userId,
        selection,
        feature,
        tokens_used || 0,
        Date.now() - startTime,
        true
      )
    }

    return {
      response,
      provider_used: selection.provider.display_name,
      model_used: selection.model.display_name,
      tokens_used,
      latency_ms: Date.now() - startTime,
      fell_back_to_default: fellBackToDefault,
    }
  } catch (error: any) {
    console.error('All models failed:', error)

    // Log critical failure
    if (userId && selection!) {
      await logModelUsage(
        userId,
        selection,
        feature,
        0,
        Date.now() - startTime,
        false,
        error.message,
        'critical_failure'
      )
    }

    throw new Error(`Failed to complete request: ${error.message}`)
  }
}

/**
 * Log model usage for analytics and monitoring
 */
async function logModelUsage(
  userId: string,
  selection: ModelSelection,
  feature: FeatureType,
  tokensUsed: number,
  latencyMs: number,
  success: boolean,
  errorMessage?: string,
  errorType?: string
): Promise<void> {
  try {
    const supabase = getSupabaseAdmin()

    await supabase.from('model_usage_logs').insert({
      user_id: userId,
      provider_id: selection.provider.id,
      model_id: selection.model.id,
      feature,
      tokens_used: tokensUsed,
      latency_ms: latencyMs,
      success,
      error_message: errorMessage,
      error_type: errorType,
    })

    // Update API key usage count if using custom key
    if (selection.useCustomKey && selection.apiKey) {
      await supabase
        .from('api_keys')
        .update({
          usage_count: supabase.rpc('increment_usage_count'),
          last_used_at: new Date().toISOString(),
        })
        .eq('user_id', userId)
        .eq('provider_id', selection.provider.id)
        .eq('is_active', true)
    }
  } catch (error) {
    console.error('Error logging model usage:', error)
    // Don't throw - logging shouldn't break the main flow
  }
}

/**
 * Stream chat completion (for real-time responses)
 */
export async function* streamModelRequest(
  userId: string | null,
  feature: FeatureType,
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens?: number
): AsyncGenerator<string> {
  // For now, this is a simplified version
  // In production, you'd want to implement proper streaming
  const result = await routeModelRequest(userId, feature, messages, temperature, maxTokens)
  yield result.response
}
