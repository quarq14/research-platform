# Release Notes - Academic Research Platform

## Version 2.0.0 (2025-11-11) - English-Only, Payment Integration Overhaul

### 🎯 Major Changes

This is a **major release** that transforms the platform into an English-only academic research platform with enhanced payment integrations and improved architecture.

### ✨ New Features

#### Language & Localization
- **English-Only Interface**: Removed Turkish language support for streamlined user experience
- Simplified localization system focused on English content
- All UI components, documentation, and user-facing text now in English

#### Authentication
- **Email/Password Authentication**: Robust email and password-based login
- **Magic Link Authentication**: Passwordless login via email links
- **Removed Google Sign-In**: Simplified authentication flow without OAuth providers

#### Payment Integration
- **PayPal Integration**: Complete subscription and one-time payment support
  - Monthly and yearly billing cycles
  - Webhook integration for real-time status updates
  - Test (sandbox) and production modes
  - Support for Free, Pro, and Team plans
- **iyzico Integration**: Turkish market payment support
  - Regional payment processing
  - Currency-aware pricing (TRY support)
  - Subscription and credit-based payments
  - Webhook event handling
- **Removed Stripe**: Eliminated Stripe dependency entirely

#### Academic Writing Features
- **Citation-Enforced Workspace**: Writing interface that validates citation presence
- **Drafts & Sections Management**: Organize academic writing by sections
- **Multiple Citation Styles**: APA, MLA, Chicago, Harvard, IEEE, Vancouver
- **Inline Citation Validation**: Real-time checks for unsourced claims

#### RAG & Search Enhancements
- **Hybrid Search**: Combined vector (pgvector) and keyword (BM25) search
- **Full-Text Search**: PostgreSQL tsvector integration for better keyword matching
- **Citation Extraction**: Automatic citation generation from retrieved sources
- **Grounding Validation**: Verify generated content matches source material

#### Database Improvements
- **pgvector Integration**: Efficient vector similarity search
- **Optimized Indexes**: HNSW index for vector search, GIN index for full-text
- **Enhanced Schema**: New tables for drafts, sections, and webhook events
- **RLS Policies**: Comprehensive row-level security for all tables

### 🔧 Improvements

#### Performance
- **Edge Runtime**: Fast streaming responses for chat and generation
- **Optimized Builds**: Reduced bundle size and improved load times
- **Connection Pooling**: Better database connection management
- **Caching Strategy**: SWR for client-side, ETag for static assets

#### Developer Experience
- **TypeScript Strict Mode**: Enhanced type safety throughout codebase
- **Improved Error Handling**: Better error messages and logging
- **Comprehensive Documentation**: MIGRATIONS.md, RUNBOOK.md, and updated README
- **Environment Variables**: Clear `.env.example` with detailed comments

#### Security
- **Enhanced RLS**: Tenant isolation enforced at database level
- **API Key Encryption**: Secure storage of user-provided API keys
- **Webhook Signature Validation**: Verify authenticity of payment webhooks
- **Rate Limiting**: Protect endpoints from abuse

### 🐛 Bug Fixes

- Fixed pricing page build error related to locale handling
- Resolved React import issues in client components
- Fixed peer dependency conflicts with React 19 and vaul
- Corrected citation rendering in various formats
- Fixed file upload timeout issues for large PDFs

### 📦 Dependencies

#### Added
- `pdf-parse@1.1.1` - PDF text extraction
- `tesseract.js@5.1.1` - OCR for scanned documents
- `docx@latest` - DOCX export generation
- `jspdf@latest` - PDF export generation

#### Updated
- `next@16.0.0` - Latest Next.js with App Router
- `react@19.2.0` - React 19 with improved streaming
- `@supabase/supabase-js@latest` - Latest Supabase client
- `@vercel/analytics@latest` - Vercel Analytics integration

#### Removed
- `stripe@*` - Removed Stripe dependency
- Turkish localization files

### 🗄️ Database Changes

See `MIGRATIONS.md` for detailed migration instructions.

**Schema Changes:**
- Removed `profiles.stripe_customer_id`
- Removed `plans.stripe_price_id_monthly` and `plans.stripe_price_id_yearly`
- Updated locale constraints to English-only
- Added `drafts` table for writing workspace
- Added `sections` table for draft organization
- Added `webhook_events` table for payment event tracking
- Enhanced `chunks` table with full-text search support

