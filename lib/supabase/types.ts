/**
 * Database Types
 * Auto-generated TypeScript types for Supabase tables
 * Based on comprehensive schema migration
 */

// ============================================================================
// ENUMS
// ============================================================================

export type AIProvider = 'groq' | 'openrouter' | 'claude' | 'openai' | 'gemini' | 'minimax'
export type APIKeyProvider = AIProvider | 'copyleaks' | 'serpapi'
export type Locale = 'en' | 'tr'
export type DocumentType = 'article' | 'review' | 'assignment' | 'blog' | 'book' | 'thesis'
export type DocumentStatus = 'draft' | 'in_progress' | 'completed' | 'archived'
export type FileStatus = 'uploaded' | 'processing' | 'processed' | 'error'
export type MessageRole = 'user' | 'assistant' | 'system'
export type SourceType = 'article' | 'book' | 'thesis' | 'conference' | 'preprint'
export type CitationStyle = 'apa' | 'mla' | 'chicago' | 'harvard' | 'ieee' | 'vancouver'
export type PaymentProvider = 'stripe' | 'paypal' | 'iyzico'
export type SubscriptionStatus = 'active' | 'canceled' | 'expired' | 'past_due' | 'trialing'
export type BillingCycle = 'monthly' | 'yearly'
export type InvoiceStatus = 'pending' | 'paid' | 'failed' | 'refunded'
export type UsageEventType = 'tokens' | 'pages' | 'searches' | 'plagiarism_check' | 'ai_detection' | 'export'
export type OrganizationRole = 'owner' | 'admin' | 'member' | 'viewer'

// ============================================================================
// CORE USER TABLES
// ============================================================================

export interface Profile {
  id: string
  name: string | null
  locale: Locale
  plan: string
  created_at: string
  updated_at: string
  word_count_used: number
  documents_used: number
  pages_uploaded: number
  searches_used: number
  tokens_used: number
  pages_analyzed: number
  searches_made: number
  stripe_customer_id: string | null
  subscription_status: string
  subscription_expires_at: string | null
}

export interface UserSettings {
  id: string
  user_id: string
  ai_provider: AIProvider
  ai_model: string | null
  created_at: string
  updated_at: string
}

export interface APIKey {
  id: string
  user_id: string
  provider: APIKeyProvider
  encrypted_key: string
  is_active: boolean
  created_at: string
  updated_at: string
}

// ============================================================================
// PROJECT AND DOCUMENT TABLES
// ============================================================================

export interface Project {
  id: string
  user_id: string
  title: string
  description: string | null
  created_at: string
  updated_at: string
}

