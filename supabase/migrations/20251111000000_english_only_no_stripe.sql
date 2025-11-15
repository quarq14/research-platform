-- Migration: English-only, remove Stripe, keep PayPal and iyzico
-- Date: 2025-11-11

-- ============================================================================
-- REMOVE TURKISH LOCALE SUPPORT
-- ============================================================================

-- Update profiles table - remove Turkish locale option
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS profiles_locale_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_locale_check CHECK (locale = 'en');
ALTER TABLE profiles ALTER COLUMN locale SET DEFAULT 'en';
UPDATE profiles SET locale = 'en' WHERE locale = 'tr';

-- Update documents table - remove Turkish language option
ALTER TABLE documents DROP CONSTRAINT IF EXISTS documents_language_check;
ALTER TABLE documents ADD CONSTRAINT documents_language_check CHECK (language = 'en');
ALTER TABLE documents ALTER COLUMN language SET DEFAULT 'en';
UPDATE documents SET language = 'en' WHERE language = 'tr';

-- ============================================================================
-- REMOVE STRIPE, KEEP PAYPAL AND IYZICO ONLY
-- ============================================================================

-- Remove Stripe-specific fields from profiles
ALTER TABLE profiles DROP COLUMN IF EXISTS stripe_customer_id;

-- Remove Stripe-specific fields from plans
ALTER TABLE plans DROP COLUMN IF EXISTS stripe_price_id_monthly;
ALTER TABLE plans DROP COLUMN IF EXISTS stripe_price_id_yearly;

-- Update payment_provider constraint to exclude Stripe
ALTER TABLE subscriptions DROP CONSTRAINT IF EXISTS subscriptions_payment_provider_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_payment_provider_check
    CHECK (payment_provider IN ('paypal', 'iyzico'));

ALTER TABLE invoices DROP CONSTRAINT IF EXISTS invoices_payment_provider_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_provider_check
    CHECK (payment_provider IN ('paypal', 'iyzico'));

-- ============================================================================
-- ADD MISSING TABLES FOR WEBHOOKS
-- ============================================================================

-- Webhook events log
CREATE TABLE IF NOT EXISTS webhook_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider TEXT NOT NULL CHECK (provider IN ('paypal', 'iyzico')),
    event_type TEXT NOT NULL,
    event_id TEXT,
    payload JSONB NOT NULL,
    processed BOOLEAN DEFAULT false,
    processed_at TIMESTAMPTZ,
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS webhook_events_provider_idx ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS webhook_events_processed_idx ON webhook_events(processed);
CREATE INDEX IF NOT EXISTS webhook_events_created_at_idx ON webhook_events(created_at DESC);

-- ============================================================================
-- ADD MAGIC LINK SUPPORT (Already supported by Supabase Auth)
-- ============================================================================

-- Passwordless authentication is handled by Supabase Auth
-- No additional tables needed

-- ============================================================================
-- ENHANCE CHUNKS TABLE FOR BETTER RAG
-- ============================================================================

-- Add full-text search column for hybrid retrieval
ALTER TABLE chunks ADD COLUMN IF NOT EXISTS tsv tsvector;
CREATE INDEX IF NOT EXISTS chunks_tsv_idx ON chunks USING gin(tsv);

-- Create trigger to update tsvector
CREATE OR REPLACE FUNCTION chunks_tsv_trigger() RETURNS trigger AS $$
BEGIN
    NEW.tsv := to_tsvector('english', COALESCE(NEW.content, ''));
    RETURN NEW;
END
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS chunks_tsv_update ON chunks;
CREATE TRIGGER chunks_tsv_update BEFORE INSERT OR UPDATE ON chunks
    FOR EACH ROW EXECUTE FUNCTION chunks_tsv_trigger();

-- Update existing rows
UPDATE chunks SET tsv = to_tsvector('english', COALESCE(content, ''));

-- ============================================================================
-- ADD DRAFTS AND SECTIONS TABLES FOR WRITING WORKSPACE
-- ============================================================================

