-- migrations/20240214_enhance_schema.sql

-- Add metadata columns to memories
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS priority text DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS status text DEFAULT 'active', -- 'active', 'completed', 'archived'
  ADD COLUMN IF NOT EXISTS due_date timestamp with time zone,
  ADD COLUMN IF NOT EXISTS people text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS parent_id uuid REFERENCES memories(id),
  ADD COLUMN IF NOT EXISTS source text DEFAULT 'voice', -- 'voice', 'text', 'import'
  ADD COLUMN IF NOT EXISTS updated_at timestamp with time zone DEFAULT timezone('utc'::text, now());

-- Index for common queries
CREATE INDEX IF NOT EXISTS idx_memories_user_type ON memories(user_id, type);
CREATE INDEX IF NOT EXISTS idx_memories_user_status ON memories(user_id, status);
CREATE INDEX IF NOT EXISTS idx_memories_due_date ON memories(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_memories_people ON memories USING gin(people);
CREATE INDEX IF NOT EXISTS idx_memories_tags ON memories USING gin(tags);

-- HNSW index for faster vector search (pgvector 0.5.0+)
CREATE INDEX IF NOT EXISTS idx_memories_embedding ON memories
  USING hnsw (embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- Updated search function with filters
CREATE OR REPLACE FUNCTION match_memories_filtered(
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_types text[] DEFAULT NULL,
  p_status text DEFAULT NULL,
  p_tags text[] DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  content text,
  type text,
  priority text,
  status text,
  due_date timestamp with time zone,
  people text[],
  tags text[],
  created_at timestamp with time zone,
  similarity float
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
    SELECT
      m.id,
      m.content,
      m.type,
      m.priority,
      m.status,
      m.due_date,
      m.people,
      m.tags,
      m.created_at,
      1 - (m.embedding <=> query_embedding) AS similarity
    FROM memories m
    WHERE m.user_id = p_user_id
      AND 1 - (m.embedding <=> query_embedding) > match_threshold
      AND (p_types IS NULL OR m.type = ANY(p_types))
      AND (p_status IS NULL OR m.status = p_status)
      AND (p_tags IS NULL OR m.tags && p_tags) -- && = overlap operator
    ORDER BY m.embedding <=> query_embedding
    LIMIT match_count;
END;
$$;

-- Row Level Security
ALTER TABLE memories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access own memories"
  ON memories FOR ALL
  USING (auth.uid() = user_id);

-- Function to get overdue items
CREATE OR REPLACE FUNCTION get_overdue_items(p_user_id uuid)
RETURNS TABLE (
  id uuid,
  content text,
  type text,
  priority text,
  due_date timestamp with time zone,
  days_overdue int
) LANGUAGE sql STABLE AS $$
  SELECT
    m.id,
    m.content,
    m.type,
    m.priority,
    m.due_date,
    EXTRACT(DAY FROM now() - m.due_date)::int AS days_overdue
  FROM memories m
  WHERE m.user_id = p_user_id
    AND m.status = 'active'
    AND m.due_date < now()
  ORDER BY m.due_date ASC;
$$;