CREATE TABLE sources (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    doi TEXT,
    title TEXT NOT NULL,
    authors TEXT[],
    journal TEXT,
    year INTEGER,
    abstract TEXT,
    pdf_url TEXT,
    csl_json JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);
