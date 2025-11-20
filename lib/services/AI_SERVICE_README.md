# AI Service Documentation

## Overview

The AI Service provides automatic API key management with user key priority. This system allows:
- **Default Free Groq API**: Works out of the box with no configuration
- **User Custom Keys**: Users can add their own API keys for any provider
- **Priority System**: User keys take priority over default environment keys
- **Fallback Support**: Automatically falls back to default keys if user hasn't configured their own

## Architecture

```
User Request → AI Service → Check User API Key → Use User Key
                                ↓ (if not found)
                          Check Environment Key → Use Default Key
                                ↓ (if not found)
                          Fallback to Groq Free Key
```

## Quick Start

### Method 1: Using AI Service (Recommended)

```typescript
import { executeAIChat, executeAIChatStream } from '@/lib/services/ai-service'

// Non-streaming chat
const response = await executeAIChat(
  [
    { role: 'system', content: 'You are a helpful assistant' },
    { role: 'user', content: 'Hello!' }
  ],
  userId, // optional - if provided, uses user's settings
  0.7,    // temperature
  2000    // max tokens
)

// Streaming chat
for await (const chunk of executeAIChatStream(messages, userId)) {
  console.log(chunk)
}
```

### Method 2: Manual Configuration (Advanced)

```typescript
import { getUserAIConfig } from '@/lib/services/ai-service'
import { chatCompletion } from '@/lib/ai-providers'

const config = await getUserAIConfig(userId)
const response = await chatCompletion(config, messages)
```

## API Route Example

```typescript
import { executeAIChat } from '@/lib/services/ai-service'
import { createServerClient } from '@/lib/supabase/server'

export async function POST(req: Request) {
  const { messages } = await req.json()

  // Get user ID
  const supabase = await createServerClient()
  const { data: { user } } = await supabase?.auth.getUser() || { data: { user: null } }

  // Execute AI chat with automatic key management
  const response = await executeAIChat(messages, user?.id)

  return Response.json({ message: response })
}
```

## Features

### 1. Default Free Groq API

The platform includes a default Groq API key that works immediately:

```env
GROQ_API_KEY=gsk_wKvM8hNjZ4Y6xK9cL2mRvWGdyb3FYqJ8pT1nX7sD4rE5fH6gA9bC0wQ3vZ
```

✅ **Benefits**:
- No setup required
- Immediate functionality
- Free tier with generous limits

### 2. User API Keys

Users can add their own API keys through the Settings UI:

1. Go to Settings → AI Settings
2. Select a provider (Groq, OpenRouter, Claude, OpenAI, Gemini)
3. Enter API key
4. Save

User keys are:
- ✅ Encrypted before storage
- ✅ Tied to user account
- ✅ Take priority over default keys

### 3. Priority System

The system checks keys in this order:

1. **User's API Key** (from database)
   - Stored in `api_keys` table
   - User-specific configuration

2. **Environment Variable** (from `.env.local`)
   - Server-side default keys
   - Shared across all users without custom keys

3. **Default Groq Key** (built-in fallback)
   - Always available
   - Free tier

## Supported Providers

| Provider | Default Key | User Key | Models |
|----------|-------------|----------|--------|
| **Groq** | ✅ Yes | ✅ Yes | Llama 3.3 70B, Llama 3.1, Mixtral |
| **OpenRouter** | ❌ No | ✅ Yes | Multiple (Claude, GPT-4, Gemini, etc.) |
| **Claude** | ❌ No | ✅ Yes | Claude 3.5 Sonnet, Haiku, Opus |
| **OpenAI** | ❌ No | ✅ Yes | GPT-4o, GPT-4 Turbo, GPT-3.5 |
| **Gemini** | ❌ No | ✅ Yes | Gemini 2.0 Flash, 1.5 Pro, 1.5 Flash |

## Helper Functions

### Check Available Providers

```typescript
import { getAvailableProviders } from '@/lib/services/ai-service'

const providers = await getAvailableProviders(userId)
/*
[
  {
    provider: 'groq',
    hasUserKey: false,
    hasDefaultKey: true,
    available: true
  },
  {
    provider: 'openai',
    hasUserKey: true,
    hasDefaultKey: false,
    available: true
  },
  ...
]
*/
```

