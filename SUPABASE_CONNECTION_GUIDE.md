# Supabase Connection Guide

This guide explains how Supabase connections are properly configured in this project.

## Architecture Overview

This project uses **Supabase SSR (Server-Side Rendering)** package (`@supabase/ssr`) for proper Next.js App Router support with authentication and session management.

### Client Structure

```
lib/supabase/
├── client.ts         # Browser client for client components
├── server.ts         # Server client for server components/actions
├── middleware.ts     # Auth middleware for protected routes
├── helpers.ts        # Database helper functions
├── types.ts          # TypeScript type definitions
└── index.ts          # Main exports
```

## Usage Guide

### 1. Client Components

Use `createBrowserClient` for client-side components:

```typescript
'use client'

import { createBrowserClient } from '@/lib/supabase'
import { useEffect, useState } from 'react'

export default function MyComponent() {
  const [data, setData] = useState(null)

  useEffect(() => {
    const supabase = createBrowserClient()
    if (!supabase) return

    async function loadData() {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')

      if (!error) setData(data)
    }

    loadData()
  }, [])

  return <div>{/* Your component */}</div>
}
```

### 2. Server Components

Use `createServerClient` for server components:

```typescript
import { createServerClient } from '@/lib/supabase'

export default async function ServerComponent() {
  const supabase = await createServerClient()
  if (!supabase) {
    return <div>Database not configured</div>
  }

  const { data } = await supabase
    .from('profiles')
    .select('*')

  return <div>{/* Your component */}</div>
}
```

### 3. Server Actions

Use `createServerClient` for server actions:

```typescript
'use server'

import { createServerClient } from '@/lib/supabase'
import { revalidatePath } from 'next/cache'

export async function updateProfile(formData: FormData) {
  const supabase = await createServerClient()
  if (!supabase) {
    return { error: 'Database not configured' }
  }

  const { error } = await supabase
    .from('profiles')
    .update({ full_name: formData.get('name') })
    .eq('id', userId)

  if (!error) {
    revalidatePath('/profile')
  }

  return { error }
}
```

### 4. Using Helper Functions

The project includes comprehensive helper functions in `lib/supabase/helpers.ts`:

```typescript
import {
  getProfile,
  createDocument,
  getUserDocuments,
  uploadPDFToStorage
} from '@/lib/supabase'

// Get user profile
const profile = await getProfile(userId)

// Create a document
const doc = await createDocument({
  user_id: userId,
  title: 'My Document',
  content: 'Content here'
})

// Get user's documents
const docs = await getUserDocuments(userId)

// Upload PDF
const fileUrl = await uploadPDFToStorage(userId, file)
```

## Environment Variables

### Required Variables

```env
# Your Supabase project URL
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co

# Your Supabase anonymous/public key (client-safe)
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here

# Your Supabase service role key (server-only, KEEP SECRET)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Project reference for MCP integration
NEXT_PUBLIC_SUPABASE_PROJECT_REF=your-project-id
```

### Where to Find These Values

1. Go to your Supabase project dashboard
2. Click **Project Settings** (⚙️ icon)
3. Click **API** in the left menu
4. Copy the values:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **service_role secret** key → `SUPABASE_SERVICE_ROLE_KEY`

## Client vs Server: When to Use What

### Use Browser Client (`createBrowserClient`) When:

- ✓ You're in a client component (`'use client'`)
- ✓ You need real-time subscriptions
- ✓ You're handling user interactions
- ✓ You're in a React hook (useEffect, etc.)

### Use Server Client (`createServerClient`) When:

- ✓ You're in a server component
- ✓ You're in a server action (`'use server'`)
- ✓ You need to access RLS-protected data
- ✓ You're performing admin operations

## Authentication Flow

### 1. Middleware Protection

The middleware (`middleware.ts`) automatically:
- Checks authentication on protected routes
- Redirects unauthenticated users to `/auth/login`
- Updates session cookies

Protected routes:
- `/dashboard/*`
- `/upload/*`
- `/chat/*`
- `/write/*`
- `/sources/*`

### 2. Getting Current User

**Client-side:**
```typescript
import { createBrowserClient } from '@/lib/supabase'

const supabase = createBrowserClient()
const { data: { user } } = await supabase.auth.getUser()
```

**Server-side:**
```typescript
import { createServerClient } from '@/lib/supabase'

const supabase = await createServerClient()
const { data: { user } } = await supabase.auth.getUser()
```

**Using Auth Context (Client):**
```typescript
import { useAuth } from '@/contexts/AuthContext'

function MyComponent() {
  const { user, loading, signOut } = useAuth()

  if (loading) return <div>Loading...</div>
  if (!user) return <div>Not logged in</div>

  return <div>Hello {user.email}</div>
}
```

### 3. Sign In/Sign Out

**Sign In:**
```typescript
const { data, error } = await supabase.auth.signInWithPassword({
  email: 'user@example.com',
  password: 'password123'
})
```

