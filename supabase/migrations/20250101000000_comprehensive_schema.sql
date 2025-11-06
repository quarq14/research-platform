-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "vector";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================================
-- PROFILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE NOT NULL,
    avatar_url TEXT,
    locale TEXT DEFAULT 'en' CHECK (locale IN ('en', 'tr')),
    plan TEXT DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
    usage_counters JSONB DEFAULT '{
        "tokens_used": 0,
        "pages_processed": 0,
        "searches_made": 0,
        "plagiarism_checks": 0,
        "ai_detections": 0,
        "documents_created": 0
    }'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- PROJECTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS projects (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DOCUMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    project_id UUID REFERENCES projects(id) ON DELETE SET NULL,
    title TEXT NOT NULL,
    content TEXT,
    language TEXT DEFAULT 'en',
    source_type TEXT CHECK (source_type IN ('upload', 'draft', 'search')),
    doc_type TEXT CHECK (doc_type IN ('article', 'review', 'assignment', 'blog')) DEFAULT 'article',
    status TEXT CHECK (status IN ('draft', 'published', 'archived')) DEFAULT 'draft',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FILES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    pages INTEGER DEFAULT 0,
    ocr_applied BOOLEAN DEFAULT FALSE,
    hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CHUNKS TABLE (for RAG)
-- ============================================================================
CREATE TABLE IF NOT EXISTS chunks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    file_id UUID REFERENCES files(id) ON DELETE CASCADE,
    page_number INTEGER,
    content TEXT NOT NULL,
    tokens INTEGER,
    embedding VECTOR(1536),
    citations_json JSONB DEFAULT '[]'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SOURCES TABLE (scholarly sources)
-- ============================================================================
CREATE TABLE IF NOT EXISTS sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doi TEXT UNIQUE,
    url TEXT,
    title TEXT NOT NULL,
    authors_json JSONB DEFAULT '[]'::jsonb,
    journal TEXT,
    year INTEGER,
    venue TEXT,
    abstract TEXT,
    pdf_url TEXT,
    csl_json JSONB,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- DOCUMENT_SOURCES (junction table)
-- ============================================================================
CREATE TABLE IF NOT EXISTS document_sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    source_id UUID NOT NULL REFERENCES sources(id) ON DELETE CASCADE,
    added_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(document_id, source_id)
);

-- ============================================================================
-- CITATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    style TEXT DEFAULT 'apa' CHECK (style IN ('apa', 'mla', 'chicago', 'ieee', 'harvard')),
    in_text TEXT NOT NULL,
    reference TEXT NOT NULL,
    page_number INTEGER,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- CHATS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS chats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'New Chat',
    document_ids UUID[] DEFAULT ARRAY[]::UUID[],
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- MESSAGES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS messages (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    chat_id UUID NOT NULL REFERENCES chats(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content TEXT NOT NULL,
    citations_json JSONB DEFAULT '[]'::jsonb,
    tokens INTEGER DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- API_PROVIDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL CHECK (type IN ('llm', 'embedding', 'search', 'plagiarism', 'ai_detection', 'payment')),
    enabled_default BOOLEAN DEFAULT FALSE,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- API_KEYS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    provider_id UUID NOT NULL REFERENCES api_providers(id) ON DELETE CASCADE,
    encrypted_key TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider_id)
);

-- ============================================================================
-- PLANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS plans (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    limits_json JSONB DEFAULT '{}'::jsonb,
    price_monthly DECIMAL(10,2),
    price_yearly DECIMAL(10,2),
    features JSONB DEFAULT '[]'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SUBSCRIPTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS subscriptions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    plan_id UUID NOT NULL REFERENCES plans(id) ON DELETE RESTRICT,
    stripe_subscription_id TEXT UNIQUE,
    stripe_customer_id TEXT,
    paypal_subscription_id TEXT UNIQUE,
    iyzico_subscription_id TEXT UNIQUE,
    status TEXT NOT NULL CHECK (status IN ('active', 'canceled', 'past_due', 'trialing', 'unpaid')),
    current_period_start TIMESTAMPTZ,
    current_period_end TIMESTAMPTZ,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- USAGE_EVENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS usage_events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    event_type TEXT NOT NULL CHECK (event_type IN (
        'token_usage', 'page_processed', 'search', 'plagiarism_check',
        'ai_detection', 'export', 'document_created'
    )),
    amount INTEGER NOT NULL DEFAULT 1,
    unit TEXT,
    ref_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    subscription_id UUID REFERENCES subscriptions(id) ON DELETE SET NULL,
    stripe_invoice_id TEXT UNIQUE,
    paypal_order_id TEXT,
    iyzico_payment_id TEXT,
    amount DECIMAL(10,2) NOT NULL,
    currency TEXT DEFAULT 'USD',
    status TEXT NOT NULL CHECK (status IN ('draft', 'open', 'paid', 'void', 'uncollectible')),
    invoice_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    paid_at TIMESTAMPTZ
);

