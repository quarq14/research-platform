-- Supabase Storage Bucket Oluşturma
-- Dashboard > SQL Editor'da çalıştırın

-- 1. PDFs bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'pdfs',
  'pdfs',
  false,
  52428800, -- 50 MB
  ARRAY['application/pdf']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. Exports bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'exports',
  'exports',
  false,
  10485760, -- 10 MB
  ARRAY['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 3. Storage RLS Policies for PDFs bucket
CREATE POLICY "Users can upload own PDFs" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'pdfs' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can view own PDFs" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'pdfs' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can delete own PDFs" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'pdfs' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

-- 4. Storage RLS Policies for Exports bucket
CREATE POLICY "Users can upload own exports" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'exports' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can view own exports" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'exports' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );

CREATE POLICY "Users can delete own exports" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'exports' AND auth.uid() = (storage.foldername(name))[1]::uuid
  );
