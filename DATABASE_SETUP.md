# Database Setup Instructions

Your Supabase database needs to be initialized before you can use the platform features.

## Quick Setup

1. **Open the Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the Database Setup Script**
   - Copy the contents of `scripts/01-setup-database.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

3. **Run the RPC Functions Script (Optional)**
   - Copy the contents of `scripts/02-create-rpc-functions.sql`
   - Paste it into the SQL Editor
   - Click "Run" to execute the script

## What Gets Created

The setup script creates:

- **Tables**: profiles, documents, files, chunks, sources, citations, chats, messages, usage_events, subscriptions, payments, api_keys, rate_limits
- **Extensions**: uuid-ossp, pgcrypto, vector (for embeddings)
- **Indexes**: For optimal query performance
- **RLS Policies**: Row Level Security for data protection
- **Triggers**: Auto-create user profiles on signup

## Verify Setup

After running the scripts, you should see all tables in your Supabase dashboard under "Table Editor".

## Troubleshooting

- **Error: extension "vector" does not exist**
  - Enable the pgvector extension in your Supabase project settings
  - Go to Database → Extensions → Enable "vector"

- **Permission errors**
  - Make sure you're running the script as a superuser
  - Check that RLS policies are properly configured

## Storage Buckets

You also need to create a storage bucket for PDFs:

1. Go to "Storage" in Supabase dashboard
2. Create a new bucket named "pdfs"
3. Set it to "Private" (not public)
4. Add RLS policies to allow authenticated users to upload/read their own files

## Next Steps

Once the database is set up, you can:
- Upload PDFs
- Chat with your documents
- Use the writing assistant
- Manage citations
- And more!