-- ============================================================================
-- RATE_LIMITS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS rate_limits (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    resource TEXT NOT NULL,
    window_start TIMESTAMPTZ NOT NULL,
    window_end TIMESTAMPTZ NOT NULL,
    count INTEGER NOT NULL DEFAULT 0,
    limit_max INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, resource, window_start)
);

-- ============================================================================
-- AUDIT_LOGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id UUID,
    metadata JSONB DEFAULT '{}'::jsonb,
    ip_address INET,
    user_agent TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- FEATURE_FLAGS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS feature_flags (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    is_enabled BOOLEAN DEFAULT FALSE,
    rollout_percentage INTEGER DEFAULT 0 CHECK (rollout_percentage BETWEEN 0 AND 100),
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ORGANIZATIONS TABLE (for teams)
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    description TEXT,
    logo_url TEXT,
    plan_id UUID REFERENCES plans(id) ON DELETE SET NULL,
    settings JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- ORGANIZATION_MEMBERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS organization_members (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('owner', 'admin', 'member')) DEFAULT 'member',
    invited_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    joined_at TIMESTAMPTZ DEFAULT NOW(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(organization_id, user_id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Profiles
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_plan ON profiles(plan);

-- Projects
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
CREATE INDEX IF NOT EXISTS idx_projects_created_at ON projects(created_at DESC);

-- Documents
CREATE INDEX IF NOT EXISTS idx_documents_user_id ON documents(user_id);
CREATE INDEX IF NOT EXISTS idx_documents_project_id ON documents(project_id);
CREATE INDEX IF NOT EXISTS idx_documents_status ON documents(status);
CREATE INDEX IF NOT EXISTS idx_documents_created_at ON documents(created_at DESC);

-- Files
CREATE INDEX IF NOT EXISTS idx_files_document_id ON files(document_id);
CREATE INDEX IF NOT EXISTS idx_files_hash ON files(hash);

-- Chunks (with vector index)
CREATE INDEX IF NOT EXISTS idx_chunks_document_id ON chunks(document_id);
CREATE INDEX IF NOT EXISTS idx_chunks_file_id ON chunks(file_id);
CREATE INDEX IF NOT EXISTS idx_chunks_embedding ON chunks USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- Full-text search on chunks
CREATE INDEX IF NOT EXISTS idx_chunks_content_fts ON chunks USING gin(to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_chunks_content_trgm ON chunks USING gin(content gin_trgm_ops);

-- Sources
CREATE INDEX IF NOT EXISTS idx_sources_doi ON sources(doi);
CREATE INDEX IF NOT EXISTS idx_sources_title ON sources(title);
CREATE INDEX IF NOT EXISTS idx_sources_year ON sources(year DESC);

-- Document Sources
CREATE INDEX IF NOT EXISTS idx_document_sources_document_id ON document_sources(document_id);
CREATE INDEX IF NOT EXISTS idx_document_sources_source_id ON document_sources(source_id);

-- Citations
CREATE INDEX IF NOT EXISTS idx_citations_document_id ON citations(document_id);
CREATE INDEX IF NOT EXISTS idx_citations_source_id ON citations(source_id);

-- Chats
CREATE INDEX IF NOT EXISTS idx_chats_user_id ON chats(user_id);
CREATE INDEX IF NOT EXISTS idx_chats_created_at ON chats(created_at DESC);

-- Messages
CREATE INDEX IF NOT EXISTS idx_messages_chat_id ON messages(chat_id);
CREATE INDEX IF NOT EXISTS idx_messages_created_at ON messages(created_at);

-- API Keys
CREATE INDEX IF NOT EXISTS idx_api_keys_user_id ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_provider_id ON api_keys(provider_id);

-- Subscriptions
CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_subscriptions_stripe_customer_id ON subscriptions(stripe_customer_id);

-- Usage Events
CREATE INDEX IF NOT EXISTS idx_usage_events_user_id ON usage_events(user_id);
CREATE INDEX IF NOT EXISTS idx_usage_events_created_at ON usage_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_usage_events_type ON usage_events(event_type);

-- Invoices
CREATE INDEX IF NOT EXISTS idx_invoices_user_id ON invoices(user_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription_id ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);

-- Rate Limits
CREATE INDEX IF NOT EXISTS idx_rate_limits_user_resource ON rate_limits(user_id, resource);
CREATE INDEX IF NOT EXISTS idx_rate_limits_window ON rate_limits(window_end);

-- Audit Logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- Organizations
CREATE INDEX IF NOT EXISTS idx_organizations_slug ON organizations(slug);

-- Organization Members
CREATE INDEX IF NOT EXISTS idx_org_members_org_id ON organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user_id ON organization_members(user_id);

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE files ENABLE ROW LEVEL SECURITY;
ALTER TABLE chunks ENABLE ROW LEVEL SECURITY;
ALTER TABLE sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE citations ENABLE ROW LEVEL SECURITY;
ALTER TABLE chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;

-- Profiles policies
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Projects policies
CREATE POLICY "Users can view own projects" ON projects FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own projects" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own projects" ON projects FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own projects" ON projects FOR DELETE USING (auth.uid() = user_id);

-- Documents policies
CREATE POLICY "Users can view own documents" ON documents FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own documents" ON documents FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own documents" ON documents FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own documents" ON documents FOR DELETE USING (auth.uid() = user_id);

-- Files policies
CREATE POLICY "Users can view own files" ON files FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = files.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "Users can insert own files" ON files FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = files.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "Users can delete own files" ON files FOR DELETE USING (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = files.document_id AND documents.user_id = auth.uid())
);

-- Chunks policies
CREATE POLICY "Users can view own chunks" ON chunks FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = chunks.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "Users can insert own chunks" ON chunks FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = chunks.document_id AND documents.user_id = auth.uid())
);

-- Sources policies (public read, authenticated write)
CREATE POLICY "Anyone can view sources" ON sources FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert sources" ON sources FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Document Sources policies
CREATE POLICY "Users can view own document sources" ON document_sources FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = document_sources.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "Users can insert own document sources" ON document_sources FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = document_sources.document_id AND documents.user_id = auth.uid())
);

