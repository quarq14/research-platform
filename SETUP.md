# 🚀 Research Platform Setup Guide

## Overview

This is an AI-powered academic research platform with multi-provider AI support, ChatPDF, academic search, and writing assistance features.

## ✨ Features

- **Multiple AI Providers**: Groq (free), OpenRouter, Claude, OpenAI, Gemini
- **ChatPDF**: Chat with your uploaded documents
- **Academic Search**: Search scholarly sources via OpenAlex API
- **Writing Assistant**: AI-powered academic writing with citations
- **Plagiarism & AI Detection**: Content analysis tools
- **Citation Manager**: APA, MLA, Chicago formatting

## 🔧 Prerequisites

- Node.js 18+ and npm/yarn
- Supabase account (free tier works)
- Optional: API keys for AI providers (Groq free tier included)

## 📦 Installation

### 1. Clone the repository

```bash
git clone https://github.com/quarq14/research-platform.git
cd research-platform
```

### 2. Install dependencies

```bash
npm install
# or
yarn install
```

### 3. Setup Supabase

#### Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Wait for the project to be fully initialized

#### Get your credentials

- Go to Project Settings > API
- Copy the `Project URL` and `anon/public key`

#### Run database migrations

```bash
# Navigate to Supabase directory
cd supabase

# Run migrations (or copy SQL from migrations folder to Supabase SQL Editor)
```

**Or manually in Supabase SQL Editor:**

1. Go to your Supabase project
2. Click "SQL Editor" in the sidebar
3. Copy and paste the SQL from these files in order:
   - `supabase/migrations/1762427868_create_profiles_table.sql`
   - `supabase/migrations/20250106000000_add_ai_settings_tables.sql`
4. Click "Run" for each migration

#### Enable Storage

1. Go to Storage in Supabase dashboard
2. Create a new bucket called `pdfs`
3. Set it to **private** (authenticated users only)

### 4. Configure Environment Variables

Create a `.env.local` file in the root directory:

```bash
cp .env.example .env.local
```

Edit `.env.local` and add your credentials:

```env
# Required
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key

# Optional - Groq (free tier embedded, but you can add your own)
API_KEY_GROQ_API_KEY=your_groq_key

# Optional - Other AI providers
OPENROUTER_API_KEY=your_key
ANTHROPIC_API_KEY=your_key
OPENAI_API_KEY=your_key
GOOGLE_API_KEY=your_key
```

**Note**: Users can add their own API keys through the Settings UI without needing server environment variables.

### 5. Run the development server

```bash
npm run dev
# or
yarn dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🤖 AI Provider Setup

### Free Option: Groq (Recommended for Testing)

The platform includes an embedded Groq API key for immediate use. No setup required!

### Adding Your Own API Keys

Users can add their own API keys in two ways:

#### Option 1: Through the UI (Recommended)

1. Sign up and log in
2. Go to Settings > AI Settings
3. Select your preferred AI provider
4. Enter your API key
5. Save

#### Option 2: Environment Variables

Add to `.env.local`:

```env
API_KEY_GROQ_API_KEY=your_key        # Groq
OPENROUTER_API_KEY=your_key          # OpenRouter
ANTHROPIC_API_KEY=your_key           # Claude
OPENAI_API_KEY=your_key              # OpenAI
GOOGLE_API_KEY=your_key              # Gemini
```

### Getting API Keys

- **Groq**: [console.groq.com](https://console.groq.com) (Free tier: 14,400 requests/day)
- **OpenRouter**: [openrouter.ai/keys](https://openrouter.ai/keys)
- **Claude**: [console.anthropic.com](https://console.anthropic.com)
- **OpenAI**: [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
- **Gemini**: [makersuite.google.com/app/apikey](https://makersuite.google.com/app/apikey)

## 🗄️ Database Schema

The platform uses the following main tables:

- `profiles` - User profiles and usage stats
- `user_settings` - AI provider preferences
- `api_keys` - User API keys (encrypted)
- `files` - Uploaded PDF files
- `chunks` - PDF content chunks for RAG
- `messages` - Chat history
- `documents` - User-created documents
- `sources` - Academic sources
- `citations` - Citation records

## 🚀 Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import project in Vercel
3. Add environment variables in Vercel dashboard
4. Deploy

### Deploy to Netlify

```bash
npm run build
netlify deploy --prod
```

### Deploy to Other Platforms

Build the app:

```bash
npm run build
npm start
```

## 🔒 Security Notes

- API keys entered through the UI are stored encrypted in Supabase
- Row Level Security (RLS) is enabled on all tables
- Users can only access their own data
- File storage is private and authenticated

## 📝 Usage

### Upload and Chat with PDFs

1. Go to **Upload** page
2. Upload a PDF file
3. Go to **Chat** page
4. Select your document
5. Start asking questions!

### Academic Search

1. Go to **Sources** page
2. Enter search keywords
3. Browse results from OpenAlex
4. Add to your citations

### Writing Assistant

1. Go to **Write** page
2. Create a new document
3. Use AI writing assistance
4. Export to DOCX or PDF

### Change AI Provider

1. Go to **Settings** > **AI Settings**
2. Choose your provider
3. Select model
4. Save preferences

## 🛠️ Troubleshooting

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

## 📚 Tech Stack

- **Framework**: Next.js 16 (App Router)
- **Database**: Supabase (PostgreSQL)
- **Auth**: Supabase Auth
- **AI**: Groq, OpenRouter, Claude, OpenAI, Gemini
- **UI**: Radix UI + Tailwind CSS
- **Language**: TypeScript

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📄 License

MIT License

## 🙋 Support

For issues and questions:
- GitHub Issues: [github.com/quarq14/research-platform/issues](https://github.com/quarq14/research-platform/issues)

---

Built with ❤️ using Next.js and Supabase