**Sign Up:**
```typescript
const { data, error } = await supabase.auth.signUp({
  email: 'user@example.com',
  password: 'password123',
  options: {
    emailRedirectTo: `${location.origin}/auth/callback`
  }
})
```

**Sign Out:**
```typescript
await supabase.auth.signOut()
```

## Row Level Security (RLS)

All tables use Row Level Security policies to ensure users can only access their own data.

### Example RLS Policies

**Profiles Table:**
```sql
-- Users can read their own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Users can update their own profile
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);
```

**Documents Table:**
```sql
-- Users can only see their own documents
CREATE POLICY "Users can read own documents"
  ON documents FOR SELECT
  USING (auth.uid() = user_id);

-- Users can insert their own documents
CREATE POLICY "Users can create own documents"
  ON documents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
```

## Storage

### PDF Upload

```typescript
import { uploadPDFToStorage } from '@/lib/supabase'

// Upload file
const fileUrl = await uploadPDFToStorage(userId, file)

// Download file
const supabase = createBrowserClient()
const { data } = await supabase.storage
  .from('pdfs')
  .download(`${userId}/${filename}`)

// Delete file
await supabase.storage
  .from('pdfs')
  .remove([`${userId}/${filename}`])
```

### Storage Security

The `pdfs` bucket is **private** with RLS policies:
- Users can only upload to their own folder
- Users can only access their own files
- Files are automatically organized by user ID

## Type Safety

All database operations are fully typed using TypeScript:

```typescript
import type { Database, Profile, Document } from '@/lib/supabase'

// Profile type is automatically inferred
const profile: Profile = {
  id: 'user-id',
  full_name: 'John Doe',
  avatar_url: null,
  plan: 'free',
  // ... TypeScript will enforce correct types
}

// Database types for queries
const { data } = await supabase
  .from('documents')
  .select('*')
  .returns<Document[]>()
```

## Error Handling

Always check for errors in Supabase operations:

```typescript
const { data, error } = await supabase
  .from('profiles')
  .select('*')

if (error) {
  console.error('Database error:', error.message)
  return { error: error.message }
}

// Use data safely here
return { data }
```

## Best Practices

### 1. Always Check if Client Exists

```typescript
const supabase = createBrowserClient()
if (!supabase) {
  // Handle unconfigured state
  return
}
// Proceed with operations
```

### 2. Use Helper Functions

Instead of writing raw queries, use the provided helpers:

```typescript
// ❌ Don't do this
const { data } = await supabase
  .from('documents')
  .select('*')
  .eq('user_id', userId)

// ✅ Do this
const documents = await getUserDocuments(userId)
```

### 3. Handle Loading States

```typescript
const [loading, setLoading] = useState(true)

useEffect(() => {
  async function loadData() {
    const data = await fetchData()
    setData(data)
    setLoading(false)
  }
  loadData()
}, [])

if (loading) return <LoadingSpinner />
```

### 4. Validate Environment Variables

The setup includes automatic validation. If variables are missing:
- Client returns `null`
- Middleware skips auth checks
- Clear warnings in console

### 5. Keep Secrets Secret

- ✗ **NEVER** expose `SUPABASE_SERVICE_ROLE_KEY` to client
- ✗ **NEVER** commit `.env.local` to git
- ✓ **ONLY** use `NEXT_PUBLIC_*` variables in client code
- ✓ **USE** server actions for sensitive operations

## Testing Your Setup

Run the verification scripts:

```bash
# Test connection and schema
npm run setup-supabase

# Detailed connection test
npm run test-supabase

# Interactive setup wizard
npm run setup-supabase:interactive
```

## Troubleshooting

### "Client returns null"

- Check `.env.local` exists and has correct values
- Restart dev server after changing env vars
- Verify no extra spaces/quotes in env values

### "Permission denied" errors

- Check RLS policies are set up correctly
- Verify user is authenticated
- Ensure user ID matches in queries

### "Table doesn't exist"

- Run all migrations in Supabase SQL Editor
- Check you're connected to correct project
- Verify migrations ran without errors

### "Session expired" errors

- Clear cookies and sign in again
- Check middleware is running
- Verify auth cookies are being set

## Migration to New Structure

If you have old code using `getSupabase()`:

### Old Pattern (Deprecated)
```typescript
import { getSupabase } from '@/lib/supabase'
const supabase = getSupabase()
```

### New Pattern
```typescript
// Client component
import { createBrowserClient } from '@/lib/supabase'
const supabase = createBrowserClient()

// Server component/action
import { createServerClient } from '@/lib/supabase'
const supabase = await createServerClient()
```

## Resources

- [Supabase Docs](https://supabase.com/docs)
- [Supabase SSR Guide](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Next.js App Router](https://nextjs.org/docs/app)
- [Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)

---

For more detailed setup instructions, see:
- `QUICK_START.md` - Quick setup guide
- `SUPABASE_SETUP.md` - Complete setup documentation
- `DATABASE_SETUP.md` - Database schema details