-- Citations policies
CREATE POLICY "Users can view own citations" ON citations FOR SELECT USING (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = citations.document_id AND documents.user_id = auth.uid())
);
CREATE POLICY "Users can insert own citations" ON citations FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM documents WHERE documents.id = citations.document_id AND documents.user_id = auth.uid())
);

-- Chats policies
CREATE POLICY "Users can view own chats" ON chats FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chats" ON chats FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chats" ON chats FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chats" ON chats FOR DELETE USING (auth.uid() = user_id);

-- Messages policies
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
);
CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM chats WHERE chats.id = messages.chat_id AND chats.user_id = auth.uid())
);

-- API Keys policies
CREATE POLICY "Users can view own api keys" ON api_keys FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own api keys" ON api_keys FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own api keys" ON api_keys FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own api keys" ON api_keys FOR DELETE USING (auth.uid() = user_id);

-- Subscriptions policies
CREATE POLICY "Users can view own subscriptions" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own subscriptions" ON subscriptions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Usage Events policies
CREATE POLICY "Users can view own usage events" ON usage_events FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own usage events" ON usage_events FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Invoices policies
CREATE POLICY "Users can view own invoices" ON invoices FOR SELECT USING (auth.uid() = user_id);

-- Rate Limits policies
CREATE POLICY "Users can view own rate limits" ON rate_limits FOR SELECT USING (auth.uid() = user_id);

-- Audit Logs policies
CREATE POLICY "Users can view own audit logs" ON audit_logs FOR SELECT USING (auth.uid() = user_id);

-- Organizations policies
CREATE POLICY "Members can view own organizations" ON organizations FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members WHERE organization_members.organization_id = organizations.id AND organization_members.user_id = auth.uid())
);

-- Organization Members policies
CREATE POLICY "Members can view org members" ON organization_members FOR SELECT USING (
    EXISTS (SELECT 1 FROM organization_members om WHERE om.organization_id = organization_members.organization_id AND om.user_id = auth.uid())
);

