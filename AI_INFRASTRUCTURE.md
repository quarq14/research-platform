# AI Infrastructure Documentation

## Overview

This document describes the comprehensive AI backend infrastructure built for the research platform. The system allows users to manage their own API integrations, select models across all platform features, and automatically falls back to a free Groq API.

## Key Features

### 1. User-Managed API Integrations
- Users can add and manage their own external AI APIs (OpenRouter, OpenAI, Claude, Gemini, etc.)
- Secure API key storage with AES-256-GCM encryption
- Support for both free and paid providers
- Built-in free Groq API as default fallback

### 2. Model-Agnostic Architecture
- Dynamic model and provider registry stored in database
- Easy addition of new providers and models without code changes
- Unified abstraction layer for all AI providers
- Support for OpenAI-compatible APIs, Claude, and Gemini

### 3. Per-Feature Model Selection
- Users can select different models for each platform feature:
  - Chat
  - Paraphrasing
  - Summarization
  - Translation
  - Academic Search
  - PDF Chat
  - Writing Assistant
  - Global Default
- Settings persist across sessions
- Fallback to global default or Groq if feature-specific model unavailable

### 4. Intelligent Routing with Fallback
- Automatic routing to user's preferred model
- Graceful fallback to free Groq API on failure
- Error handling and retry logic
- Usage tracking and analytics

### 5. Security & Encryption
- API keys encrypted with AES-256-GCM before storage
- Salt-based key derivation (PBKDF2)
- Row-level security (RLS) policies in Supabase
- Keys never exposed to client-side code

## Architecture

### Database Schema

#### Tables

**ai_providers**
```sql
- id: UUID (primary key)
- name: TEXT (unique, e.g., 'groq', 'openrouter')
- display_name: TEXT (e.g., 'Groq (Free)')
- api_endpoint: TEXT
- auth_type: TEXT ('bearer', 'api_key', 'oauth')
- is_free: BOOLEAN
- is_default: BOOLEAN (marks Groq as default)
- is_active: BOOLEAN
- requires_user_key: BOOLEAN
- documentation_url: TEXT
- rate_limit_config: JSONB
- metadata: JSONB
```

**ai_models**
```sql
- id: UUID (primary key)
- provider_id: UUID (foreign key to ai_providers)
- name: TEXT (e.g., 'llama-3.3-70b-versatile')
- display_name: TEXT (e.g., 'Llama 3.3 70B Versatile')
- model_family: TEXT (e.g., 'llama', 'gpt', 'claude')
- context_window: INTEGER
- max_tokens: INTEGER
- supports_streaming: BOOLEAN
- supports_functions: BOOLEAN
- supports_vision: BOOLEAN
- pricing_config: JSONB
- capabilities: JSONB
- is_recommended: BOOLEAN
- is_active: BOOLEAN
```

**api_keys**
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- provider_id: UUID (foreign key to ai_providers)
- encrypted_key: TEXT (AES-256-GCM encrypted)
- key_name: TEXT (user-friendly name)
- is_active: BOOLEAN
- last_used_at: TIMESTAMPTZ
- usage_count: INTEGER
- error_count: INTEGER
- last_error: TEXT
```

**feature_model_preferences**
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- feature: feature_type ENUM
- model_id: UUID (foreign key to ai_models)
- provider_id: UUID (foreign key to ai_providers)
- use_custom_key: BOOLEAN
- fallback_to_default: BOOLEAN
- settings: JSONB (temperature, max_tokens, etc.)
```

**model_usage_logs**
```sql
- id: UUID (primary key)
- user_id: UUID (foreign key to auth.users)
- provider_id: UUID
- model_id: UUID
- feature: feature_type ENUM
- tokens_used: INTEGER
- tokens_input: INTEGER
- tokens_output: INTEGER
- latency_ms: INTEGER
- success: BOOLEAN
- error_message: TEXT
- error_type: TEXT
- cost_estimate: DECIMAL
```

### API Routes

#### `/api/ai/providers` (GET)
Returns all active AI providers and their available models.

**Response:**
```json
{
  "success": true,
  "providers": [
    {
      "id": "uuid",
      "name": "groq",
      "display_name": "Groq (Free - Default)",
      "is_free": true,
      "is_default": true,
      "models": [
        {
          "id": "uuid",
          "name": "llama-3.3-70b-versatile",
          "display_name": "Llama 3.3 70B Versatile",
          "is_recommended": true
        }
      ]
    }
  ]
}
```

#### `/api/ai/api-keys` (GET, POST, DELETE)
Manage user API keys.

**POST Body:**
```json
{
  "provider_id": "uuid",
  "api_key": "sk-...",
  "key_name": "My API Key"
}
```

