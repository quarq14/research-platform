-- Enhanced AI Model System Migration
-- Created: 2025-01-22
-- Purpose: Support user-managed API integrations and dynamic model selection

-- ============================================================================
-- AI PROVIDERS AND MODELS REGISTRY
-- ============================================================================

-- AI Providers registry (can be dynamically extended)
CREATE TABLE IF NOT EXISTS ai_providers (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,  -- e.g., 'groq', 'openrouter', 'claude', 'openai', 'gemini'
    display_name TEXT NOT NULL,  -- e.g., 'Groq (Free)', 'OpenRouter', 'Claude'
    api_endpoint TEXT,
    auth_type TEXT DEFAULT 'bearer' CHECK (auth_type IN ('bearer', 'api_key', 'oauth')),
    is_free BOOLEAN DEFAULT false,
    is_default BOOLEAN DEFAULT false,  -- Mark Groq as default
    is_active BOOLEAN DEFAULT true,
    requires_user_key BOOLEAN DEFAULT false,  -- If true, user must provide their own API key
    documentation_url TEXT,
    rate_limit_config JSONB DEFAULT '{}',  -- e.g., {"requests_per_minute": 60}
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- AI Models registry (can be dynamically extended)
CREATE TABLE IF NOT EXISTS ai_models (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,  -- e.g., 'llama-3.3-70b-versatile'
    display_name TEXT NOT NULL,  -- e.g., 'Llama 3.3 70B'
    model_family TEXT,  -- e.g., 'llama', 'gpt', 'claude'
    context_window INTEGER DEFAULT 8192,
    max_tokens INTEGER DEFAULT 4096,
    supports_streaming BOOLEAN DEFAULT true,
    supports_functions BOOLEAN DEFAULT false,
    supports_vision BOOLEAN DEFAULT false,
    pricing_config JSONB DEFAULT '{}',  -- e.g., {"input_per_1k": 0.0, "output_per_1k": 0.0}
    capabilities JSONB DEFAULT '[]',  -- e.g., ["chat", "completion", "embeddings"]
    is_recommended BOOLEAN DEFAULT false,
    is_active BOOLEAN DEFAULT true,
    version TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(provider_id, name)
);

-- ============================================================================
-- ENHANCED USER API KEYS TABLE
-- ============================================================================

-- Drop old constraint and add new one with more providers
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'api_keys') THEN
        ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_provider_check;
    END IF;
END $$;

-- Recreate api_keys table with enhanced structure
DROP TABLE IF EXISTS api_keys CASCADE;

CREATE TABLE api_keys (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES ai_providers(id) ON DELETE CASCADE NOT NULL,
    encrypted_key TEXT NOT NULL,  -- Encrypted API key
    key_name TEXT,  -- User-friendly name for the key
    is_active BOOLEAN DEFAULT true,
    last_used_at TIMESTAMPTZ,
    usage_count INTEGER DEFAULT 0,
    error_count INTEGER DEFAULT 0,
    last_error TEXT,
    last_error_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,  -- Optional expiration
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, provider_id, is_active)
);

-- ============================================================================
-- FEATURE-SPECIFIC MODEL PREFERENCES
-- ============================================================================

-- Feature types where users can select models
CREATE TYPE feature_type AS ENUM (
    'chat',
    'paraphrase',
    'summarize',
    'translate',
    'citation',
    'academic_search',
    'plagiarism_check',
    'ai_detection',
    'pdf_chat',
    'writing_assistant',
    'global_default'
);

-- User preferences for models per feature
CREATE TABLE IF NOT EXISTS feature_model_preferences (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    feature feature_type NOT NULL,
    model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
    provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
    use_custom_key BOOLEAN DEFAULT false,  -- Whether to use user's API key
    fallback_to_default BOOLEAN DEFAULT true,  -- Fallback to Groq if fails
    settings JSONB DEFAULT '{}',  -- Feature-specific settings (temperature, max_tokens, etc.)
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, feature)
);

-- ============================================================================
-- MODEL USAGE TRACKING AND MONITORING
-- ============================================================================

-- Track model usage for analytics and rate limiting
CREATE TABLE IF NOT EXISTS model_usage_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    provider_id UUID REFERENCES ai_providers(id) ON DELETE SET NULL,
    model_id UUID REFERENCES ai_models(id) ON DELETE SET NULL,
    feature feature_type NOT NULL,
    tokens_used INTEGER DEFAULT 0,
    tokens_input INTEGER DEFAULT 0,
    tokens_output INTEGER DEFAULT 0,
    latency_ms INTEGER,  -- Response time in milliseconds
    success BOOLEAN DEFAULT true,
    error_message TEXT,
    error_type TEXT,  -- e.g., 'rate_limit', 'auth_error', 'timeout'
    cost_estimate DECIMAL(10, 6),  -- Estimated cost in USD
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES FOR PERFORMANCE
-- ============================================================================

