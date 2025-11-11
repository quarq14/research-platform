# 🎓 Academic AI Research Platform

A comprehensive, production-ready AI-powered academic writing and research platform with multilingual support (English/Turkish), multiple AI providers, scholarly search, citation management, and advanced research tools.

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![License](https://img.shields.io/badge/license-MIT-green)
![Next.js](https://img.shields.io/badge/Next.js-16.0-black)
![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)

## ✨ Features

### 🤖 Multiple AI Providers
- **Groq** (Free tier included)
- **OpenAI** (GPT-4, GPT-4o-mini)
- **Claude** (Anthropic)
- **Gemini** (Google)
- **OpenRouter** (Multi-model access)
- **MiniMax** (M2 Agent with interleaved thinking)

### 📚 Academic Research Tools
- **Multi-PDF Upload & Processing** with OCR support
- **Chat with PDFs** using RAG (Retrieval-Augmented Generation)
- **Scholarly Search** (Semantic Scholar, OpenAlex, Crossref)
- **Citation Manager** (APA, MLA, Chicago, Harvard, IEEE, Vancouver)
- **Plagiarism Detection** with multiple algorithms
- **AI Content Detection** with disclaimers
- **Advanced Filtering** (year range, source type, venue)

### ✍️ Writing Tools
- **AI Writing Assistant** for multiple document types:
  - Academic Articles
  - Literature Reviews
  - Assignments
  - Blog Posts
  - Book Chapters
  - Thesis
- **Paraphrasing Tool** for clarity
- **Text Analysis** and summarization
- **Export** to DOCX, PDF, Markdown

### 💳 Payment Integration
- **Stripe** (Primary payment processor)
- **PayPal** (Alternative processor)
- **iyzico** (Turkish market)
- Subscription and one-time payment support

### 🌍 Multilingual Support
- Full **English** and **Turkish** interface
- Auto-detection based on browser language
- Language switcher
- Currency support (USD / Turkish Lira)

### 🔒 Security & Privacy
- Row Level Security (RLS) in Supabase
- Encrypted API key storage
- Secure authentication (email/password)
- Data isolation per user

### 🔌 MCP Integration
- **Model Context Protocol (MCP)** support for AI assistants
- Direct database access for Claude Code and other MCP-compatible tools
- Secure connection with service role authentication
- Real-time data queries and schema exploration

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or pnpm
- Supabase account (free tier works)
- At least one AI provider API key (Groq recommended for free tier)

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/quarq14/research-platform.git
cd research-platform
```

2. **Install dependencies**
```bash
npm install
# or
pnpm install
```

3. **Set up environment variables**
```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:
```env
# Required
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key

# At least one AI provider (Groq is free)
GROQ_API_KEY=your_groq_api_key
```

4. **Set up Supabase**

Run the migrations in your Supabase SQL Editor:
- `supabase/migrations/1762427868_create_profiles_table.sql`
- `supabase/migrations/20250106000000_add_ai_settings_tables.sql`
- `supabase/migrations/20250107000000_comprehensive_schema.sql`

Create storage bucket:
- Go to Supabase Storage
- Create a bucket named `pdfs`
- Set to private (authenticated users only)

5. **Configure MCP (Optional)**

For AI assistant integration (Claude Code, etc.):
- MCP configuration is pre-configured in `.claude/mcp.json`
- Update your `.env.local` with Supabase credentials
- See `MCP_INTEGRATION.md` for detailed setup

6. **Run the development server**
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📖 Documentation

### Setup Guides
- `SETUP.md` - General setup instructions
- `SUPABASE_SETUP.md` - Supabase configuration guide
- `MCP_INTEGRATION.md` - Model Context Protocol integration
- `DATABASE_SETUP.md` - Database schema and migrations

### Core Services

#### PDF Processing
```typescript
import { processPDF } from '@/lib/services/pdf-processor'

const result = await processPDF(buffer, {
  chunkSize: 1000,
  chunkOverlap: 200,
  enableOCR: true
})
```

#### Embeddings
```typescript
import { processChunksWithEmbeddings } from '@/lib/services/embeddings'

await processChunksWithEmbeddings(supabase, fileId, {
  provider: 'openai',
  apiKey: process.env.OPENAI_API_KEY
})
```

#### RAG Search
```typescript
import { buildRAGContext } from '@/lib/services/rag'

const context = await buildRAGContext(supabase, query, {
  fileIds: [fileId],
  limit: 10,
  rerank: true
})
```

#### Academic Search
```typescript
import { multiSourceSearch } from '@/lib/services/academic-search'

const results = await multiSourceSearch(query, {
  yearStart: 2020,
  limit: 20
})
```

#### Citations
```typescript
import { generateBibliography } from '@/lib/services/citations'

const bib = await generateBibliography(sources, {
  style: 'apa',
  format: 'html'
})
```

### AI Providers

```typescript
import { createAIProvider } from '@/lib/ai/providers'

const provider = createAIProvider('groq', apiKey)
const response = await provider.generateCompletion({
  messages: [
    { role: 'user', content: 'Hello!' }
  ],
  temperature: 0.7
})
```

### Payment Integration

```typescript
import { stripeService } from '@/lib/payments/stripe'

const session = await stripeService.createCheckoutSession({
  priceId: 'price_xxx',
  userId: user.id,
  email: user.email,
  successUrl: '/dashboard?success=true',
  cancelUrl: '/pricing'
})
```

## 🗄️ Database Schema

### Key Tables
- `profiles` - User profiles with usage tracking
- `documents` - User-created documents
- `files` - Uploaded PDF files
- `chunks` - PDF content chunks with embeddings (pgvector)
- `sources` - Academic sources
- `citations` - Citation records
- `chats` - Chat sessions
- `messages` - Chat messages with citations
- `subscriptions` - User subscriptions
- `invoices` - Payment invoices

## 🎨 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript 5
- **Database**: Supabase (PostgreSQL + pgvector)
- **Authentication**: Supabase Auth
- **UI**: Radix UI + Tailwind CSS
- **Icons**: Lucide React
- **Forms**: React Hook Form + Zod
- **AI**: Multiple providers (Groq, OpenAI, Claude, Gemini, etc.)
- **Payments**: Stripe, PayPal, iyzico
- **Analytics**: Vercel Analytics

## 📊 Pricing Plans

### Free
- 50,000 tokens/month
- 20 pages upload
- 10 searches/month
- Basic features

### Pro ($19.99/month or 399₺/month)
- 1,000,000 tokens/month
- 500 pages upload
- 500 searches/month
- All AI providers
- Plagiarism checking (50 checks)
- Priority support

### Team ($49.99/month or 999₺/month)
- 5,000,000 tokens/month
- 2,000 pages upload
- 2,000 searches/month
- All Pro features
- Team collaboration
- Admin dashboard
- API access

## 🌐 Deployment

### Vercel (Recommended)

1. Push to GitHub
2. Import project in Vercel
3. Add environment variables
4. Deploy

### Environment Variables for Production

Add all variables from `.env.example` to your deployment platform.

**Required:**
- Supabase credentials
- At least one AI provider API key
- Stripe keys (for payments)

**Optional but Recommended:**
- OpenAI API key (for embeddings)
- Copyleaks API key (for plagiarism)
- Sentry DSN (for monitoring)

## 🧪 Testing

```bash
# Run linter
npm run lint

# Build for production
npm run build

# Start production server
npm start
```

## 🔧 Troubleshooting

### Supabase Connection Issues
- Verify your `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Check if migrations were run successfully
- Ensure RLS policies are enabled

### AI API Errors
- Verify API keys are correct
- Check rate limits for your provider
- Try using Groq (free) if other providers fail

### Build Errors
```bash
# Clear cache and reinstall
rm -rf .next node_modules
npm install
npm run dev
```

## 📝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License - see LICENSE file for details

## 🙋 Support

For issues and questions:
- GitHub Issues: [github.com/quarq14/research-platform/issues](https://github.com/quarq14/research-platform/issues)

## 🙏 Acknowledgments

- Supabase for the amazing backend platform
- Vercel for hosting and analytics
- All the AI provider teams (Groq, OpenAI, Anthropic, Google, etc.)
- The open-source community

---

Built with ❤️ for researchers, students, and writers worldwide.
