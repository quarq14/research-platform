CREATE TABLE citations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    source_id UUID REFERENCES sources(id) ON DELETE SET NULL,
    style TEXT CHECK (style IN ('apa',
    'mla',
    'chicago')) DEFAULT 'apa',
    intext_citation TEXT,
    reference_citation TEXT,
    page_references TEXT[],
    created_at TIMESTAMPTZ DEFAULT NOW()
);
