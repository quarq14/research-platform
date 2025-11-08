-- AI Writing PDFs Table
-- Stores uploaded PDF documents for AI writing assistance
-- Timestamp: 2025-01-08

-- Create writing_pdfs table
CREATE TABLE IF NOT EXISTS writing_pdfs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size BIGINT NOT NULL,
  title TEXT,
  author TEXT,
  page_count INTEGER DEFAULT 0,
  text_content TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_writing_pdfs_user_id ON writing_pdfs(user_id);
CREATE INDEX IF NOT EXISTS idx_writing_pdfs_created_at ON writing_pdfs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_writing_pdfs_title ON writing_pdfs USING gin(to_tsvector('english', title));

-- Create storage bucket for research PDFs
INSERT INTO storage.buckets (id, name, public)
VALUES ('research-pdfs', 'research-pdfs', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for research-pdfs bucket
CREATE POLICY "Users can upload their own PDFs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'research-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can view their own PDFs"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'research-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update their own PDFs"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'research-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete their own PDFs"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'research-pdfs' AND
  (storage.foldername(name))[1] = auth.uid()::text
);

-- Row Level Security (RLS) Policies for writing_pdfs table
ALTER TABLE writing_pdfs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own PDFs"
ON writing_pdfs FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own PDFs"
ON writing_pdfs FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own PDFs"
ON writing_pdfs FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own PDFs"
ON writing_pdfs FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_writing_pdfs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_writing_pdfs_timestamp
BEFORE UPDATE ON writing_pdfs
FOR EACH ROW
EXECUTE FUNCTION update_writing_pdfs_updated_at();

-- Add comments for documentation
COMMENT ON TABLE writing_pdfs IS 'Stores PDF documents uploaded for AI writing assistance';
COMMENT ON COLUMN writing_pdfs.id IS 'Unique identifier for the PDF';
COMMENT ON COLUMN writing_pdfs.user_id IS 'Reference to the user who uploaded the PDF';
COMMENT ON COLUMN writing_pdfs.file_name IS 'Original filename of the uploaded PDF';
COMMENT ON COLUMN writing_pdfs.file_url IS 'Public URL to access the PDF in storage';
COMMENT ON COLUMN writing_pdfs.file_size IS 'Size of the PDF file in bytes';
COMMENT ON COLUMN writing_pdfs.title IS 'Extracted title from PDF metadata';
COMMENT ON COLUMN writing_pdfs.author IS 'Extracted author from PDF metadata';
COMMENT ON COLUMN writing_pdfs.page_count IS 'Number of pages in the PDF';
COMMENT ON COLUMN writing_pdfs.text_content IS 'Extracted text content from the PDF';
COMMENT ON COLUMN writing_pdfs.metadata IS 'Additional metadata extracted from PDF (JSON)';
