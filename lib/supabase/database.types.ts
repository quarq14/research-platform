export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string
          avatar_url: string | null
          locale: string
          plan: string
          usage_counters: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          avatar_url?: string | null
          locale?: string
          plan?: string
          usage_counters?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          avatar_url?: string | null
          locale?: string
          plan?: string
          usage_counters?: Json
          created_at?: string
          updated_at?: string
        }
      }
      projects: {
        Row: {
          id: string
          user_id: string
          title: string
          description: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          description?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      documents: {
        Row: {
          id: string
          user_id: string
          project_id: string | null
          title: string
          content: string | null
          language: string
          source_type: string | null
          doc_type: string
          status: string
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          project_id?: string | null
          title: string
          content?: string | null
          language?: string
          source_type?: string | null
          doc_type?: string
          status?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          project_id?: string | null
          title?: string
          content?: string | null
          language?: string
          source_type?: string | null
          doc_type?: string
          status?: string
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      files: {
        Row: {
          id: string
          document_id: string
          storage_path: string
          filename: string
          mime_type: string
          size_bytes: number
          pages: number
          ocr_applied: boolean
          hash: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          storage_path: string
          filename: string
          mime_type: string
          size_bytes: number
          pages?: number
          ocr_applied?: boolean
          hash?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          storage_path?: string
          filename?: string
          mime_type?: string
          size_bytes?: number
          pages?: number
          ocr_applied?: boolean
          hash?: string | null
          created_at?: string
        }
      }
      chunks: {
        Row: {
          id: string
          document_id: string
          file_id: string | null
          page_number: number | null
          content: string
          tokens: number | null
          embedding: number[] | null
          citations_json: Json
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          file_id?: string | null
          page_number?: number | null
          content: string
          tokens?: number | null
          embedding?: number[] | null
          citations_json?: Json
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          file_id?: string | null
          page_number?: number | null
          content?: string
          tokens?: number | null
          embedding?: number[] | null
          citations_json?: Json
          metadata?: Json
          created_at?: string
        }
      }
      sources: {
        Row: {
          id: string
          doi: string | null
          url: string | null
          title: string
          authors_json: Json
          journal: string | null
          year: number | null
          venue: string | null
          abstract: string | null
          pdf_url: string | null
          csl_json: Json | null
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          doi?: string | null
          url?: string | null
          title: string
          authors_json?: Json
          journal?: string | null
          year?: number | null
          venue?: string | null
          abstract?: string | null
          pdf_url?: string | null
          csl_json?: Json | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          doi?: string | null
          url?: string | null
          title?: string
          authors_json?: Json
          journal?: string | null
          year?: number | null
          venue?: string | null
          abstract?: string | null
          pdf_url?: string | null
          csl_json?: Json | null
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      document_sources: {
        Row: {
          id: string
          document_id: string
          source_id: string
          added_by: string | null
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          source_id: string
          added_by?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          source_id?: string
          added_by?: string | null
          created_at?: string
        }
      }
      citations: {
        Row: {
          id: string
          document_id: string
          source_id: string | null
          style: string
          in_text: string
          reference: string
          page_number: number | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          document_id: string
          source_id?: string | null
          style?: string
          in_text: string
          reference: string
          page_number?: number | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          document_id?: string
          source_id?: string | null
          style?: string
          in_text?: string
          reference?: string
          page_number?: number | null
          metadata?: Json
          created_at?: string
        }
      }
      chats: {
        Row: {
          id: string
          user_id: string
          title: string
          document_ids: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          title?: string
          document_ids?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          title?: string
          document_ids?: string[]
          created_at?: string
          updated_at?: string
        }
      }
      messages: {
        Row: {
          id: string
          chat_id: string
          role: string
          content: string
          citations_json: Json
          tokens: number
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          chat_id: string
          role: string
          content: string
          citations_json?: Json
          tokens?: number
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          chat_id?: string
          role?: string
          content?: string
          citations_json?: Json
          tokens?: number
          metadata?: Json
          created_at?: string
        }
      }
      api_providers: {
        Row: {
          id: string
          name: string
          type: string
          enabled_default: boolean
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          type: string
          enabled_default?: boolean
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          type?: string
          enabled_default?: boolean
          metadata?: Json
          created_at?: string
        }
      }
      api_keys: {
        Row: {
          id: string
          user_id: string
          provider_id: string
          encrypted_key: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          provider_id: string
          encrypted_key: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          provider_id?: string
          encrypted_key?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      plans: {
        Row: {
          id: string
          name: string
          description: string | null
          limits_json: Json
          price_monthly: number | null
          price_yearly: number | null
          features: Json
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          limits_json?: Json
          price_monthly?: number | null
          price_yearly?: number | null
          features?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          limits_json?: Json
          price_monthly?: number | null
          price_yearly?: number | null
          features?: Json
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          paypal_subscription_id: string | null
          iyzico_subscription_id: string | null
          status: string
          current_period_start: string | null
          current_period_end: string | null
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          paypal_subscription_id?: string | null
          iyzico_subscription_id?: string | null
          status: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          stripe_subscription_id?: string | null
          stripe_customer_id?: string | null
          paypal_subscription_id?: string | null
          iyzico_subscription_id?: string | null
          status?: string
          current_period_start?: string | null
          current_period_end?: string | null
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      usage_events: {
        Row: {
          id: string
          user_id: string
          event_type: string
          amount: number
          unit: string | null
          ref_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          event_type: string
          amount?: number
          unit?: string | null
          ref_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          event_type?: string
          amount?: number
          unit?: string | null
          ref_id?: string | null
          metadata?: Json
          created_at?: string
        }
      }
      invoices: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          stripe_invoice_id: string | null
          paypal_order_id: string | null
          iyzico_payment_id: string | null
          amount: number
          currency: string
          status: string
          invoice_url: string | null
          created_at: string
          paid_at: string | null
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          stripe_invoice_id?: string | null
          paypal_order_id?: string | null
          iyzico_payment_id?: string | null
          amount: number
          currency?: string
          status: string
          invoice_url?: string | null
          created_at?: string
          paid_at?: string | null
        }
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          stripe_invoice_id?: string | null
          paypal_order_id?: string | null
          iyzico_payment_id?: string | null
          amount?: number
          currency?: string
          status?: string
          invoice_url?: string | null
          created_at?: string
          paid_at?: string | null
        }
      }
      rate_limits: {
        Row: {
          id: string
          user_id: string
          resource: string
          window_start: string
          window_end: string
          count: number
          limit_max: number
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          resource: string
          window_start: string
          window_end: string
          count?: number
          limit_max: number
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          resource?: string
          window_start?: string
          window_end?: string
          count?: number
          limit_max?: number
          created_at?: string
        }
      }
      audit_logs: {
        Row: {
          id: string
          user_id: string | null
          action: string
          entity_type: string
          entity_id: string | null
          metadata: Json
          ip_address: string | null
          user_agent: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          action: string
          entity_type: string
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          action?: string
          entity_type?: string
          entity_id?: string | null
          metadata?: Json
          ip_address?: string | null
          user_agent?: string | null
          created_at?: string
        }
      }
      feature_flags: {
        Row: {
          id: string
          name: string
          description: string | null
          is_enabled: boolean
          rollout_percentage: number
          metadata: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          is_enabled?: boolean
          rollout_percentage?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          is_enabled?: boolean
          rollout_percentage?: number
          metadata?: Json
          created_at?: string
          updated_at?: string
        }
      }
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          logo_url: string | null
          plan_id: string | null
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          logo_url?: string | null
          plan_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          logo_url?: string | null
          plan_id?: string | null
          settings?: Json
          created_at?: string
          updated_at?: string
        }
      }
      organization_members: {
        Row: {
          id: string
          organization_id: string
          user_id: string
          role: string
          invited_by: string | null
          joined_at: string
          created_at: string
        }
        Insert: {
          id?: string
          organization_id: string
          user_id: string
          role?: string
          invited_by?: string | null
          joined_at?: string
          created_at?: string
        }
        Update: {
          id?: string
          organization_id?: string
          user_id?: string
          role?: string
          invited_by?: string | null
          joined_at?: string
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      search_chunks: {
        Args: {
          query_embedding: number[]
          match_threshold?: number
          match_count?: number
          user_uuid?: string
        }
        Returns: {
          id: string
          document_id: string
          file_id: string | null
          page_number: number | null
          content: string
          similarity: number
        }[]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