**GET Response:**
```json
{
  "success": true,
  "api_keys": [
    {
      "id": "uuid",
      "provider": {...},
      "key_name": "My API Key",
      "masked_key": "sk-li...xyz",
      "is_active": true,
      "usage_count": 42
    }
  ]
}
```

#### `/api/ai/preferences` (GET, POST, DELETE)
Manage user model preferences for different features.

**POST Body:**
```json
{
  "feature": "chat",
  "model_id": "uuid",
  "provider_id": "uuid",
  "use_custom_key": true,
  "fallback_to_default": true
}
```

### Core Libraries

#### `/lib/encryption.ts`
Handles API key encryption and decryption.

**Functions:**
- `encryptApiKey(apiKey: string): string` - Encrypts an API key
- `decryptApiKey(encryptedData: string): string` - Decrypts an API key
- `validateApiKeyFormat(apiKey: string): boolean` - Validates key format
- `maskApiKey(apiKey: string): string` - Masks key for display

**Encryption Details:**
- Algorithm: AES-256-GCM
- Key derivation: PBKDF2 with 100,000 iterations
- Random salt (64 bytes) and IV (16 bytes) per encryption
- Authentication tag for integrity verification

#### `/lib/ai/model-router.ts`
Intelligent routing system for AI requests.

**Main Function:**
```typescript
async function routeModelRequest(
  userId: string | null,
  feature: FeatureType,
  messages: ChatMessage[],
  temperature: number = 0.7,
  maxTokens?: number
): Promise<RoutingResult>
```

**Flow:**
1. Check if user is logged in
2. Fetch user's preference for the feature
3. Try to execute with user's preferred model
4. On failure, fall back to default Groq
5. Log usage statistics
6. Return response with metadata

**Fallback Strategy:**
```
User's Preferred Model
    ↓ (on error)
Global Default Model
    ↓ (on error)
Free Groq API (llama-3.3-70b-versatile)
```

#### `/lib/ai-providers.ts`
Legacy provider system (still in use for compatibility).

Contains provider-specific implementations for:
- OpenAI-compatible APIs (Groq, OpenRouter, OpenAI)
- Anthropic Claude
- Google Gemini

## Usage Examples

### 1. Adding an API Key (User)

```typescript
// In the settings UI
const response = await fetch('/api/ai/api-keys', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    provider_id: 'provider-uuid',
    api_key: 'sk-...your-key...',
    key_name: 'My OpenRouter Key'
  })
})
```

### 2. Setting Model Preference (User)

```typescript
// Set ChatGPT-4 for paraphrasing
await fetch('/api/ai/preferences', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`,
  },
  body: JSON.stringify({
    feature: 'paraphrase',
    model_id: 'gpt-4-uuid',
    provider_id: 'openai-uuid',
    use_custom_key: true,
    fallback_to_default: true
  })
})
```

### 3. Using the Router in an API Route

```typescript
import { routeModelRequest } from '@/lib/ai/model-router'

// In your API route
const result = await routeModelRequest(
  userId,
  'chat',
  [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Hello!' }
  ],
  0.7,
  1000
)

// result contains:
// - response: string
// - provider_used: string
// - model_used: string
// - fell_back_to_default: boolean
// - tokens_used: number
// - latency_ms: number
```

## Default Configuration

### Default Providers (Seeded)
1. **Groq** (Free, Default)
   - llama-3.3-70b-versatile ⭐ (Recommended)
   - llama-3.1-8b-instant
   - mixtral-8x7b-32768

2. **OpenRouter** (Requires user key)
   - meta-llama/llama-3.3-70b-instruct ⭐

3. **OpenAI** (Requires user key)
   - gpt-4o ⭐

4. **Anthropic Claude** (Requires user key)
   - claude-3-5-sonnet-20241022 ⭐

5. **Google Gemini** (Requires user key)
   - gemini-2.0-flash-exp ⭐

6. **MiniMax** (Requires user key)

## Environment Variables

Required in `.env.local`:

```bash
# Supabase (Required)
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Encryption (Required)
ENCRYPTION_SECRET_KEY=your-32-byte-base64-key

# Groq (Built-in free API)
GROQ_API_KEY=your-groq-api-key
API_KEY_GROQ_API_KEY=your-groq-api-key

