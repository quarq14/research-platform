/**
 * Database Helper Functions
 * Common database operations and utilities
 */

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database, Profile, Document, File, Chat, Message, Source, Citation } from './types'

type SupabaseClientType = SupabaseClient<Database>

// ============================================================================
// PROFILE HELPERS
// ============================================================================

export async function getProfile(supabase: SupabaseClientType, userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function updateProfile(
  supabase: SupabaseClientType,
  userId: string,
  updates: Partial<Profile>
) {
  const { data, error } = await supabase
    .from('profiles')
    .update(updates)
    .eq('id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserSettings(supabase: SupabaseClientType, userId: string) {
  const { data, error } = await supabase
    .from('user_settings')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) {
    // Return default if not found
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }
  return data
}

export async function upsertUserSettings(
  supabase: SupabaseClientType,
  userId: string,
  settings: { ai_provider?: string; ai_model?: string }
) {
  const { data, error } = await supabase
    .from('user_settings')
    .upsert({
      user_id: userId,
      ...settings,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// DOCUMENT HELPERS
// ============================================================================

export async function listDocuments(
  supabase: SupabaseClientType,
  userId: string,
  options?: {
    projectId?: string
    status?: string
    limit?: number
    offset?: number
  }
) {
  let query = supabase
    .from('documents')
    .select('*', { count: 'exact' })
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (options?.projectId) {
    query = query.eq('project_id', options.projectId)
  }
  if (options?.status) {
    query = query.eq('status', options.status)
  }
  if (options?.limit) {
    query = query.limit(options.limit)
  }
  if (options?.offset) {
    query = query.range(options.offset, options.offset + (options.limit || 10) - 1)
  }

  const { data, error, count } = await query

  if (error) throw error
  return { documents: data, count }
}

export async function getDocument(supabase: SupabaseClientType, documentId: string) {
  const { data, error } = await supabase
    .from('documents')
    .select('*')
    .eq('id', documentId)
    .single()

  if (error) throw error
  return data
}

export async function createDocument(
  supabase: SupabaseClientType,
  userId: string,
  document: {
    title: string
    content?: string
    document_type?: string
    language?: string
    project_id?: string
  }
) {
  const { data, error } = await supabase
    .from('documents')
    .insert({
      user_id: userId,
      title: document.title,
      content: document.content || '',
      document_type: document.document_type || 'article',
      language: document.language || 'en',
      project_id: document.project_id,
      status: 'draft',
      word_count: 0,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateDocument(
  supabase: SupabaseClientType,
  documentId: string,
  updates: Partial<Document>
) {
  const { data, error } = await supabase
    .from('documents')
    .update(updates)
    .eq('id', documentId)
    .select()
    .single()

  if (error) throw error
  return data
}

export async function deleteDocument(supabase: SupabaseClientType, documentId: string) {
  const { error } = await supabase.from('documents').delete().eq('id', documentId)

  if (error) throw error
}

// ============================================================================
// FILE HELPERS
// ============================================================================

export async function listFiles(supabase: SupabaseClientType, userId: string) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getFile(supabase: SupabaseClientType, fileId: string) {
  const { data, error } = await supabase
    .from('files')
    .select('*')
    .eq('id', fileId)
    .single()

  if (error) throw error
  return data
}

export async function createFile(
  supabase: SupabaseClientType,
  userId: string,
  file: {
    storage_path: string
    filename: string
    mime_type: string
    size_bytes: number
    pages?: number
    document_id?: string
  }
) {
  const { data, error } = await supabase
    .from('files')
    .insert({
      user_id: userId,
      ...file,
      status: 'uploaded',
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function updateFileStatus(
  supabase: SupabaseClientType,
  fileId: string,
  status: string,
  errorMessage?: string
) {
  const { data, error } = await supabase
    .from('files')
    .update({
      status,
      error_message: errorMessage,
    })
    .eq('id', fileId)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// CHAT HELPERS
// ============================================================================

export async function listChats(supabase: SupabaseClientType, userId: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data
}

export async function getChat(supabase: SupabaseClientType, chatId: string) {
  const { data, error } = await supabase
    .from('chats')
    .select('*')
    .eq('id', chatId)
    .single()

  if (error) throw error
  return data
}

export async function createChat(
  supabase: SupabaseClientType,
  userId: string,
  chat: {
    title?: string
    document_id?: string
    context_files?: string[]
  }
) {
  const { data, error } = await supabase
    .from('chats')
    .insert({
      user_id: userId,
      title: chat.title || 'New Chat',
      document_id: chat.document_id,
      context_files: chat.context_files || [],
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getChatMessages(supabase: SupabaseClientType, chatId: string) {
  const { data, error } = await supabase
    .from('messages')
    .select('*')
    .eq('chat_id', chatId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function addMessage(
  supabase: SupabaseClientType,
  chatId: string,
  message: {
    role: 'user' | 'assistant' | 'system'
    content: string
    citations?: any[]
    sources_used?: string[]
    tokens_used?: number
    model_used?: string
  }
) {
  const { data, error } = await supabase
    .from('messages')
    .insert({
      chat_id: chatId,
      role: message.role,
      content: message.content,
      citations: message.citations || [],
      sources_used: message.sources_used || [],
      tokens_used: message.tokens_used || 0,
      model_used: message.model_used,
    })
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// SOURCE AND CITATION HELPERS
// ============================================================================

export async function searchSources(
  supabase: SupabaseClientType,
  query: string,
  options?: {
    limit?: number
    sourceType?: string
  }
) {
  let dbQuery = supabase
    .from('sources')
    .select('*')
    .textSearch('title', query)
    .order('citation_count', { ascending: false })

  if (options?.sourceType) {
    dbQuery = dbQuery.eq('source_type', options.sourceType)
  }
  if (options?.limit) {
    dbQuery = dbQuery.limit(options.limit)
  }

  const { data, error } = await dbQuery

  if (error) throw error
  return data
}

export async function getSource(supabase: SupabaseClientType, sourceId: string) {
  const { data, error } = await supabase
    .from('sources')
    .select('*')
    .eq('id', sourceId)
    .single()

  if (error) throw error
  return data
}

export async function createSource(supabase: SupabaseClientType, source: Partial<Source>) {
  const { data, error } = await supabase
    .from('sources')
    .insert(source)
    .select()
    .single()

  if (error) {
    // If duplicate DOI, return existing
    if (error.code === '23505') {
      const { data: existing } = await supabase
        .from('sources')
        .select('*')
        .eq('doi', source.doi)
        .single()
      return existing
    }
    throw error
  }
  return data
}

export async function getDocumentCitations(
  supabase: SupabaseClientType,
  documentId: string
) {
  const { data, error } = await supabase
    .from('citations')
    .select(`
      *,
      source:sources(*)
    `)
    .eq('document_id', documentId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return data
}

export async function addCitation(
  supabase: SupabaseClientType,
  citation: {
    document_id: string
    source_id: string
    citation_style: string
    in_text: string
    reference_text: string
    page_number?: string
  }
) {
  const { data, error } = await supabase
    .from('citations')
    .insert(citation)
    .select()
    .single()

  if (error) throw error
  return data
}

// ============================================================================
// USAGE TRACKING
// ============================================================================

export async function trackUsage(
  supabase: SupabaseClientType,
  userId: string,
  event: {
    event_type: 'tokens' | 'pages' | 'searches' | 'plagiarism_check' | 'ai_detection' | 'export'
    amount: number
    reference_id?: string
    metadata?: Record<string, any>
  }
) {
  const { data, error } = await supabase
    .from('usage_events')
    .insert({
      user_id: userId,
      event_type: event.event_type,
      amount: event.amount,
      reference_id: event.reference_id,
      metadata: event.metadata || {},
    })
    .select()
    .single()

  if (error) throw error
  return data
}

export async function getUserUsage(
  supabase: SupabaseClientType,
  userId: string,
  eventType?: string,
  startDate?: Date
) {
  let query = supabase
    .from('usage_events')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  if (eventType) {
    query = query.eq('event_type', eventType)
  }
  if (startDate) {
    query = query.gte('created_at', startDate.toISOString())
  }

  const { data, error } = await query

  if (error) throw error
  return data
}

// ============================================================================
// SUBSCRIPTION HELPERS
// ============================================================================

export async function getActiveSubscription(supabase: SupabaseClientType, userId: string) {
  const { data, error } = await supabase
    .from('subscriptions')
    .select(`
      *,
      plan:plans(*)
    `)
    .eq('user_id', userId)
    .eq('status', 'active')
    .single()

  if (error) {
    if (error.code === 'PGRST116') {
      return null
    }
    throw error
  }
  return data
}

export async function listPlans(supabase: SupabaseClientType) {
  const { data, error } = await supabase
    .from('plans')
    .select('*')
    .eq('is_active', true)
    .order('price_monthly', { ascending: true })

  if (error) throw error
  return data
}

// ============================================================================
// SEARCH AND VECTOR OPERATIONS
// ============================================================================

export async function searchChunks(
  supabase: SupabaseClientType,
  embedding: number[],
  options?: {
    fileId?: string
    documentId?: string
    matchCount?: number
    matchThreshold?: number
  }
) {
  // Note: This requires a custom RPC function in Supabase
  const { data, error } = await supabase.rpc('match_chunks', {
    query_embedding: embedding,
    match_count: options?.matchCount || 5,
    match_threshold: options?.matchThreshold || 0.7,
    filter_file_id: options?.fileId,
    filter_document_id: options?.documentId,
  })

  if (error) {
    // If RPC doesn't exist, fall back to simple query
    console.warn('match_chunks RPC not found, using simple query')
    let query = supabase.from('chunks').select('*').limit(options?.matchCount || 5)

    if (options?.fileId) {
      query = query.eq('file_id', options.fileId)
    }
    if (options?.documentId) {
      query = query.eq('document_id', options.documentId)
    }

    const { data: fallbackData, error: fallbackError } = await query
    if (fallbackError) throw fallbackError
    return fallbackData
  }

  return data
}
