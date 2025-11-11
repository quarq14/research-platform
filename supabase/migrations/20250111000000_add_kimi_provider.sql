-- Migration: Add Kimi K2 (Moonshot AI) provider support
-- Created at: 2025-01-11

-- Update user_settings to add Kimi provider
ALTER TABLE user_settings DROP CONSTRAINT IF EXISTS user_settings_ai_provider_check;
ALTER TABLE user_settings ADD CONSTRAINT user_settings_ai_provider_check
    CHECK (ai_provider IN ('groq', 'openrouter', 'claude', 'openai', 'gemini', 'minimax', 'kimi'));

-- Update api_keys to add Kimi provider
ALTER TABLE api_keys DROP CONSTRAINT IF EXISTS api_keys_provider_check;
ALTER TABLE api_keys ADD CONSTRAINT api_keys_provider_check
    CHECK (provider IN ('groq', 'openrouter', 'claude', 'openai', 'gemini', 'minimax', 'kimi', 'copyleaks', 'serpapi'));

-- Add comment
COMMENT ON COLUMN user_settings.ai_provider IS 'AI provider: groq (free), openrouter, claude, openai, gemini, minimax, kimi (free)';
COMMENT ON COLUMN api_keys.provider IS 'Provider type: AI providers (groq, kimi, etc.) or service providers (copyleaks, serpapi)';
