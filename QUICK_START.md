# Quick Start Guide - Supabase Connection Setup

This guide will help you quickly set up Supabase connections for the Academic Research Platform.

## Prerequisites

- A Supabase account (sign up at https://supabase.com)
- Node.js 18+ installed
- Git repository cloned

## Step 1: Create a Supabase Project

1. Go to https://app.supabase.com
2. Click "New Project"
3. Fill in:
   - **Name**: Academic Research Platform (or your preferred name)
   - **Database Password**: Choose a strong password (save it!)
   - **Region**: Choose the closest to your users
4. Click "Create new project"
5. Wait for the project to be ready (takes ~2 minutes)

## Step 2: Get Your Supabase Credentials

1. Once your project is ready, go to **Project Settings** (⚙️ icon in sidebar)
2. Click on **API** in the left menu
3. You'll see:
   - **Project URL** (e.g., `https://fecijxvszvftsdpjdbjk.supabase.co`)
   - **Project API keys**:
     - `anon` `public` - This is your **ANON KEY** (safe for client)
     - `service_role` `secret` - This is your **SERVICE ROLE KEY** (keep secret!)

## Step 3: Configure Environment Variables

### Option A: Automated Setup (Recommended)

Run the interactive setup script:

```bash
npm run setup-supabase:interactive
```

This will prompt you for your credentials and automatically configure everything.

### Option B: Manual Setup

1. Open `.env.local` file (it was created when you cloned the repo)
2. Update these values:

```env
# Replace with YOUR actual values from Step 2
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT-ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-actual-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-actual-service-role-key-here

# Update the project reference (extract from your URL)
NEXT_PUBLIC_SUPABASE_PROJECT_REF=YOUR-PROJECT-ID
```

3. Save the file

## Step 4: Set Up Database Schema

You need to create the database tables. There are two ways to do this:

### Option A: Using Supabase Dashboard (Recommended)

1. Go to https://app.supabase.com/project/YOUR-PROJECT-ID/sql/new
2. Open each migration file from `supabase/migrations/` folder:
   - `1762427868_create_profiles_table.sql`
   - `20250106000000_add_ai_settings_tables.sql`
   - `20250107000000_comprehensive_schema.sql`
3. Copy the contents of each file
4. Paste into the SQL Editor
5. Click **RUN** for each migration

### Option B: Using Supabase CLI (Advanced)

If you have Supabase CLI installed:

```bash
# Link to your project
supabase link --project-ref YOUR-PROJECT-ID

# Push migrations
supabase db push
```

## Step 5: Create Storage Bucket

1. Go to https://app.supabase.com/project/YOUR-PROJECT-ID/storage/buckets
2. Click **New bucket**
3. Enter name: `pdfs`
4. **Important**: Set to **Private** (not public)
5. Click **Create bucket**

## Step 6: Verify Setup

Run the verification script:

```bash
npm run setup-supabase
```

This will:
- ✓ Check environment variables
- ✓ Test database connection
- ✓ Verify all tables exist
- ✓ Check storage bucket configuration

If all checks pass, you're ready to go! 🎉

## Step 7: Configure AI Providers

You'll need at least one AI provider API key:

### Recommended for Getting Started: Groq (Free)

1. Go to https://console.groq.com
2. Sign up and get your API key
3. Add to `.env.local`:
   ```env
   GROQ_API_KEY=your-groq-api-key
   ```

### For Embeddings: OpenAI (Required)

1. Go to https://platform.openai.com/api-keys
2. Create an API key
3. Add to `.env.local`:
   ```env
   OPENAI_API_KEY=your-openai-api-key
   ```

### Optional AI Providers

You can also add:
- **Anthropic Claude**: https://console.anthropic.com
- **Google Gemini**: https://aistudio.google.com/app/apikey
- **OpenRouter**: https://openrouter.ai/keys

## Step 8: Start Development Server

```bash
npm install
npm run dev
```

Visit http://localhost:3000 - you should see the application!

## Troubleshooting

### "Failed to connect to Supabase"

- Double-check your credentials in `.env.local`
- Make sure there are no extra spaces or quotes
- Verify the URL matches your project

### "Tables don't exist"

- Run the migrations (Step 4)
- Check SQL Editor for any errors
- Make sure you ran ALL three migration files

### "Storage bucket not found"

- Create the `pdfs` bucket (Step 5)
- Make sure it's set to **Private**

### Still having issues?

1. Run the verification script:
   ```bash
   npm run setup-supabase
   ```

2. Check detailed setup guides:
   - `SUPABASE_SETUP.md` - Complete Supabase guide
   - `DATABASE_SETUP.md` - Database schema details
   - `MCP_INTEGRATION.md` - MCP setup (optional)

## Next Steps

Once everything is set up:

1. **Create an account**: Visit `/auth/signup` to create your first user
2. **Upload a PDF**: Try uploading a research paper
3. **Chat with your documents**: Use the AI assistant
4. **Explore features**: Try writing, sources, and more!

## Important Security Notes

- ✗ **NEVER** commit `.env.local` to git (it's in `.gitignore`)
- ✗ **NEVER** share your `SERVICE_ROLE_KEY` publicly
- ✓ **DO** use environment variables for all secrets
- ✓ **DO** keep your Supabase project password safe

## Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [Project README](./README.md)
- [Full Setup Guide](./SUPABASE_SETUP.md)

---

**Need help?** Check the detailed documentation or create an issue in the repository.
