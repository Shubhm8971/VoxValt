-- Enhanced Advanced Search & Memory Archive Schema
-- Add comprehensive search capabilities and memory archiving

-- Update memories table to support team and enhanced search
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS recording_id uuid REFERENCES recordings(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS task_id uuid REFERENCES tasks(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS search_keywords text[],
  ADD COLUMN IF NOT EXISTS importance_score float DEFAULT 0.5,
  ADD COLUMN IF NOT EXISTS access_count int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_accessed timestamp with time zone DEFAULT timezone('utc'::text, now()),
  ADD COLUMN IF NOT EXISTS is_archived boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS archive_date timestamp with time zone;

-- Update recordings table for enhanced search
ALTER TABLE recordings
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS transcription_keywords text[],
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- Create memory_search_logs for analytics
CREATE TABLE IF NOT EXISTS memory_search_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_query text NOT NULL,
  search_type text NOT NULL, -- 'text', 'semantic', 'filtered'
  results_count int DEFAULT 0,
  clicked_result_id uuid REFERENCES memories(id) ON DELETE SET NULL,
  search_duration_ms int,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create saved_searches for premium users
CREATE TABLE IF NOT EXISTS saved_searches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name text NOT NULL,
  search_filters jsonb NOT NULL, -- Store the complete search filter object
  is_public boolean DEFAULT false, -- Share with team
  team_id uuid REFERENCES teams(id) ON DELETE SET NULL,
  usage_count int DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Enhanced vector search function with team support
CREATE OR REPLACE FUNCTION match_memories_advanced (
  query_embedding vector(768),
  match_threshold float DEFAULT 0.7,
  match_count int DEFAULT 10,
  p_user_id uuid DEFAULT NULL,
  p_team_id uuid DEFAULT NULL,
  p_content_types text[] DEFAULT NULL, -- Filter by memory types
  p_date_range_start timestamp with time zone DEFAULT NULL,
  p_date_range_end timestamp with time zone DEFAULT NULL
) RETURNS TABLE (
  id uuid,
  content text,
  type text,
  team_id uuid,
  importance_score float,
  similarity float,
  created_at timestamp with time zone
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT 
    memories.id,
    memories.content,
    memories.type,
    memories.team_id,
    memories.importance_score,
    (1 - (memories.embedding <=> query_embedding)) as similarity,
    memories.created_at
  FROM memories
  WHERE 
    -- User or team access
    (p_user_id IS NOT NULL AND memories.user_id = p_user_id) OR
    (p_team_id IS NOT NULL AND memories.team_id = p_team_id)
    -- Similarity threshold
    AND (1 - (memories.embedding <=> query_embedding)) > match_threshold
    -- Content type filter
    AND (p_content_types IS NULL OR memories.type = ANY(p_content_types))
    -- Date range filter
    AND (p_date_range_start IS NULL OR memories.created_at >= p_date_range_start)
    AND (p_date_range_end IS NULL OR memories.created_at <= p_date_range_end)
  ORDER BY 
    (1 - (memories.embedding <=> query_embedding)) DESC, -- Similarity
    memories.importance_score DESC, -- Importance
    memories.created_at DESC -- Recency
  LIMIT match_count;
END;
$$;

-- Full-text search function
CREATE OR REPLACE FUNCTION search_memories_text (
  search_query text,
  p_user_id uuid DEFAULT NULL,
  p_team_id uuid DEFAULT NULL,
  limit_count int DEFAULT 20
) RETURNS TABLE (
  id uuid,
  content text,
  type text,
  team_id uuid,
  importance_score float,
  search_rank real,
  created_at timestamp with time zone
) LANGUAGE plpgsql STABLE AS $$
BEGIN
  RETURN QUERY
  SELECT 
    memories.id,
    memories.content,
    memories.type,
    memories.team_id,
    memories.importance_score,
    ts_rank(memories.search_vector, plainto_tsquery('english', search_query)) as search_rank,
    memories.created_at
  FROM memories
  WHERE 
    -- User or team access
    (p_user_id IS NOT NULL AND memories.user_id = p_user_id) OR
    (p_team_id IS NOT NULL AND memories.team_id = p_team_id)
    -- Full-text search
    AND memories.search_vector @@ plainto_tsquery('english', search_query)
  ORDER BY 
    search_rank DESC,
    memories.importance_score DESC,
    memories.created_at DESC
  LIMIT limit_count;
END;
$$;

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_memories_team_user ON memories(team_id, user_id);
CREATE INDEX IF NOT EXISTS idx_memories_type_importance ON memories(type, importance_score DESC);
CREATE INDEX IF NOT EXISTS idx_memories_created_at ON memories(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_memories_archived ON memories(is_archived, archive_date DESC);
CREATE INDEX IF NOT EXISTS idx_memories_keywords ON memories USING GIN(search_keywords);
CREATE INDEX IF NOT EXISTS idx_recordings_search_vector ON recordings USING GIN(search_vector);
CREATE INDEX IF NOT EXISTS idx_search_logs_user_created ON memory_search_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches(user_id, updated_at DESC);

-- Update search_vector trigger for memories
CREATE OR REPLACE FUNCTION update_memory_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.content, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.search_keywords, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS memory_search_vector_update ON memories;
CREATE TRIGGER memory_search_vector_update
  BEFORE INSERT OR UPDATE ON memories
  FOR EACH ROW EXECUTE FUNCTION update_memory_search_vector();

-- Update search_vector trigger for recordings
CREATE OR REPLACE FUNCTION update_recording_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector := 
    setweight(to_tsvector('english', COALESCE(NEW.transcription, '')), 'A') ||
    setweight(to_tsvector('english', COALESCE(array_to_string(NEW.transcription_keywords, ' '), '')), 'B');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS recording_search_vector_update ON recordings;
CREATE TRIGGER recording_search_vector_update
  BEFORE INSERT OR UPDATE ON recordings
  FOR EACH ROW EXECUTE FUNCTION update_recording_search_vector();

-- Row Level Security for new tables
ALTER TABLE memory_search_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own search logs"
  ON memory_search_logs FOR ALL
  USING (auth.uid() = user_id);

ALTER TABLE saved_searches ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can access own saved searches"
  ON saved_searches FOR ALL
  USING (auth.uid() = user_id);

CREATE POLICY "Team members can access shared saved searches"
  ON saved_searches FOR SELECT
  USING (
    is_public = true AND
    team_id IS NOT NULL AND
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = saved_searches.team_id
      AND team_members.user_id = auth.uid()
    )
  );

-- Update memories RLS to include team access
DROP POLICY IF EXISTS "Users can access own memories" ON memories;
DROP POLICY IF EXISTS "Users can access own or team memories" ON memories;

CREATE POLICY "Users can access own or team memories"
  ON memories FOR ALL
  USING (
    auth.uid() = user_id OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = memories.team_id
      AND team_members.user_id = auth.uid()
    ))
  );
