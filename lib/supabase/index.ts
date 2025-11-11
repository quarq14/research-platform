/**
 * Supabase Module
 * Export all Supabase utilities
 */

// Client exports
export { createClient as createBrowserClient, isSupabaseConfigured } from './client'
export { createClient as createServerClient, createServerClient as createServer } from './server'
export { updateSession } from './middleware'

// Type exports
export type * from './types'

// Helper exports
export * from './helpers'