-- Drafts table for academic writing
CREATE TABLE IF NOT EXISTS drafts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL DEFAULT 'Untitled Draft',
    document_type TEXT DEFAULT 'article' CHECK (document_type IN ('article', 'review', 'assignment', 'blog', 'book', 'thesis')),
    outline JSONB DEFAULT '[]',
    citation_style TEXT DEFAULT 'apa' CHECK (citation_style IN ('apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver')),
    target_words INTEGER,
    current_words INTEGER DEFAULT 0,
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sections within drafts
CREATE TABLE IF NOT EXISTS sections (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    draft_id UUID REFERENCES drafts(id) ON DELETE CASCADE NOT NULL,
    order_index INTEGER NOT NULL,
    title TEXT NOT NULL,
    content TEXT DEFAULT '',
    citations JSONB DEFAULT '[]',
    sources_used UUID[] DEFAULT '{}',
    word_count INTEGER DEFAULT 0,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'drafting', 'completed', 'needs_revision')),
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(draft_id, order_index)
);

-- Indexes for drafts
CREATE INDEX IF NOT EXISTS drafts_user_id_idx ON drafts(user_id);
CREATE INDEX IF NOT EXISTS drafts_project_id_idx ON drafts(project_id);
CREATE INDEX IF NOT EXISTS drafts_status_idx ON drafts(status);
CREATE INDEX IF NOT EXISTS drafts_created_at_idx ON drafts(created_at DESC);

-- Indexes for sections
CREATE INDEX IF NOT EXISTS sections_draft_id_idx ON sections(draft_id);
CREATE INDEX IF NOT EXISTS sections_order_idx ON sections(draft_id, order_index);

-- RLS for drafts
ALTER TABLE drafts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own drafts" ON drafts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own drafts" ON drafts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own drafts" ON drafts FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own drafts" ON drafts FOR DELETE USING (auth.uid() = user_id);

-- RLS for sections
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view sections from own drafts" ON sections FOR SELECT
    USING (EXISTS (SELECT 1 FROM drafts WHERE drafts.id = sections.draft_id AND drafts.user_id = auth.uid()));
CREATE POLICY "Users can insert sections to own drafts" ON sections FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM drafts WHERE drafts.id = sections.draft_id AND drafts.user_id = auth.uid()));
CREATE POLICY "Users can update sections in own drafts" ON sections FOR UPDATE
    USING (EXISTS (SELECT 1 FROM drafts WHERE drafts.id = sections.draft_id AND drafts.user_id = auth.uid()));
CREATE POLICY "Users can delete sections from own drafts" ON sections FOR DELETE
    USING (EXISTS (SELECT 1 FROM drafts WHERE drafts.id = sections.draft_id AND drafts.user_id = auth.uid()));

-- Triggers for updated_at
CREATE TRIGGER update_drafts_updated_at
    BEFORE UPDATE ON drafts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sections_updated_at
    BEFORE UPDATE ON sections FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- UPDATE PLANS WITH ENGLISH-ONLY PRICING
-- ============================================================================

-- Update existing plans to remove Stripe references and set proper limits
UPDATE plans SET
    limits = '{"tokens": 50000, "pages": 20, "searches": 10, "plagiarism_checks": 0, "exports": 5, "drafts": 3}'::jsonb,
    features = '["Basic AI chat", "PDF upload (max 20 pages)", "10 searches/month", "Export to DOCX/PDF", "3 drafts"]'::jsonb
WHERE name = 'Free';

UPDATE plans SET
    limits = '{"tokens": 1000000, "pages": 500, "searches": 500, "plagiarism_checks": 50, "exports": 1000, "drafts": 100}'::jsonb,
    features = '["Advanced AI models", "Unlimited PDFs", "Unlimited searches", "Plagiarism checking", "AI detection", "Priority support", "100 drafts"]'::jsonb
WHERE name = 'Pro';

UPDATE plans SET
    limits = '{"tokens": 5000000, "pages": 2000, "searches": 2000, "plagiarism_checks": 200, "exports": 5000, "drafts": -1}'::jsonb,
    features = '["All Pro features", "Team collaboration", "Shared projects", "Admin dashboard", "API access", "Unlimited drafts"]'::jsonb
WHERE name = 'Team';
