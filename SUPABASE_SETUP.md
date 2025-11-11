# Supabase Setup Guide

This guide will help you set up Supabase for the Academic AI Research Platform.

## Table of Contents

1. [Create Supabase Project](#1-create-supabase-project)
2. [Configure Environment Variables](#2-configure-environment-variables)
3. [Run Database Migrations](#3-run-database-migrations)
4. [Set Up Storage Buckets](#4-set-up-storage-buckets)
5. [Enable Extensions](#5-enable-extensions)
6. [Test Connection](#6-test-connection)
7. [Usage Examples](#7-usage-examples)
8. [Troubleshooting](#8-troubleshooting)

---

## 1. Create Supabase Project

1. Go to [Supabase](https://supabase.com) and sign in or create an account
2. Click **"New Project"**
3. Fill in the project details:
   - **Name**: Choose a name (e.g., "Academic Research Platform")
   - **Database Password**: Create a strong password (save it securely!)
   - **Region**: Choose a region close to your users
4. Click **"Create new project"** and wait for it to initialize (takes ~2 minutes)

---

## 2. Configure Environment Variables

### 2.1 Get Your Supabase Keys

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Find these values:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **anon/public key** (starts with `eyJhbGci...`)
   - **service_role key** (starts with `eyJhbGci...`) - Keep this SECRET!

### 2.2 Create Environment File

1. Copy the example environment file:
   ```bash
   cp .env.local.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```bash
   # Required Supabase Configuration
   NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here
   ```

3. Add at least one AI provider API key:
   ```bash
   # Recommended: Groq (Free tier available)
   GROQ_API_KEY=your-groq-api-key
   API_KEY_GROQ_API_KEY=your-groq-api-key

   # Optional: OpenAI (Required for embeddings)
   OPENAI_API_KEY=your-openai-api-key
   ```

> **⚠️ Security Note**: Never commit `.env.local` to git. It's already in `.gitignore`.

---

## 3. Run Database Migrations

### Option A: Using Supabase SQL Editor (Recommended)

1. Go to your Supabase project dashboard
2. Click **SQL Editor** in the left sidebar
3. Run migrations in order:

#### Step 1: Create Profiles Table
```sql
-- Copy contents from supabase/migrations/1762427868_create_profiles_table.sql
-- Paste in SQL Editor and click "Run"
```

#### Step 2: Add AI Settings Tables
```sql
-- Copy contents from supabase/migrations/20250106000000_add_ai_settings_tables.sql
-- Paste in SQL Editor and click "Run"
```

#### Step 3: Run Comprehensive Schema
```sql
-- Copy contents from supabase/migrations/20250107000000_comprehensive_schema.sql
-- Paste in SQL Editor and click "Run"
```

#### Step 4: Create RPC Functions (Optional but Recommended)
```sql
-- Copy contents from scripts/02-create-rpc-functions.sql
-- Paste in SQL Editor and click "Run"
```

### Option B: Using Supabase CLI

If you have the Supabase CLI installed:

```bash
# Login to Supabase
supabase login

# Link your project
supabase link --project-ref your-project-id

# Push migrations
supabase db push
```

### Verify Migration Success

After running migrations, verify in Supabase dashboard:

1. Go to **Table Editor**
2. You should see these tables:
   - `profiles`
   - `user_settings`
   - `api_keys`
   - `projects`
   - `documents`
   - `files`
   - `chunks`
   - `chats`
   - `messages`
   - `sources`
   - `citations`
   - `plans`
   - `subscriptions`
   - `invoices`
   - `usage_events`
   - `rate_limits`
   - `audit_logs`
   - `organizations`
   - `memberships`

---

## 4. Set Up Storage Buckets

### 4.1 Create PDF Storage Bucket

1. Go to **Storage** in the Supabase dashboard
2. Click **"New bucket"**
3. Configure the bucket:
   - **Name**: `pdfs`
   - **Public**: ❌ **Off** (keep it private)
   - **File size limit**: 50 MB (or as needed)
   - **Allowed MIME types**: `application/pdf`
4. Click **"Create bucket"**

### 4.2 Set Storage Policies

After creating the bucket, add these policies:

```sql
-- Allow authenticated users to upload their own files
CREATE POLICY "Users can upload own files"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to read their own files
CREATE POLICY "Users can read own files"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own files
CREATE POLICY "Users can delete own files"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'pdfs' AND auth.uid()::text = (storage.foldername(name))[1]);
```

---

## 5. Enable Extensions

Some features require PostgreSQL extensions:

1. Go to **Database** → **Extensions** in Supabase dashboard
2. Enable these extensions:
   - ✅ **uuid-ossp** (for UUID generation)
   - ✅ **pgcrypto** (for encryption)
   - ✅ **vector** (for embeddings and semantic search)

These should be enabled automatically by the migrations, but verify they're active.

---

## 6. Test Connection

### 6.1 Install Dependencies

Make sure all dependencies are installed:

```bash
npm install
# or
yarn install
# or
pnpm install
```

### 6.2 Test in Development

Start the development server:

```bash
npm run dev
```

The application should start without Supabase connection errors. Check the console for:
- ✅ No "[v0] Supabase is not configured" warnings
- ✅ Middleware loads without errors

### 6.3 Test Authentication

1. Try to access a protected route (e.g., `/dashboard`)
2. You should be redirected to `/auth/login`
3. This means Supabase authentication is working!

---

## 7. Usage Examples

### 7.1 Using Supabase in Server Components

```typescript
import { createServerClient } from '@/lib/supabase/server'
import { getProfile, listDocuments } from '@/lib/supabase/helpers'

export default async function DashboardPage() {
  const supabase = await createServerClient()

  if (!supabase) {
    return <div>Supabase not configured</div>
  }

  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/auth/login')
  }

  const profile = await getProfile(supabase, user.id)
  const { documents } = await listDocuments(supabase, user.id)

  return (
    <div>
      <h1>Welcome, {profile.name}</h1>
      <DocumentList documents={documents} />
    </div>
  )
}
```

### 7.2 Using Supabase in Client Components

```typescript
'use client'

import { createBrowserClient } from '@/lib/supabase/client'
import { useEffect, useState } from 'react'

export function ChatComponent() {
  const [messages, setMessages] = useState([])
  const supabase = createBrowserClient()

  useEffect(() => {
    if (!supabase) return

    // Load messages
    async function loadMessages() {
      const { data } = await supabase
        .from('messages')
        .select('*')
        .order('created_at', { ascending: true })

      setMessages(data || [])
    }

    loadMessages()

    // Subscribe to new messages
    const channel = supabase
      .channel('messages')
      .on('postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          setMessages(prev => [...prev, payload.new])
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [])

  return <MessageList messages={messages} />
}
```

### 7.3 Using Helper Functions

```typescript
import { createServerClient } from '@/lib/supabase/server'
import {
  createDocument,
  updateDocument,
  trackUsage,
  addCitation
} from '@/lib/supabase/helpers'

export async function POST(request: Request) {
  const supabase = await createServerClient()
  if (!supabase) {
    return Response.json({ error: 'Supabase not configured' }, { status: 500 })
  }

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Create a new document
  const document = await createDocument(supabase, user.id, {
    title: 'My Research Paper',
    document_type: 'article',
    language: 'en'
  })

  // Track usage
  await trackUsage(supabase, user.id, {
    event_type: 'tokens',
    amount: 1000,
    reference_id: document.id
  })

  return Response.json({ document })
}
```

---

## 8. Troubleshooting

### Issue: "Supabase is not configured" Warning

**Solution**: Make sure you have set the environment variables in `.env.local`:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Restart your dev server after adding them.

### Issue: "extension 'vector' does not exist"

**Solution**:
1. Go to **Database** → **Extensions** in Supabase dashboard
2. Search for "vector" or "pgvector"
3. Click **Enable**
4. Re-run the migrations

### Issue: Row Level Security (RLS) Blocking Queries

**Solution**: RLS is enabled for security. Make sure:
1. User is authenticated: `await supabase.auth.getUser()`
2. Policies allow the operation
3. Check policies in **Database** → **Tables** → Select table → **Policies**

### Issue: Storage Upload Fails

**Solution**:
1. Verify bucket exists and is named exactly `pdfs`
2. Check storage policies are set correctly
3. Verify user is authenticated
4. Check file MIME type is `application/pdf`

### Issue: Migration Fails

**Solution**:
1. Check if table already exists (might be from previous attempt)
2. Drop conflicting tables: `DROP TABLE IF EXISTS table_name CASCADE;`
3. Re-run migration
4. Check PostgreSQL logs in Supabase dashboard

### Issue: Cannot Connect to Database

**Solution**:
1. Verify project is not paused (free tier pauses after inactivity)
2. Check Supabase project status in dashboard
3. Verify URL and keys are correct
4. Check network connectivity

---

## Next Steps

After completing setup:

1. ✅ **Configure AI Providers**: Add API keys for Groq, OpenAI, Claude, etc.
2. ✅ **Set Up Payment Providers**: Configure Stripe, PayPal, or İyzico (optional)
3. ✅ **Configure MCP Integration**: Enable AI assistant database access (see `MCP_INTEGRATION.md`)
4. ✅ **Test Authentication**: Sign up a test user
5. ✅ **Upload a PDF**: Test file upload and processing
6. ✅ **Try Chat**: Test the AI chat functionality
7. ✅ **Create a Document**: Test the writing assistant

---

## MCP Integration (Optional)

For AI assistant integration with direct database access:

1. **Automatic Configuration**: MCP is pre-configured in `.claude/mcp.json`
2. **Project Reference**: Set to `fecijxvszvftsdpjdbjk`
3. **Authentication**: Uses your `SUPABASE_SERVICE_ROLE_KEY`
4. **Usage**: Compatible with Claude Code and other MCP-enabled tools

See `MCP_INTEGRATION.md` for detailed setup and usage instructions.

## Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Auth Guide](https://supabase.com/docs/guides/auth)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Storage Guide](https://supabase.com/docs/guides/storage)
- [Realtime Subscriptions](https://supabase.com/docs/guides/realtime)
- [MCP Integration](https://supabase.com/docs/guides/ai/mcp)

---

## Support

If you encounter issues:
1. Check the [Troubleshooting](#8-troubleshooting) section
2. Review Supabase logs in the dashboard
3. Check browser console for errors
4. Refer to `DATABASE_SETUP.md` for additional database info

Happy coding! 🚀
