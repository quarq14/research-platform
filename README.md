# Academic Research Platform

A comprehensive AI-powered academic writing and research platform built with Next.js 15, Supabase, and multiple LLM providers.

## Features

### Core Functionality
- **🤖 Site-Wide AI Chatbot**: Context-aware AI assistant that follows you across the platform
  - Free Groq provider by default (no API key needed!)
  - Bring your own API keys: OpenAI, Claude (Anthropic), Gemini, OpenRouter
  - Automatic fallback to free provider if your key fails
  - Tracks conversation context and provides intelligent help
- **Multi-PDF Chat**: Upload and chat with multiple PDFs using RAG (Retrieval Augmented Generation)
- **Scholarly Search**: Search academic papers from Semantic Scholar, OpenAlex, and Crossref
- **Citation Management**: Generate citations in APA, MLA, Chicago, IEEE, and Harvard formats
- **Academic Writing**: AI-assisted writing with proper citations and reference management
- **Plagiarism Detection**: Integrated plagiarism checking with API fallbacks
- **AI Content Detection**: Detect AI-generated content with disclaimers
- **Paraphrasing Tools**: Improve clarity and naturalness while maintaining academic integrity
- **Export Functionality**: Export to DOCX, PDF, and Markdown formats

### Technical Stack
- **Frontend**: Next.js 15 (App Router), TypeScript, React 19, Tailwind CSS, shadcn/ui
- **Backend**: Next.js API Routes, Server Actions, Edge Functions
- **Database**: Supabase (PostgreSQL with pgvector extension for RAG)
- **Authentication**: Supabase Auth (Email/Password)
- **LLM Providers**:
  - **Groq** (default FREE provider - no API key needed!)
  - **Claude** (Anthropic) - Bring your own API key
  - **Gemini** (Google) - Bring your own API key
  - **OpenAI** - Bring your own API key
  - **OpenRouter** - Access multiple models with one key
  - **MiniMax M2** (for advanced agentic tasks with interleaved thinking)
- **Embeddings**: Simple hash-based (free), OpenAI, Nomic
- **Payments**: Stripe, PayPal, iyzico
- **PDF Processing**: pdf.js, pdf-parse, Tesseract.js for OCR
- **Monitoring**: Sentry, Vercel Analytics, Speed Insights

## Getting Started

### Prerequisites
- Node.js 18+
- pnpm (recommended) or npm
- Supabase account
- Vercel account (for deployment)

### Environment Variables

Create a `.env.local` file based on `.env.example`:

```bash
# Site Configuration
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME="Academic Research Platform"

# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# LLM Providers (Groq is the default free provider)
GROQ_API_KEY=your_groq_api_key
MINIMAX_API_KEY=your_minimax_api_key
OPENAI_API_KEY=optional_openai_key
OPENROUTER_API_KEY=optional_openrouter_key

# Payment Providers
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key

PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox

IYZICO_API_KEY=your_iyzico_api_key
IYZICO_SECRET_KEY=your_iyzico_secret_key

# Optional Services
COPYLEAKS_API_KEY=optional_copyleaks_key
SENTRY_DSN=optional_sentry_dsn
```

### Installation

1. Install dependencies:
```bash
pnpm install
```

2. Set up Supabase:
```bash
# Run database migrations
psql -h your_supabase_host -U postgres -d postgres -f supabase/migrations/20250101000000_comprehensive_schema.sql
```

3. Run development server:
```bash
pnpm dev
```

4. Open [http://localhost:3000](http://localhost:3000)

## Database Schema

The platform uses a comprehensive PostgreSQL schema with the following main tables:

- **profiles**: User profiles with usage counters and plan information
- **documents**: User-uploaded documents and drafts
- **files**: File metadata for PDF uploads
- **chunks**: Text chunks with embeddings for RAG
- **sources**: Scholarly sources from academic APIs
- **citations**: Citation records with various styles
- **chats**: Chat sessions
- **messages**: Chat messages with citations
- **subscriptions**: User subscriptions
- **usage_events**: Usage tracking
- **invoices**: Payment records

All tables have Row Level Security (RLS) enabled for data isolation.

## API Routes

### Upload API
`POST /api/upload` - Upload and process PDF files
- Extracts text, creates chunks, generates embeddings
- Returns document ID and metadata

### Chat API
`POST /api/chat` - Chat with uploaded PDFs
- Performs vector similarity search
- Returns AI response with citations
- Tracks token usage

### Scholarly Search API
`GET /api/search/scholarly?q=query` - Search academic papers
- Searches Semantic Scholar, OpenAlex, Crossref
- Returns papers with formatted citations

### Webhooks
`POST /api/webhooks/stripe` - Stripe webhook handler
- Processes subscription events
- Updates user plans and billing

## Payment Integration

### Subscription Plans

1. **Free Plan**
   - 100,000 tokens/month
   - 50 pages/month
   - 20 searches/month
   - Basic features

2. **Pro Plan** ($19.99/month)
   - 1,000,000 tokens/month
   - 500 pages/month
   - 200 searches/month
   - Advanced features
   - Plagiarism checking
   - AI detection

3. **Enterprise Plan** ($99.99/month)
   - Unlimited usage
   - Dedicated support
   - Custom integrations
   - SSO

## Deployment

### Vercel Deployment

1. Connect your GitHub repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy:

```bash
vercel --prod
```

### Post-Deployment

1. Configure Stripe webhooks to point to `https://your-domain.com/api/webhooks/stripe`
2. Set up Supabase storage buckets:
   - `documents` bucket for PDF files
3. Enable pgvector extension in Supabase

## Features Overview

### PDF Processing
- Supports PDF upload up to 50MB
- Text extraction with page numbers
- OCR fallback for scanned PDFs
- Automatic chunking for RAG

### RAG Pipeline
- Hybrid search (vector + keyword)
- Cosine similarity matching
- Source grounding with page numbers
- Citation extraction

### Citation Management
- Multiple citation styles
- In-text and reference list generation
- DOI extraction and validation
- Bibliography export

### Academic Integrity
- Plagiarism detection with API integration
- AI content detection with disclaimers
- "Humanizer" for clarity improvement
- Disclosure tools for academic honesty

## Architecture

```
┌─────────────────┐
│   Next.js App   │
│   (Frontend)    │
└────────┬────────┘
         │
    ┌────┴────┐
    │   API   │
    │  Routes │
    └────┬────┘
         │
    ┌────┴──────────────┬─────────────┬──────────────┐
    │                   │             │              │
┌───▼────┐      ┌──────▼─────┐  ┌───▼───┐   ┌──────▼─────┐
│Supabase│      │LLM Providers│  │Scholar│   │  Payment   │
│Database│      │(Groq/MiniMax│  │  APIs │   │  Providers │
│+pgvector      │ /OpenRouter)│  │       │   │(Stripe/etc)│
└────────┘      └─────────────┘  └───────┘   └────────────┘
```

## Security

- Row Level Security (RLS) on all tables
- Encrypted API keys storage
- Signed URLs for file access
- Rate limiting per user/plan
- CORS configuration
- Input validation with Zod

## Contributing

This project is part of a larger research platform initiative. Contributions are welcome!

## License

MIT License - see LICENSE file for details

## Support

For issues and feature requests, please use the GitHub Issues page.

## Acknowledgments

- Supabase for database and authentication
- Vercel for hosting and deployment
- Groq for free LLM access
- Semantic Scholar, OpenAlex, and Crossref for academic data
- shadcn/ui for UI components
