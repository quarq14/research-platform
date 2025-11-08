# AI Writing Feature - Advanced Academic Writing Assistant

## 🎯 Overview

The AI Writing feature is a sophisticated academic writing assistant that helps researchers and students generate high-quality academic content with proper citations from their uploaded PDF library. It uses Groq's free AI models to generate content while ensuring all information is properly cited from source documents.

## ✨ Key Features

### 1. **PDF Library Management**
- Upload multiple PDF research papers and articles
- Automatic text extraction and metadata parsing
- Select specific sources for each writing task
- View uploaded PDFs with title, author, and page count

### 2. **Advanced AI Writing Generation**
- **Topic-based generation**: Specify your research topic or question
- **Customizable word count**: Set target length (100-10,000 words)
- **Multi-language support**: Write in English or Turkish
- **Citation styles**: APA, MLA, Chicago, IEEE
- **Document types**: Article, Literature Review, Essay, Thesis
- **Custom instructions**: Add specific requirements or focus areas

### 3. **Intelligent Citation System**
- Automatic citation from uploaded PDF sources
- Proper academic formatting (APA, MLA, Chicago, IEEE)
- Bibliography generation
- Only uses information from uploaded sources (no hallucination)
- Inline citations with source tracking

### 4. **Real-time AI Assistant Chatbot**
- Side panel AI assistant for writing guidance
- Context-aware responses based on selected PDFs
- Streaming responses for real-time interaction
- Multi-language support (Turkish/English)
- Academic writing tips and suggestions

### 5. **Free AI Models (Groq)**
- **Llama 3.3 70B Versatile** (Recommended)
- **Llama 3.1 70B Versatile**
- **Mixtral 8x7B**
- No usage limits or costs

## 🚀 Getting Started

### Prerequisites

1. **Environment Variables**
   Add the following to your `.env.local`:
   ```env
   # Groq API (Free)
   GROQ_API_KEY=your_groq_api_key_here

   # Supabase (Already configured)
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

2. **Get Groq API Key (Free)**
   - Visit: https://console.groq.com
   - Sign up for a free account
   - Navigate to API Keys section
   - Create a new API key
   - Copy and paste into `.env.local`

### Database Setup

Run the migration to create the necessary tables:

```bash
# Apply the migration
npx supabase db push

