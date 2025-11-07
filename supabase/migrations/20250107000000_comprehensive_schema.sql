-- Comprehensive Academic Research Platform Schema
-- Created: 2025-01-07

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";

-- ============================================================================
-- CORE USER TABLES
-- ============================================================================

-- Update profiles table with more fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'tr'));
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS tokens_used INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS pages_analyzed INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS searches_made INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT UNIQUE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_status TEXT DEFAULT 'inactive';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS subscription_expires_at TIMESTAMPTZ;

-- Update user_settings to add MiniMax
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_ai_provider_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_ai_provider_check
    CHECK (ai_provider IN ('groq', 'openrouter', 'claude', 'openai', 'gemini', 'minimax'));

ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_provider_check;
ALTER TABLE api_keys ADD CONSTRAINT api_keys_provider_check
    CHECK (provider IN ('groq', 'openrouter', 'claude', 'openai', 'gemini', 'minimax', 'copyleaks', 'serpapi'));

-- ============================================================================
-- PROJECT AND DOCUMENT TABLES
-- ============================================================================

-- Projects for organizing work
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Documents (academic papers, blog posts, etc.)
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    document_type TEXT DEFAULT 'article' CHECK (document_type IN ('article', 'review', 'assignment', 'blog', 'book', 'thesis')),
    status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'in_progress', 'completed', 'archived')),
    language TEXT DEFAULT 'en' CHECK (language IN ('en', 'tr')),
    word_count INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- File uploads (PDFs, images, etc.)
CREATE TABLE IF NOT EXISTS files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    pages INTEGER,
    ocr_applied BOOLEAN DEFAULT false,
    hash TEXT,
    status TEXT DEFAULT 'uploaded' CHECK (status IN ('uploaded', 'processing', 'processed', 'error')),
    error_message TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- PDF content chunks with embeddings
CREATE TABLE IF NOT EXISTS chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE,
    page_number INTEGER,
    chunk_index INTEGER NOT NULL,
    content TEXT NOT NULL,
    embedding vector(1536),
    tokens INTEGER,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CHAT AND MESSAGING
-- ============================================================================

-- Chat sessions
CREATE TABLE IF NOT EXISTS chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    document_id UUID REFERENCES documents(id) ON DELETE SET NULL,
    title TEXT DEFAULT 'New Chat',
    context_files UUID[] DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Chat messages with citations
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID REFERENCES chats(id) ON DELETE CASCADE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations JSONB DEFAULT '[]',
    sources_used UUID[] DEFAULT '{}',
    tokens_used INTEGER DEFAULT 0,
    model_used TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ACADEMIC SOURCES AND CITATIONS
-- ============================================================================

-- Academic sources from APIs
CREATE TABLE IF NOT EXISTS sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doi TEXT UNIQUE,
    url TEXT,
    title TEXT NOT NULL,
    authors JSONB DEFAULT '[]',
    journal TEXT,
    year INTEGER,
    venue TEXT,
    abstract TEXT,
    pdf_url TEXT,
    citation_count INTEGER DEFAULT 0,
    source_type TEXT DEFAULT 'article' CHECK (source_type IN ('article', 'book', 'thesis', 'conference', 'preprint')),
    csl_json JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Link documents to sources
CREATE TABLE IF NOT EXISTS document_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE NOT NULL,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, source_id)
);

-- Citations in documents
CREATE TABLE IF NOT EXISTS citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID REFERENCES documents(id) ON DELETE CASCADE NOT NULL,
    source_id UUID REFERENCES sources(id) ON DELETE CASCADE NOT NULL,
    citation_style TEXT DEFAULT 'apa' CHECK (citation_style IN ('apa', 'mla', 'chicago', 'harvard', 'ieee', 'vancouver')),
    in_text TEXT NOT NULL,
    reference_text TEXT NOT NULL,
    page_number TEXT,
    location_in_doc TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PAYMENT AND SUBSCRIPTION TABLES
-- ============================================================================

-- Subscription plans
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    stripe_price_id_monthly TEXT,
    stripe_price_id_yearly TEXT,
    paypal_plan_id TEXT,
    iyzico_plan_id TEXT,
    limits JSONB DEFAULT '{}',
    features JSONB DEFAULT '[]',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- User subscriptions
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES plans(id) NOT NULL,
    payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'paypal', 'iyzico')),
    provider_subscription_id TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'canceled', 'expired', 'past_due', 'trialing')),
    billing_cycle TEXT DEFAULT 'monthly' CHECK (billing_cycle IN ('monthly', 'yearly')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Payment invoices
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    payment_provider TEXT NOT NULL CHECK (payment_provider IN ('stripe', 'paypal', 'iyzico')),
    provider_invoice_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'failed', 'refunded')),
    payment_method TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- Usage events for tracking
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    event_type TEXT NOT NULL CHECK (event_type IN ('tokens', 'pages', 'searches', 'plagiarism_check', 'ai_detection', 'export')),
    amount INTEGER NOT NULL,
    unit TEXT DEFAULT 'count',
    reference_id UUID,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- RATE LIMITING AND AUDIT
