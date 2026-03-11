-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to tasks table
-- text-embedding-004 produces 768-dimensional vectors
ALTER TABLE public.tasks 
ADD COLUMN IF NOT EXISTS embedding vector(768);

-- Function to search tasks using semantic similarity
CREATE OR REPLACE FUNCTION match_tasks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  type text,
  due_date timestamp with time zone,
  status text,
  similarity float
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    t.id,
    t.title,
    t.description,
    t.type,
    t.due_date,
    t.status,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM public.tasks t
  WHERE t.user_id = p_user_id
    AND t.embedding IS NOT NULL
    AND 1 - (t.embedding <=> query_embedding) > match_threshold
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;

-- Create an HNSW index for faster vector search
CREATE INDEX IF NOT EXISTS idx_tasks_embedding ON public.tasks 
USING hnsw (embedding vector_cosine_ops);