-- AI Providers indexes
CREATE INDEX IF NOT EXISTS ai_providers_name_idx ON ai_providers(name);
CREATE INDEX IF NOT EXISTS ai_providers_is_active_idx ON ai_providers(is_active);
CREATE INDEX IF NOT EXISTS ai_providers_is_default_idx ON ai_providers(is_default);

-- AI Models indexes
CREATE INDEX IF NOT EXISTS ai_models_provider_id_idx ON ai_models(provider_id);
CREATE INDEX IF NOT EXISTS ai_models_name_idx ON ai_models(name);
CREATE INDEX IF NOT EXISTS ai_models_is_active_idx ON ai_models(is_active);
CREATE INDEX IF NOT EXISTS ai_models_is_recommended_idx ON ai_models(is_recommended);

-- API Keys indexes
CREATE INDEX IF NOT EXISTS api_keys_user_id_idx ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS api_keys_provider_id_idx ON api_keys(provider_id);
CREATE INDEX IF NOT EXISTS api_keys_is_active_idx ON api_keys(is_active);

-- Feature Model Preferences indexes
CREATE INDEX IF NOT EXISTS feature_model_preferences_user_id_idx ON feature_model_preferences(user_id);
CREATE INDEX IF NOT EXISTS feature_model_preferences_feature_idx ON feature_model_preferences(feature);
CREATE INDEX IF NOT EXISTS feature_model_preferences_model_id_idx ON feature_model_preferences(model_id);

-- Model Usage Logs indexes
CREATE INDEX IF NOT EXISTS model_usage_logs_user_id_idx ON model_usage_logs(user_id);
CREATE INDEX IF NOT EXISTS model_usage_logs_provider_id_idx ON model_usage_logs(provider_id);
CREATE INDEX IF NOT EXISTS model_usage_logs_model_id_idx ON model_usage_logs(model_id);
CREATE INDEX IF NOT EXISTS model_usage_logs_created_at_idx ON model_usage_logs(created_at);
CREATE INDEX IF NOT EXISTS model_usage_logs_feature_idx ON model_usage_logs(feature);

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================

-- AI Providers (public read, admin write)
ALTER TABLE ai_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active providers" ON ai_providers
    FOR SELECT USING (is_active = true);

-- AI Models (public read, admin write)
ALTER TABLE ai_models ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can view active models" ON ai_models
    FOR SELECT USING (is_active = true);

-- API Keys (user-specific)
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own API keys" ON api_keys
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own API keys" ON api_keys
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own API keys" ON api_keys
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own API keys" ON api_keys
    FOR DELETE USING (auth.uid() = user_id);

-- Feature Model Preferences (user-specific)
ALTER TABLE feature_model_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own preferences" ON feature_model_preferences
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own preferences" ON feature_model_preferences
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own preferences" ON feature_model_preferences
    FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own preferences" ON feature_model_preferences
    FOR DELETE USING (auth.uid() = user_id);

-- Model Usage Logs (user-specific read)
ALTER TABLE model_usage_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own usage logs" ON model_usage_logs
    FOR SELECT USING (auth.uid() = user_id);

-- ============================================================================
-- TRIGGERS
-- ============================================================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers
CREATE TRIGGER update_ai_providers_updated_at BEFORE UPDATE ON ai_providers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ai_models_updated_at BEFORE UPDATE ON ai_models
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_api_keys_updated_at BEFORE UPDATE ON api_keys
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_feature_model_preferences_updated_at BEFORE UPDATE ON feature_model_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- SEED DATA: DEFAULT PROVIDERS AND MODELS
-- ============================================================================

-- Insert default providers
INSERT INTO ai_providers (name, display_name, api_endpoint, is_free, is_default, is_active, requires_user_key, documentation_url)
VALUES
    ('groq', 'Groq (Free - Default)', 'https://api.groq.com/openai/v1/chat/completions', true, true, true, false, 'https://console.groq.com/docs'),
    ('openrouter', 'OpenRouter', 'https://openrouter.ai/api/v1/chat/completions', false, false, true, true, 'https://openrouter.ai/docs'),
    ('openai', 'OpenAI', 'https://api.openai.com/v1/chat/completions', false, false, true, true, 'https://platform.openai.com/docs'),
    ('anthropic', 'Anthropic Claude', 'https://api.anthropic.com/v1/messages', false, false, true, true, 'https://docs.anthropic.com/'),
    ('gemini', 'Google Gemini', 'https://generativelanguage.googleapis.com/v1beta/models', false, false, true, true, 'https://ai.google.dev/docs'),
    ('minimax', 'MiniMax', 'https://api.minimax.chat/v1/text/chatcompletion', false, false, true, true, 'https://www.minimaxi.com/docs')