-- ============================================================================

-- Rate limits
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    endpoint TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    request_count INTEGER DEFAULT 0,
    reset_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, endpoint, window_start)
);

-- Audit logs
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT,
    entity_id UUID,
    changes JSONB,
    ip_address TEXT,
    user_agent TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ORGANIZATIONS AND TEAMS (Optional)
-- ============================================================================

CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    owner_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    plan_id UUID REFERENCES plans(id),
    billing_email TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS memberships (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role TEXT DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Projects
CREATE INDEX IF NOT EXISTS projects_user_id_idx ON projects(user_id);
CREATE INDEX IF NOT EXISTS projects_created_at_idx ON projects(created_at DESC);

-- Documents
CREATE INDEX IF NOT EXISTS documents_user_id_idx ON documents(user_id);
CREATE INDEX IF NOT EXISTS documents_project_id_idx ON documents(project_id);
CREATE INDEX IF NOT EXISTS documents_type_idx ON documents(document_type);
CREATE INDEX IF NOT EXISTS documents_status_idx ON documents(status);
CREATE INDEX IF NOT EXISTS documents_created_at_idx ON documents(created_at DESC);

-- Files
CREATE INDEX IF NOT EXISTS files_user_id_idx ON files(user_id);
CREATE INDEX IF NOT EXISTS files_document_id_idx ON files(document_id);
CREATE INDEX IF NOT EXISTS files_hash_idx ON files(hash);
CREATE INDEX IF NOT EXISTS files_status_idx ON files(status);

-- Chunks with vector similarity
CREATE INDEX IF NOT EXISTS chunks_file_id_idx ON chunks(file_id);
CREATE INDEX IF NOT EXISTS chunks_document_id_idx ON chunks(document_id);
CREATE INDEX IF NOT EXISTS chunks_embedding_idx ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Chats
CREATE INDEX IF NOT EXISTS chats_user_id_idx ON chats(user_id);
CREATE INDEX IF NOT EXISTS chats_document_id_idx ON chats(document_id);
CREATE INDEX IF NOT EXISTS chats_created_at_idx ON chats(created_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS messages_chat_id_idx ON messages(chat_id);
CREATE INDEX IF NOT EXISTS messages_created_at_idx ON messages(created_at);

-- Sources
CREATE INDEX IF NOT EXISTS sources_doi_idx ON sources(doi);
CREATE INDEX IF NOT EXISTS sources_title_idx ON sources USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS sources_year_idx ON sources(year);
CREATE INDEX IF NOT EXISTS sources_type_idx ON sources(source_type);

-- Citations
CREATE INDEX IF NOT EXISTS citations_document_id_idx ON citations(document_id);
CREATE INDEX IF NOT EXISTS citations_source_id_idx ON citations(source_id);

-- Subscriptions
CREATE INDEX IF NOT EXISTS subscriptions_user_id_idx ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS subscriptions_status_idx ON subscriptions(status);
CREATE INDEX IF NOT EXISTS subscriptions_period_end_idx ON subscriptions(current_period_end);

-- Invoices
CREATE INDEX IF NOT EXISTS invoices_user_id_idx ON invoices(user_id);
CREATE INDEX IF NOT EXISTS invoices_status_idx ON invoices(status);

-- Usage events
CREATE INDEX IF NOT EXISTS usage_events_user_id_idx ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS usage_events_type_idx ON usage_events(event_type);
CREATE INDEX IF NOT EXISTS usage_events_created_at_idx ON usage_events(created_at DESC);

-- Rate limits
CREATE INDEX IF NOT EXISTS rate_limits_user_id_endpoint_idx ON rate_limits(user_id, endpoint);
CREATE INDEX IF NOT EXISTS rate_limits_reset_at_idx ON rate_limits(reset_at);

-- Organizations
CREATE INDEX IF NOT EXISTS organizations_owner_id_idx ON organizations(owner_id);
CREATE INDEX IF NOT EXISTS memberships_org_id_idx ON memberships(organization_id);
CREATE INDEX IF NOT EXISTS memberships_user_id_idx ON memberships(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Projects
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Documents
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- Files
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own files" ON files FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own files" ON files FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own files" ON files FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own files" ON files FOR DELETE USING (auth.uid() = user_id);

-- Chunks
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view chunks from own files" ON chunks FOR SELECT
    USING (EXISTS (SELECT 1 FROM files WHERE files.id = chunks.file_id AND files.user_id = auth.uid()));
CREATE POLICY "Users can insert chunks to own files" ON chunks FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM files WHERE files.id = chunks.file_id AND files.user_id = auth.uid()));
CREATE POLICY "Users can delete chunks from own files" ON chunks FOR DELETE
    USING (EXISTS (SELECT 1 FROM files WHERE files.id = chunks.file_id AND files.user_id = auth.uid()));

-- Chats
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON chats FOR DELETE USING (auth.uid() = user_id);

-- Messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view messages from own chats" ON messages FOR SELECT
    USING (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()));
