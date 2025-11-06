CREATE TABLE files (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    storage_path TEXT NOT NULL,
    filename TEXT NOT NULL,
    mime_type TEXT NOT NULL,
    size_bytes BIGINT NOT NULL,
    pages INTEGER DEFAULT 0,
    ocr_applied BOOLEAN DEFAULT FALSE,
    hash TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
