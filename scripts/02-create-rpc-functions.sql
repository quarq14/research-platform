-- RPC functions for efficient database operations

-- Function to increment profile stats
CREATE OR REPLACE FUNCTION increment_profile_stats(
  p_user_id UUID,
  p_pages INTEGER DEFAULT 0,
  p_documents INTEGER DEFAULT 0,
  p_words INTEGER DEFAULT 0,
  p_searches INTEGER DEFAULT 0
)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET
    pages_uploaded = pages_uploaded + p_pages,
    documents_used = documents_used + p_documents,
    word_count_used = word_count_used + p_words,
    searches_used = searches_used + p_searches,
    updated_at = NOW()
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function for vector similarity search (when pgvector is properly configured)
CREATE OR REPLACE FUNCTION match_chunks(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_file_id UUID DEFAULT NULL
)
RETURNS TABLE (
  id UUID,
  file_id UUID,
  content TEXT,
  page_number INTEGER,
  similarity FLOAT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    chunks.id,
    chunks.file_id,
    chunks.content,
    chunks.page_number,
    1 - (chunks.embedding <=> query_embedding) AS similarity
  FROM chunks
  WHERE 
    (filter_file_id IS NULL OR chunks.file_id = filter_file_id)
    AND 1 - (chunks.embedding <=> query_embedding) > match_threshold
  ORDER BY chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$ LANGUAGE plpgsql;