### Check Specific Provider

```typescript
import { isProviderAvailable } from '@/lib/services/ai-service'

const canUseOpenAI = await isProviderAvailable('openai', userId)
if (canUseOpenAI) {
  // Use OpenAI
}
```

### Get User Configuration

```typescript
import { getUserAIConfig } from '@/lib/services/ai-service'

const config = await getUserAIConfig(userId)
// { provider: 'groq', model: 'llama-3.3-70b-versatile', apiKey: '...' }
```

## Database Schema

### `user_settings` Table

```sql
CREATE TABLE user_settings (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) UNIQUE,
  ai_provider TEXT DEFAULT 'groq',
  ai_model TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### `api_keys` Table

```sql
CREATE TABLE api_keys (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id),
  provider TEXT NOT NULL,
  encrypted_key TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider, is_active)
);
```

## Environment Variables

```env
# Default Groq (Free)
GROQ_API_KEY=your_key_here
API_KEY_GROQ_API_KEY=your_key_here

# Optional: Other providers
OPENROUTER_API_KEY=your_key_here
ANTHROPIC_API_KEY=your_key_here
OPENAI_API_KEY=your_key_here
GOOGLE_API_KEY=your_key_here
GEMINI_API_KEY=your_key_here
```

## Error Handling

The service handles errors gracefully:

```typescript
try {
  const response = await executeAIChat(messages, userId)
  // Success
} catch (error) {
  if (error.message.includes('No API key configured')) {
    // No key available
    console.error('Please configure an API key')
  } else {
    // Other error
    console.error('AI error:', error)
  }
}
```

## Best Practices

1. **Always provide userId when available**
   ```typescript
   // ✅ Good
   const response = await executeAIChat(messages, user?.id)

   // ❌ Less ideal (uses only default keys)
   const response = await executeAIChat(messages)
   ```

2. **Handle errors appropriately**
   ```typescript
   try {
     const response = await executeAIChat(messages, userId)
     return Response.json({ success: true, message: response })
   } catch (error) {
     return Response.json({ success: false, error: error.message }, { status: 500 })
   }
   ```

3. **Use streaming for better UX**
   ```typescript
   // For long responses, use streaming
   const encoder = new TextEncoder()
   const stream = new ReadableStream({
     async start(controller) {
       for await (const chunk of executeAIChatStream(messages, userId)) {
         controller.enqueue(encoder.encode(chunk))
       }
       controller.close()
     }
   })
   return new Response(stream)
   ```

## Security Notes

- API keys are stored encrypted in the database (in production, use proper encryption)
- User keys are isolated per user (RLS policies)
- Default keys are server-side only (not exposed to client)
- Service role keys are never shared with users

## Testing

```bash
# Test with default key
curl -X POST http://localhost:3000/api/site-chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"Hello"}]}'

# Test with authenticated user
# (User's custom key will be used if configured)
```

## Migration Guide

If you have existing code using the old system:

```typescript
// Old way
const supabase = await createServerClient()
const preferences = await getUserAIPreferences(user.id, supabase)
const apiKey = await getUserAPIKey(user.id, preferences.provider, supabase)
const config = { provider: preferences.provider, model: preferences.model, apiKey }
const response = await chatCompletion(config, messages)

// New way (simpler)
const response = await executeAIChat(messages, user.id)
```

## Troubleshooting

### "No API key configured" error

**Solution**: Add a default Groq API key to `.env.local` or ask user to configure their key in Settings.

### User key not being used

**Check**:
1. Is the key saved in the database? (Check `api_keys` table)
2. Is `is_active` set to `true`?
3. Is the provider correctly selected in `user_settings`?

### Rate limiting issues

**Solution**: Encourage users to add their own API keys for higher rate limits.

## Support

For issues or questions:
- Check the database migrations are complete
- Verify environment variables are set
- Check API key validity in Settings UI
- Review server logs for detailed errors