export interface Document {
  id: string
  user_id: string
  project_id: string | null
  title: string
  content: string | null
  document_type: DocumentType
  status: DocumentStatus
  language: Locale
  word_count: number
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface File {
  id: string
  user_id: string
  document_id: string | null
  storage_path: string
  filename: string
  mime_type: string
  size_bytes: number
  pages: number | null
  ocr_applied: boolean
  hash: string | null
  status: FileStatus
  error_message: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Chunk {
  id: string
  file_id: string
  document_id: string | null
  page_number: number | null
  chunk_index: number
  content: string
  embedding: number[] | null
  tokens: number | null
  metadata: Record<string, any>
  created_at: string
}

// ============================================================================
// CHAT AND MESSAGING
// ============================================================================

export interface Chat {
  id: string
  user_id: string
  document_id: string | null
  title: string
  context_files: string[]
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Message {
  id: string
  chat_id: string
  role: MessageRole
  content: string
  citations: any[]
  sources_used: string[]
  tokens_used: number
  model_used: string | null
  metadata: Record<string, any>
  created_at: string
}

// ============================================================================
// ACADEMIC SOURCES AND CITATIONS
// ============================================================================

export interface Source {
  id: string
  doi: string | null
  url: string | null
  title: string
  authors: any[]
  journal: string | null
  year: number | null
  venue: string | null
  abstract: string | null
  pdf_url: string | null
  citation_count: number
  source_type: SourceType
  csl_json: Record<string, any> | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface DocumentSource {
  id: string
  document_id: string
  source_id: string
  added_by: string | null
  created_at: string
}

export interface Citation {
  id: string
  document_id: string
  source_id: string
  citation_style: CitationStyle
  in_text: string
  reference_text: string
  page_number: string | null
  location_in_doc: string | null
  created_at: string
  updated_at: string
}

// ============================================================================
// PAYMENT AND SUBSCRIPTION TABLES
// ============================================================================

export interface Plan {
  id: string
  name: string
  description: string | null
  price_monthly: number | null
  price_yearly: number | null
  stripe_price_id_monthly: string | null
  stripe_price_id_yearly: string | null
  paypal_plan_id: string | null
  iyzico_plan_id: string | null
  limits: Record<string, any>
  features: string[]
  is_active: boolean
  created_at: string
  updated_at: string
}

export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  payment_provider: PaymentProvider
  provider_subscription_id: string | null
  status: SubscriptionStatus
  billing_cycle: BillingCycle
  current_period_start: string | null
  current_period_end: string | null
  cancel_at_period_end: boolean
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Invoice {
  id: string
  user_id: string
  subscription_id: string | null
  payment_provider: PaymentProvider
  provider_invoice_id: string | null
  amount: number
  currency: string
  status: InvoiceStatus
  payment_method: string | null
  metadata: Record<string, any>
  created_at: string
  paid_at: string | null
}

export interface UsageEvent {
  id: string
  user_id: string
  event_type: UsageEventType
  amount: number
  unit: string
  reference_id: string | null
  metadata: Record<string, any>
  created_at: string
}

// ============================================================================
// RATE LIMITING AND AUDIT
// ============================================================================

export interface RateLimit {
  id: string
  user_id: string
  endpoint: string
  window_start: string
  request_count: number
  reset_at: string
  created_at: string
}

export interface AuditLog {
  id: string
  user_id: string | null
  action: string
  entity_type: string | null
  entity_id: string | null
  changes: Record<string, any> | null
  ip_address: string | null
  user_agent: string | null
  metadata: Record<string, any>
  created_at: string
}

// ============================================================================
// ORGANIZATIONS AND TEAMS
// ============================================================================

export interface Organization {
  id: string
  name: string
  owner_id: string
  plan_id: string | null
  billing_email: string | null
  metadata: Record<string, any>
  created_at: string
  updated_at: string
}

export interface Membership {
  id: string
  organization_id: string
  user_id: string
  role: OrganizationRole
  invited_by: string | null
  joined_at: string
  created_at: string
}

// ============================================================================
// DATABASE TYPE
// ============================================================================

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: Profile
        Insert: Omit<Profile, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Profile, 'id' | 'created_at' | 'updated_at'>>
      }
      user_settings: {
        Row: UserSettings
        Insert: Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<UserSettings, 'id' | 'created_at' | 'updated_at'>>
      }
      api_keys: {
        Row: APIKey
        Insert: Omit<APIKey, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<APIKey, 'id' | 'created_at' | 'updated_at'>>
      }
      projects: {
        Row: Project
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Project, 'id' | 'created_at' | 'updated_at'>>
      }
      documents: {
        Row: Document
        Insert: Omit<Document, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Document, 'id' | 'created_at' | 'updated_at'>>
      }
      files: {
        Row: File
        Insert: Omit<File, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<File, 'id' | 'created_at' | 'updated_at'>>
      }
      chunks: {
        Row: Chunk
        Insert: Omit<Chunk, 'id' | 'created_at'>
        Update: Partial<Omit<Chunk, 'id' | 'created_at'>>
      }
      chats: {
        Row: Chat
        Insert: Omit<Chat, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Chat, 'id' | 'created_at' | 'updated_at'>>
      }
      messages: {
        Row: Message
        Insert: Omit<Message, 'id' | 'created_at'>
        Update: Partial<Omit<Message, 'id' | 'created_at'>>
      }
      sources: {
        Row: Source
        Insert: Omit<Source, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Source, 'id' | 'created_at' | 'updated_at'>>
      }
      document_sources: {
        Row: DocumentSource
        Insert: Omit<DocumentSource, 'id' | 'created_at'>
        Update: Partial<Omit<DocumentSource, 'id' | 'created_at'>>
      }
      citations: {
        Row: Citation
        Insert: Omit<Citation, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Citation, 'id' | 'created_at' | 'updated_at'>>
      }
      plans: {
        Row: Plan
        Insert: Omit<Plan, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Plan, 'id' | 'created_at' | 'updated_at'>>
      }
      subscriptions: {
        Row: Subscription
        Insert: Omit<Subscription, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Subscription, 'id' | 'created_at' | 'updated_at'>>
      }
      invoices: {
        Row: Invoice
        Insert: Omit<Invoice, 'id' | 'created_at'>
        Update: Partial<Omit<Invoice, 'id' | 'created_at'>>
      }
      usage_events: {
        Row: UsageEvent
        Insert: Omit<UsageEvent, 'id' | 'created_at'>
        Update: Partial<Omit<UsageEvent, 'id' | 'created_at'>>
      }
      rate_limits: {
        Row: RateLimit
        Insert: Omit<RateLimit, 'id' | 'created_at'>
        Update: Partial<Omit<RateLimit, 'id' | 'created_at'>>
      }
      audit_logs: {
        Row: AuditLog
        Insert: Omit<AuditLog, 'id' | 'created_at'>
        Update: Partial<Omit<AuditLog, 'id' | 'created_at'>>
      }
      organizations: {
        Row: Organization
        Insert: Omit<Organization, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Organization, 'id' | 'created_at' | 'updated_at'>>
      }
      memberships: {
        Row: Membership
        Insert: Omit<Membership, 'id' | 'created_at'>
        Update: Partial<Omit<Membership, 'id' | 'created_at'>>
      }
    }
  }
}