ON CONFLICT (name) DO NOTHING;

-- Insert default models
INSERT INTO ai_models (provider_id, name, display_name, model_family, context_window, max_tokens, supports_streaming, is_recommended, is_active)
SELECT
    p.id,
    'llama-3.3-70b-versatile',
    'Llama 3.3 70B Versatile',
    'llama',
    32768,
    8000,
    true,
    true,
    true
FROM ai_providers p WHERE p.name = 'groq'
ON CONFLICT (provider_id, name) DO NOTHING;

INSERT INTO ai_models (provider_id, name, display_name, model_family, context_window, max_tokens, supports_streaming, is_recommended, is_active)
SELECT
    p.id,
    'llama-3.1-8b-instant',
    'Llama 3.1 8B Instant',
    'llama',
    8192,
    4096,
    true,
    false,
    true
FROM ai_providers p WHERE p.name = 'groq'
ON CONFLICT (provider_id, name) DO NOTHING;

INSERT INTO ai_models (provider_id, name, display_name, model_family, context_window, max_tokens, supports_streaming, is_recommended, is_active)
SELECT
    p.id,
    'mixtral-8x7b-32768',
    'Mixtral 8x7B',
    'mixtral',
    32768,
    8000,
    true,
    false,
    true
FROM ai_providers p WHERE p.name = 'groq'
ON CONFLICT (provider_id, name) DO NOTHING;

INSERT INTO ai_models (provider_id, name, display_name, model_family, context_window, max_tokens, supports_streaming, is_recommended, is_active)
SELECT
    p.id,
    'meta-llama/llama-3.3-70b-instruct',
    'Llama 3.3 70B Instruct',
    'llama',
    32768,
    8000,
    true,
    true,
    true
FROM ai_providers p WHERE p.name = 'openrouter'
ON CONFLICT (provider_id, name) DO NOTHING;

INSERT INTO ai_models (provider_id, name, display_name, model_family, context_window, max_tokens, supports_streaming, is_recommended, is_active)
SELECT
    p.id,
    'gpt-4o',
    'GPT-4 Optimized',
    'gpt',
    128000,
    4096,
    true,
    true,
    true
FROM ai_providers p WHERE p.name = 'openai'
ON CONFLICT (provider_id, name) DO NOTHING;

INSERT INTO ai_models (provider_id, name, display_name, model_family, context_window, max_tokens, supports_streaming, is_recommended, is_active)
SELECT
    p.id,
    'claude-3-5-sonnet-20241022',
    'Claude 3.5 Sonnet',
    'claude',
    200000,
    8000,
    true,
    true,
    true
FROM ai_providers p WHERE p.name = 'anthropic'
ON CONFLICT (provider_id, name) DO NOTHING;

INSERT INTO ai_models (provider_id, name, display_name, model_family, context_window, max_tokens, supports_streaming, is_recommended, is_active)
SELECT
    p.id,
    'gemini-2.0-flash-exp',
    'Gemini 2.0 Flash',
    'gemini',
    1000000,
    8000,
    true,
    true,
    true
FROM ai_providers p WHERE p.name = 'gemini'
ON CONFLICT (provider_id, name) DO NOTHING;

-- ============================================================================
-- HELPER FUNCTIONS
-- ============================================================================

-- Function to get user's preferred model for a feature
CREATE OR REPLACE FUNCTION get_user_model_preference(
    p_user_id UUID,
    p_feature feature_type
)
RETURNS TABLE (
    provider_name TEXT,
    model_name TEXT,
    use_custom_key BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.name,
        m.name,
        fmp.use_custom_key
    FROM feature_model_preferences fmp
    JOIN ai_models m ON m.id = fmp.model_id
    JOIN ai_providers p ON p.id = m.provider_id
    WHERE fmp.user_id = p_user_id
      AND fmp.feature = p_feature
      AND p.is_active = true
      AND m.is_active = true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get default Groq model
CREATE OR REPLACE FUNCTION get_default_groq_model()
RETURNS TABLE (
    provider_name TEXT,
    model_name TEXT
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        p.name,
        m.name
    FROM ai_models m
    JOIN ai_providers p ON p.id = m.provider_id
    WHERE p.name = 'groq'
      AND m.is_recommended = true
      AND m.is_active = true
      AND p.is_active = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