# Or if using Supabase CLI
supabase migration up
```

The migration creates:
- `writing_pdfs` table for storing PDF metadata
- Storage bucket `research-pdfs` for PDF files
- Proper RLS policies for security
- Indexes for performance

## 📖 How to Use

### Step 1: Upload PDF Sources

1. Navigate to the **Write** page
2. Click on the **PDF Library** tab
3. Click **Upload PDFs** button
4. Select one or more PDF research papers
5. Wait for upload and text extraction to complete

### Step 2: Configure Writing Parameters

1. Go to the **Setup** tab
2. Fill in the following:
   - **Topic**: Your research question or topic
   - **Word Count**: Target length (e.g., 1000)
   - **Language**: English or Türkçe
   - **Citation Style**: APA, MLA, Chicago, or IEEE
   - **Document Type**: Article, Review, Essay, or Thesis
   - **Additional Instructions**: (Optional) Specific requirements

3. Select your AI Model (default: Llama 3.3 70B)

### Step 3: Select PDF Sources

1. Go to **PDF Library** tab
2. Click on PDFs you want to use as sources
3. Selected PDFs will be highlighted
4. You can select multiple PDFs

### Step 4: Generate Content

1. Return to **Setup** tab
2. Click **Generate Academic Content**
3. Wait for AI to generate content (10-60 seconds)
4. View generated content in **Generated Content** tab

### Step 5: Review and Edit

1. Go to **Generated Content** tab
2. Review the generated text and citations
3. Edit the content as needed
4. View the bibliography section
5. Export as needed

### Step 6: Use AI Assistant (Optional)

1. The AI Assistant panel is on the right side
2. Ask questions about:
   - How to improve specific sections
   - Citation recommendations
   - Structure improvements
   - Academic writing best practices
3. The assistant has context of your selected PDFs
4. Responses stream in real-time

## 🎨 Features Breakdown

### PDF Processing
- **Text Extraction**: Uses `pdf-parse` library
- **Metadata Extraction**: Author, title, page count
- **OCR Support**: For scanned documents (when enabled)
- **Chunking**: Intelligent text chunking for large documents

### Citation Engine
- **Multiple Formats**: APA 7th, MLA 9th, Chicago 17th, IEEE
- **In-text Citations**: Proper parenthetical citations
- **Bibliography**: Automatic reference list generation
- **CSL Compatible**: Uses Citation Style Language

### AI Generation
- **Context-Aware**: Uses only uploaded PDF content
- **Citation Tracking**: Every claim is cited
- **Academic Tone**: Maintains scholarly language
- **Structured Output**: Proper paragraphs and sections

### Chat Assistant
- **Streaming Responses**: Real-time text generation
- **PDF Context**: References your uploaded sources
- **Multi-turn Conversations**: Maintains conversation history
- **Writing Guidance**: Academic writing tips and suggestions

## 🔧 Technical Architecture

### API Endpoints

#### 1. Upload PDF
```
POST /api/ai-writing/upload-pdf
GET  /api/ai-writing/upload-pdf
```

**Upload Request:**
```typescript
FormData {
  file: File (PDF)
}
```

**Response:**
```typescript
{
  success: boolean
  pdf: {
    id: string
    fileName: string
    pageCount: number
    title: string
    author: string
    uploadedAt: string
  }
}
```

#### 2. Generate Content
```
POST /api/ai-writing/generate
```

**Request:**
```typescript
{
  topic: string
  wordCount: number
  language: "tr" | "en"
  citationStyle: "apa" | "mla" | "chicago" | "ieee"
  selectedPDFs: string[]
  model?: string
  instructions?: string
  documentType?: "article" | "review" | "essay" | "thesis"
}
```

**Response:**
```typescript
{
  success: boolean
  content: string
  bibliography: string
  metadata: {
    topic: string
    wordCount: number
    language: string
    citationStyle: string
    sourcesUsed: number
    model: string
    generatedAt: string
  }
  sources: Array<{
    id: number
    title: string
    author: string
    citation: string
  }>
}
```

#### 3. Chat Assistant
```
POST /api/ai-writing/chat
```

**Request:**
```typescript
{
  messages: Array<{
    role: "user" | "assistant"
    content: string
  }>
  selectedPDFs?: string[]
  model?: string
  language?: "tr" | "en"
}
```

**Response:** Streaming text response

### Components

#### AIWritingWorkspace
Main component that orchestrates the entire feature:
- `/components/ai-writing/advanced-writing-workspace.tsx`

Features:
- PDF library management
- Writing parameter configuration
- Content generation
- AI chat assistant
- Resizable panels
- Tab-based navigation

### Database Schema

#### writing_pdfs Table
```sql
{
  id: UUID (Primary Key)
  user_id: UUID (Foreign Key -> auth.users)
  file_name: TEXT
  file_url: TEXT
  file_size: BIGINT
  title: TEXT
  author: TEXT
  page_count: INTEGER
  text_content: TEXT
  metadata: JSONB
  created_at: TIMESTAMP
  updated_at: TIMESTAMP
}
```

## 🎯 Best Practices

### For Users

1. **Upload Quality Sources**
   - Use peer-reviewed academic papers
   - Ensure PDFs have readable text (not just scanned images)
   - Upload relevant sources to your topic

2. **Be Specific with Topics**
   - Clear research questions work best
   - Provide context in additional instructions
   - Specify the scope you want to cover

3. **Select Appropriate Sources**
   - Choose 2-5 highly relevant PDFs
   - More sources = more context but slower generation
   - Quality over quantity

4. **Review Generated Content**
   - Always review AI-generated text
   - Verify citations are accurate
   - Edit for your specific needs
   - Add your own analysis and insights

5. **Use the AI Assistant**
   - Ask for clarification on sources
   - Request improvements to specific sections
   - Get suggestions for structure

### For Developers

1. **Error Handling**
   - All API endpoints have comprehensive error handling
   - User-friendly error messages
   - Proper HTTP status codes

2. **Performance**
   - PDF text is cached in database
   - Chunking for large documents
   - Streaming for chat responses

3. **Security**
   - Row Level Security (RLS) on all tables
   - User can only access their own PDFs
   - File upload validation
   - API authentication required

4. **Scalability**
   - Uses Supabase Storage for PDFs
   - Indexed database queries
   - Efficient PDF processing

## 🐛 Troubleshooting

### PDF Upload Issues

**Problem**: PDF upload fails
- **Solution**: Check file size (max 10MB recommended)
- **Solution**: Ensure PDF is not password-protected
- **Solution**: Verify Supabase storage bucket exists

### Generation Issues

**Problem**: Content generation fails
- **Solution**: Verify GROQ_API_KEY is set correctly
- **Solution**: Check if PDFs are selected
- **Solution**: Ensure topic field is not empty
- **Solution**: Try with fewer PDFs initially

### Citation Issues

**Problem**: Citations not appearing
- **Solution**: Ensure PDFs have extractable metadata
- **Solution**: Try different citation style
- **Solution**: Verify PDFs contain relevant information

### Chat Issues

**Problem**: Chat responses not streaming
- **Solution**: Check browser console for errors
- **Solution**: Verify GROQ_API_KEY is valid
- **Solution**: Ensure PDFs are selected for context

## 📊 Limitations

1. **PDF Processing**
   - Scanned PDFs may require OCR (not fully implemented)
   - Very large PDFs (>100 pages) may be slow
   - Password-protected PDFs are not supported

2. **AI Generation**
   - Limited to content from uploaded PDFs
   - Quality depends on source material quality
   - May need manual editing for flow
   - Citations are generated, not extracted

3. **Context Length**
   - Large PDFs are truncated (first ~3000 chars per PDF)
   - Chat context limited by model context window
   - Very long conversations may lose early context

## 🔮 Future Enhancements

- [ ] Advanced OCR for scanned documents
- [ ] PDF annotation and highlighting
- [ ] Export to Word with formatted citations
- [ ] Multi-document comparison
- [ ] Citation verification against original text
- [ ] Plagiarism checking
- [ ] Outline generation before writing
- [ ] Version control for generated documents
- [ ] Collaborative writing features
- [ ] Integration with reference managers (Zotero, Mendeley)

## 📝 License

This feature is part of the Research Platform and follows the same license.

## 🤝 Contributing

Contributions are welcome! Please see the main project README for contribution guidelines.

---

**Powered by:**
- Groq AI (Free Llama 3.3 70B model)
- Next.js 16
- Supabase
- pdf-parse
- TypeScript