# Optional: Platform-level API keys (fallback if user doesn't provide)
OPENROUTER_API_KEY=your-openrouter-key
OPENAI_API_KEY=your-openai-key
ANTHROPIC_API_KEY=your-anthropic-key
GOOGLE_API_KEY=your-google-key
```

## Deployment Steps

### 1. Database Setup

Run the migration:
```bash
cd supabase
supabase migration up
```

Or manually execute:
```bash
psql -h db.your-project.supabase.co -U postgres -f migrations/20250122000000_enhanced_ai_model_system.sql
```

### 2. Generate Encryption Key

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Add to `.env.local`:
```bash
ENCRYPTION_SECRET_KEY=<generated-key>
```

### 3. Configure Supabase

1. Go to Supabase Dashboard > Project Settings > API
2. Copy URL and keys to `.env.local`
3. Enable RLS on new tables (done by migration)

### 4. Add Groq API Key

1. Get free key from https://console.groq.com/keys
2. Add to `.env.local`:
```bash
GROQ_API_KEY=your-key-here
```

### 5. Deploy

```bash
npm install
npm run build
npm start
```

Or deploy to Vercel:
```bash
vercel --prod
```

## Testing

### Test Encryption
```typescript
import { testEncryption } from '@/lib/encryption'

console.log(testEncryption()) // Should return true
```

### Test Provider Listing
```bash
curl http://localhost:3000/api/ai/providers
```

### Test Model Routing
```typescript
// In a test file
import { routeModelRequest } from '@/lib/ai/model-router'

const result = await routeModelRequest(
  null, // anonymous user
  'chat',
  [{ role: 'user', content: 'Hello' }],
  0.7
)

console.log(result.provider_used) // Should be "Groq (Free - Default)"
```

## Monitoring & Analytics

### View Usage Logs

Query `model_usage_logs` table:
```sql
SELECT
  u.email,
  p.display_name as provider,
  m.display_name as model,
  mul.feature,
  mul.tokens_used,
  mul.latency_ms,
  mul.success,
  mul.created_at
FROM model_usage_logs mul
JOIN auth.users u ON u.id = mul.user_id
JOIN ai_providers p ON p.id = mul.provider_id
JOIN ai_models m ON m.id = mul.model_id
ORDER BY mul.created_at DESC
LIMIT 100;
```

### Track Failures

```sql
SELECT
  provider_id,
  error_type,
  COUNT(*) as error_count,
  AVG(latency_ms) as avg_latency
FROM model_usage_logs
WHERE success = false
  AND created_at > NOW() - INTERVAL '24 hours'
GROUP BY provider_id, error_type
ORDER BY error_count DESC;
```

## Adding New Providers

### 1. Add to Database

```sql
INSERT INTO ai_providers (name, display_name, api_endpoint, requires_user_key)
VALUES ('new-provider', 'New Provider', 'https://api.new-provider.com/v1/chat', true);
```

### 2. Add Models

```sql
INSERT INTO ai_models (provider_id, name, display_name, context_window, max_tokens)
SELECT id, 'model-name', 'Model Display Name', 8192, 4096
FROM ai_providers WHERE name = 'new-provider';
```

### 3. Update Provider Implementation (if needed)

Edit `/lib/ai-providers.ts` to add provider-specific logic if it's not OpenAI-compatible.

## Troubleshooting

### Issue: "Encryption key not found"
**Solution:** Ensure `ENCRYPTION_SECRET_KEY` is set in `.env.local`

### Issue: "All models failed"
**Solution:**
1. Check Groq API key is valid
2. Verify network connectivity
3. Check Supabase logs for errors

### Issue: "User key not working"
**Solution:**
1. Verify key was encrypted correctly
2. Check provider API endpoint
3. Test key directly with provider's API

### Issue: "Model not found"
**Solution:**
1. Ensure migrations ran successfully
2. Check `ai_providers` and `ai_models` tables have data
3. Verify `is_active = true`

## Future Enhancements

- [ ] Streaming support for all providers
- [ ] Cost tracking and budgets
- [ ] Rate limiting per user/provider
- [ ] A/B testing between models
- [ ] Automatic provider health checks
- [ ] Model performance benchmarking
- [ ] Support for embeddings models
- [ ] Function calling support
- [ ] Vision model support
- [ ] Custom model endpoints

## Security Considerations

1. **API Key Storage:** All keys encrypted at rest with AES-256-GCM
2. **Key Rotation:** Users can easily deactivate and add new keys
3. **RLS Policies:** Users can only access their own keys and preferences
4. **Audit Logging:** All usage logged with timestamps
5. **Rate Limiting:** Respect provider rate limits (configurable)
6. **Error Handling:** Never expose raw API keys in error messages

## Support

For issues or questions:
1. Check this documentation
2. Review Supabase logs
3. Check browser console for client errors
4. Review server logs for API errors
5. Open GitHub issue with details

---

**Built with:** Next.js 16, Supabase, TypeScript, Tailwind CSS
**Last Updated:** 2025-01-22
