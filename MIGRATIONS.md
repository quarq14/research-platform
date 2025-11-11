# Database Migrations Guide

## Overview

This document describes the database migrations for the Academic Research Platform, specifically for converting from a multilingual (English/Turkish) platform with Stripe to an English-only platform with PayPal and iyzico only.

## Migration Timeline

- **20251111000000_english_only_no_stripe.sql** - Major migration to English-only and remove Stripe

## Prerequisites

- Supabase CLI installed (`npm install -g supabase`)
- Supabase project created
- PostgreSQL 15+ with pgvector extension enabled

## Step-by-Step Migration Process

### 1. Initial Setup

```bash
# Install Supabase CLI
npm install -g supabase

# Login to Supabase
supabase login

# Link to your project
supabase link --project-ref <your-project-ref>
```

### 2. Enable Required Extensions

Run in your Supabase SQL Editor:

```sql
-- Enable UUID support
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Enable encryption functions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Enable vector similarity search
CREATE EXTENSION IF NOT EXISTS "vector";
```

### 3. Run Base Schema Migration

Apply the comprehensive schema migration:

```bash
supabase db push
```

Or manually run in SQL Editor:
- `/supabase/migrations/1762427868_create_profiles_table.sql`
- `/supabase/migrations/20250106000000_add_ai_settings_tables.sql`
- `/supabase/migrations/20250107000000_comprehensive_schema.sql`
- `/supabase/migrations/20251111000000_english_only_no_stripe.sql`

### 4. Create Storage Buckets

```bash
# Create PDFs bucket for file uploads
supabase storage create pdfs

# Set bucket policies (authenticated users only)
```

Or via Supabase Dashboard:
1. Go to Storage
2. Create new bucket: `pdfs`
3. Set to **Private** (authenticated users only)
4. Enable RLS policies

### 5. Verify Migration

```sql
-- Check that extensions are enabled
SELECT * FROM pg_extension WHERE extname IN ('uuid-ossp', 'pgcrypto', 'vector');

-- Check that key tables exist
SELECT table_name FROM information_schema.tables
WHERE table_schema = 'public'
ORDER BY table_name;

-- Verify pgvector dimension
SELECT column_name, udt_name FROM information_schema.columns
WHERE table_name = 'chunks' AND column_name = 'embedding';

-- Check RLS is enabled
SELECT tablename, rowsecurity
FROM pg_tables
WHERE schemaname = 'public' AND rowsecurity = true;
```

### 6. Seed Initial Data

The migration includes seed data for plans. Verify:

```sql
SELECT name, price_monthly, price_yearly, limits, features FROM plans;
```

Expected output:
- Free plan: $0, limits for basic usage
- Pro plan: $19.99/month or $199.99/year
- Team plan: $49.99/month or $499.99/year

## Migration Changes Detail

### Removed Turkish Locale Support

**Before:**
```sql
CHECK (locale IN ('en', 'tr'))
CHECK (language IN ('en', 'tr'))
```

**After:**
```sql
CHECK (locale = 'en')
CHECK (language = 'en')
```

All existing records with `locale='tr'` or `language='tr'` are automatically updated to `'en'`.

### Removed Stripe Integration

**Dropped columns:**
- `profiles.stripe_customer_id`
- `plans.stripe_price_id_monthly`
- `plans.stripe_price_id_yearly`

**Updated constraints:**
```sql
-- Payment providers now only accept PayPal and iyzico
CHECK (payment_provider IN ('paypal', 'iyzico'))
```

### Added Tables

**New tables for webhooks:**
- `webhook_events` - Track all payment webhook events from PayPal and iyzico

**New tables for writing workspace:**
- `drafts` - Academic writing drafts with outline and metadata
- `sections` - Individual sections within drafts with content and citations

**Enhanced tables:**
- `chunks` - Added `tsv` column for full-text search (hybrid RAG)

### Row Level Security (RLS)

All tables have RLS policies:
- Users can only access their own data
- `sources` table is readable by all authenticated users
- `plans` table is publicly readable

## Rollback Strategy

To rollback this migration:

```sql
-- Restore Turkish locale support
ALTER TABLE profiles DROP CONSTRAINT profiles_locale_check;
ALTER TABLE profiles ADD CONSTRAINT profiles_locale_check CHECK (locale IN ('en', 'tr'));

ALTER TABLE documents DROP CONSTRAINT documents_language_check;
ALTER TABLE documents ADD CONSTRAINT documents_language_check CHECK (language IN ('en', 'tr'));

-- Restore Stripe fields
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT UNIQUE;
ALTER TABLE plans ADD COLUMN stripe_price_id_monthly TEXT;
ALTER TABLE plans ADD COLUMN stripe_price_id_yearly TEXT;

-- Restore Stripe in payment providers
ALTER TABLE subscriptions DROP CONSTRAINT subscriptions_payment_provider_check;
ALTER TABLE subscriptions ADD CONSTRAINT subscriptions_payment_provider_check
    CHECK (payment_provider IN ('stripe', 'paypal', 'iyzico'));

ALTER TABLE invoices DROP CONSTRAINT invoices_payment_provider_check;
ALTER TABLE invoices ADD CONSTRAINT invoices_payment_provider_check
    CHECK (payment_provider IN ('stripe', 'paypal', 'iyzico'));
```

## Data Migration Notes

### User Data

- All user profiles are preserved
- Locale is automatically set to `'en'`
- Usage counters remain intact

### Files and Chunks

- All uploaded files and processed chunks are preserved
- Embeddings remain intact
- Full-text search (tsvector) is automatically generated for existing chunks

### Subscriptions

- Existing Stripe subscriptions will need to be manually migrated to PayPal or iyzico
- Contact affected users to re-subscribe via new payment methods

## Troubleshooting

### pgvector Extension Not Available

If you see "extension vector does not exist":

```sql
-- Check available extensions
SELECT * FROM pg_available_extensions WHERE name = 'vector';

-- If not available, contact Supabase support or use a database that supports pgvector
```

### RLS Policy Violations

If you encounter RLS policy errors:

```sql
-- Temporarily disable RLS (development only!)
ALTER TABLE table_name DISABLE ROW LEVEL SECURITY;

-- Re-enable after fixing policies
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;
```

### Migration Fails Mid-Way

If migration fails:

1. Check the error message carefully
2. Fix the issue (missing extension, constraint violation, etc.)
3. Drop partially created tables if needed
4. Re-run the migration

```sql
-- Drop tables in reverse dependency order
DROP TABLE IF EXISTS sections CASCADE;
DROP TABLE IF EXISTS drafts CASCADE;
DROP TABLE IF EXISTS webhook_events CASCADE;
-- etc.
```

## Post-Migration Tasks

1. **Test Authentication**: Verify email/password and magic link login
2. **Test File Upload**: Upload a PDF and verify extraction works
3. **Test RAG Search**: Perform vector + keyword hybrid search
4. **Test Payments**: Create test subscriptions via PayPal and iyzico
5. **Verify RLS**: Attempt to access another user's data (should fail)

## Support

For migration issues:
- Check Supabase logs
- Review this document
- Contact the development team

## Version History

- **v1.0** (2025-11-11): Initial migration to English-only, removed Stripe, added PayPal/iyzico
- **v0.9** (2025-01-07): Comprehensive schema with multilingual support
- **v0.1** (2025-01-06): Initial schema with profiles and AI settings