-- ============================================================================
-- FUNCTIONS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_documents_updated_at BEFORE UPDATE ON documents FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_sources_updated_at BEFORE UPDATE ON sources FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_chats_updated_at BEFORE UPDATE ON chats FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_plans_updated_at BEFORE UPDATE ON plans FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_subscriptions_updated_at BEFORE UPDATE ON subscriptions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_feature_flags_updated_at BEFORE UPDATE ON feature_flags FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.profiles (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', NEW.email)
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to create profile on signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function for hybrid search (vector + full-text)
CREATE OR REPLACE FUNCTION search_chunks(
    query_embedding VECTOR(1536),
    match_threshold FLOAT DEFAULT 0.7,
    match_count INT DEFAULT 10,
    user_uuid UUID DEFAULT NULL
)
RETURNS TABLE (
    id UUID,
    document_id UUID,
    file_id UUID,
    page_number INT,
    content TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        c.id,
        c.document_id,
        c.file_id,
        c.page_number,
        c.content,
        1 - (c.embedding <=> query_embedding) AS similarity
    FROM chunks c
    INNER JOIN documents d ON c.document_id = d.id
    WHERE (user_uuid IS NULL OR d.user_id = user_uuid)
      AND 1 - (c.embedding <=> query_embedding) > match_threshold
    ORDER BY c.embedding <=> query_embedding
    LIMIT match_count;
END;
$$ LANGUAGE plpgsql;

-- ============================================================================
-- SEED DATA
-- ============================================================================

-- Insert default plans
INSERT INTO plans (name, description, limits_json, price_monthly, price_yearly, features, is_active) VALUES
('free', 'Free Plan', '{
    "tokens_per_month": 100000,
    "pages_per_month": 50,
    "searches_per_month": 20,
    "plagiarism_checks_per_month": 2,
    "ai_detections_per_month": 5,
    "max_documents": 10,
    "max_file_size_mb": 10,
    "max_files_per_upload": 3
}'::jsonb, 0.00, 0.00, '["Basic PDF chat", "Limited searches", "Citation management", "Export to DOCX/PDF"]'::jsonb, true),
('pro', 'Professional Plan', '{
    "tokens_per_month": 1000000,
    "pages_per_month": 500,
    "searches_per_month": 200,
    "plagiarism_checks_per_month": 20,
    "ai_detections_per_month": 50,
    "max_documents": 100,
    "max_file_size_mb": 50,
    "max_files_per_upload": 20
}'::jsonb, 19.99, 199.00, '["Unlimited PDF chat", "Advanced search", "Priority support", "Plagiarism checking", "AI detection", "Team collaboration", "Export to all formats"]'::jsonb, true),
('enterprise', 'Enterprise Plan', '{
    "tokens_per_month": -1,
    "pages_per_month": -1,
    "searches_per_month": -1,
    "plagiarism_checks_per_month": -1,
    "ai_detections_per_month": -1,
    "max_documents": -1,
    "max_file_size_mb": 100,
    "max_files_per_upload": 100
}'::jsonb, 99.99, 999.00, '["Unlimited everything", "Dedicated support", "Custom integrations", "SSO", "Advanced analytics", "White-label options"]'::jsonb, true)
ON CONFLICT (name) DO NOTHING;

-- Insert default API providers
INSERT INTO api_providers (name, type, enabled_default, metadata) VALUES
('groq', 'llm', true, '{"models": ["llama-3.3-70b-versatile", "mixtral-8x7b-32768"]}'::jsonb),
('minimax', 'llm', false, '{"models": ["minimax-m2"]}'::jsonb),
('openrouter', 'llm', false, '{"models": ["various"]}'::jsonb),
('openai', 'llm', false, '{"models": ["gpt-4", "gpt-3.5-turbo"]}'::jsonb),
('openai-embeddings', 'embedding', false, '{"models": ["text-embedding-3-small", "text-embedding-ada-002"]}'::jsonb),
('nomic', 'embedding', true, '{"models": ["nomic-embed-text"]}'::jsonb),
('semantic-scholar', 'search', true, '{"free": true}'::jsonb),
('openalex', 'search', true, '{"free": true}'::jsonb),
('crossref', 'search', true, '{"free": true}'::jsonb),
('copyleaks', 'plagiarism', false, '{"paid": true}'::jsonb),
('copyleaks-ai', 'ai_detection', false, '{"paid": true}'::jsonb),
('stripe', 'payment', true, '{"type": "card"}'::jsonb),
('paypal', 'payment', true, '{"type": "paypal"}'::jsonb),
('iyzico', 'payment', true, '{"type": "tr_local"}'::jsonb)
ON CONFLICT (name) DO NOTHING;

-- Insert default feature flags
INSERT INTO feature_flags (name, description, is_enabled, rollout_percentage) VALUES
('enable_plagiarism', 'Enable plagiarism checking feature', true, 100),
('enable_ai_detection', 'Enable AI content detection', true, 100),
('enable_team_collaboration', 'Enable team/organization features', true, 50),
('enable_advanced_export', 'Enable advanced export options', true, 100),
('enable_multimodal', 'Enable image and multimodal analysis', false, 0)
ON CONFLICT (name) DO NOTHING;