CREATE POLICY "Users can insert messages to own chats" ON messages FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid()));

-- Sources (public read, users can add)
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view sources" ON sources FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sources" ON sources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
CREATE POLICY "Authenticated users can update sources" ON sources FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Document sources
ALTER TABLE document_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own document sources" ON document_sources FOR SELECT
    USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_sources.document_id AND documents.user_id = auth.uid()));
CREATE POLICY "Users can add sources to own documents" ON document_sources FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_sources.document_id AND documents.user_id = auth.uid()));
CREATE POLICY "Users can delete sources from own documents" ON document_sources FOR DELETE
    USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = document_sources.document_id AND documents.user_id = auth.uid()));

-- Citations
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own citations" ON citations FOR SELECT
    USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = citations.document_id AND documents.user_id = auth.uid()));
CREATE POLICY "Users can insert own citations" ON citations FOR INSERT
    WITH CHECK (EXISTS (SELECT 1 FROM documents WHERE documents.id = citations.document_id AND documents.user_id = auth.uid()));
CREATE POLICY "Users can update own citations" ON citations FOR UPDATE
    USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = citations.document_id AND documents.user_id = auth.uid()));
CREATE POLICY "Users can delete own citations" ON citations FOR DELETE
    USING (EXISTS (SELECT 1 FROM documents WHERE documents.id = citations.document_id AND documents.user_id = auth.uid()));

-- Plans (public read)
ALTER TABLE plans ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view plans" ON plans FOR SELECT USING (is_active = true);

-- Subscriptions
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Invoices
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);

-- Usage events
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage" ON usage_events FOR SELECT USING (auth.uid() = user_id);

-- Rate limits
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own rate limits" ON rate_limits FOR SELECT USING (auth.uid() = user_id);

-- Audit logs (admin only in app layer)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Organizations
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view organization" ON organizations FOR SELECT
    USING (EXISTS (SELECT 1 FROM memberships WHERE memberships.organization_id = organizations.id AND memberships.user_id = auth.uid()));
CREATE POLICY "Owner can update organization" ON organizations FOR UPDATE USING (auth.uid() = owner_id);

-- Memberships
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Members can view memberships" ON memberships FOR SELECT
    USING (EXISTS (SELECT 1 FROM memberships m WHERE m.organization_id = memberships.organization_id AND m.user_id = auth.uid()));

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update timestamps
CREATE TRIGGER update_projects_updated_at
    BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_files_updated_at
    BEFORE UPDATE ON files FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chats_updated_at
    BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_sources_updated_at
    BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_citations_updated_at
    BEFORE UPDATE ON citations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_plans_updated_at
    BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at
    BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default plans
INSERT INTO plans (name, description, price_monthly, price_yearly, limits, features) VALUES
('Free', 'Basic features for individual users', 0, 0,
    '{"tokens": 50000, "pages": 20, "searches": 10, "plagiarism_checks": 0, "exports": 5}',
    '["Basic AI chat", "PDF upload (max 20 pages)", "10 searches/month", "Export to DOCX/PDF"]'
),
('Pro', 'Advanced features for professionals', 19.99, 199.99,
    '{"tokens": 1000000, "pages": 500, "searches": 500, "plagiarism_checks": 50, "exports": 1000}',
    '["Advanced AI models", "Unlimited PDFs", "Unlimited searches", "Plagiarism checking", "AI detection", "Priority support"]'
),
('Team', 'For research teams and organizations', 49.99, 499.99,
    '{"tokens": 5000000, "pages": 2000, "searches": 2000, "plagiarism_checks": 200, "exports": 5000}',
    '["All Pro features", "Team collaboration", "Shared projects", "Admin dashboard", "API access"]'
)
ON CONFLICT (name) DO NOTHING;