**Data Migration:**
- All existing user locales set to 'en'
- Document languages updated to 'en'
- Stripe subscriptions require manual migration to PayPal/iyzico

### 🔐 Security Updates

- Enforced RLS on all user-facing tables
- Encrypted API key storage
- Webhook signature validation
- CSRF protection on payment endpoints
- Secure file upload with MIME type validation

### 📝 API Changes

**New Endpoints:**
- `POST /api/webhooks/paypal` - PayPal webhook handler
- `POST /api/webhooks/iyzico` - iyzico webhook handler
- `POST /api/checkout/paypal` - PayPal checkout session
- `POST /api/checkout/iyzico` - iyzico checkout session
- `GET /api/user/usage` - User quota and usage stats

**Updated Endpoints:**
- `POST /api/chat-pdf` - Enhanced with hybrid search
- `POST /api/paraphrase` - Citation-preserving paraphrasing
- `POST /api/plagiarism-check` - API + heuristic fallback
- `POST /api/ai-detect` - AI content detection with disclaimers

**Removed Endpoints:**
- `/api/checkout/stripe` - Stripe integration removed
- `/api/webhooks/stripe` - Stripe webhooks removed

### 🌐 Deployment

**Vercel Configuration:**
- Optimized build settings for Next.js 16
- Edge runtime for streaming endpoints
- Node runtime for heavy processing (PDF, embeddings)
- Environment variable management via Vercel Dashboard

**Supabase Configuration:**
- PostgreSQL 15 with pgvector extension
- Storage bucket for PDF files
- RLS policies for tenant isolation
- Webhook endpoints configured

### 📖 Documentation

**New Documents:**
- `MIGRATIONS.md` - Comprehensive migration guide
- `RUNBOOK.md` - Operations and troubleshooting guide
- `RELEASE_NOTES.md` - This document
- Updated `README.md` - Simplified setup instructions
- `.env.example` - Complete environment variable reference

### ⚠️ Breaking Changes

1. **Locale API Changes**:
   - `useLocale()` no longer provides `locale` or `setLocale`
   - Always returns `locale: 'en'`
   - All locale-dependent UI should be refactored to English

2. **Payment Provider**:
   - Stripe integration completely removed
   - All Stripe-related code and environment variables removed
   - Users must re-subscribe via PayPal or iyzico

3. **Database Schema**:
   - Tables with locale/language fields now enforce English-only
   - Stripe-related columns dropped
   - Existing Stripe subscriptions need manual migration

4. **Authentication**:
   - Google Sign-In removed (use email/password or magic link)
   - Existing OAuth users need to set a password

### 🔜 Coming Soon

- **AI Detection**: Enhanced AI content detection algorithms
- **Team Collaboration**: Shared projects and real-time co-authoring
- **Advanced Citations**: Automatic citation suggestion during writing
- **LaTeX Export**: Export academic papers to LaTeX format
- **API Access**: Public API for Team plan users
- **Browser Extensions**: Chrome/Firefox extensions for research

### 📊 Known Issues

None at this time. Please report issues at: https://github.com/quarq14/research-platform/issues

### 🤝 Contributing

We welcome contributions! Please see `CONTRIBUTING.md` for guidelines.

### 📄 License

MIT License - see LICENSE file for details.

---

## Version 1.0.0 (2025-01-07) - Initial Release

### Features

- Multi-language support (English/Turkish)
- PDF upload and processing
- AI chat with multiple providers
- Academic search integration
- Basic citation management
- Stripe payments
- User profiles and settings

---

## Migration from v1.x to v2.0

1. **Backup your database** before upgrading
2. Run the migration script: `/supabase/migrations/20251111000000_english_only_no_stripe.sql`
3. Update environment variables (remove Stripe, add PayPal/iyzico)
4. Update codebase to latest
5. Test authentication flows
6. Migrate active subscriptions manually
7. Deploy to production

For detailed instructions, see `MIGRATIONS.md`.

---

**Release Date**: 2025-11-11
**Platform**: Vercel
**Database**: Supabase (PostgreSQL 15 + pgvector)
**Framework**: Next.js 16.0.0
**Maintainer**: Development Team
