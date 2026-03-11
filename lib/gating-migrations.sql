-- Update match_tasks to support premium gating (7-day window for free users)
CREATE OR REPLACE FUNCTION match_tasks (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid,
  p_is_premium boolean DEFAULT false
)
RETURNS TABLE (
  id uuid,
  title text,
  description text,
  task_type text,
  due_date timestamp with time zone,
  status text,
  created_at timestamp with time zone,
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
    t.task_type,
    t.due_date,
    t.status,
    t.created_at,
    1 - (t.embedding <=> query_embedding) AS similarity
  FROM public.tasks t
  WHERE t.user_id = p_user_id
    AND t.embedding IS NOT NULL
    AND 1 - (t.embedding <=> query_embedding) > match_threshold
    AND (
      p_is_premium = true 
      OR t.created_at >= (now() - interval '7 days')
    )
  ORDER BY t.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
