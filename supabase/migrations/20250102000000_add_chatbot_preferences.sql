-- Add chatbot preferences to profiles table

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS chatbot_provider TEXT DEFAULT 'groq',
ADD COLUMN IF NOT EXISTS chatbot_model TEXT;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_chatbot_provider ON profiles(chatbot_provider);

-- Comment
COMMENT ON COLUMN profiles.chatbot_provider IS 'Preferred LLM provider for site chatbot (groq, openai, claude, gemini, openrouter)';
COMMENT ON COLUMN profiles.chatbot_model IS 'Specific model to use with the chosen provider';
