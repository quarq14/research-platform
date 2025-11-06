CREATE TABLE documents (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT,
    language TEXT DEFAULT 'tr',
    type TEXT CHECK (type IN ('article',
    'review',
    'assignment',
    'blog')) DEFAULT 'article',
    status TEXT CHECK (status IN ('draft',
    'published',
    'archived')) DEFAULT 'draft',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);
