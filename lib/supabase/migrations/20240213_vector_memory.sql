-- Enable the pgvector extension to work with embedding vectors
create extension if not exists vector;

-- Create a table to store your memos and their embeddings
create table if not exists memories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null, -- The raw text functionality
  type text default 'general', -- 'task', 'promise', 'memo'
  embedding vector(768), -- Gemini 1.5 Flash/Pro typically uses 768 dimensions. Check your specific model!
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create a function to search for memories
create or replace function match_memories (
  query_embedding vector(768),
  match_threshold float,
  match_count int,
  p_user_id uuid
) returns table (
  id uuid,
  content text,
  type text,
  similarity float
) language plpgsql stable as $$
begin
  return query (
    select
      memories.id,
      memories.content,
      memories.type,
      1 - (memories.embedding <=> query_embedding) as similarity
    from memories
    where memories.user_id = p_user_id
    and 1 - (memories.embedding <=> query_embedding) > match_threshold
    order by memories.embedding <=> query_embedding
    limit match_count
  );
end;
$$;

-- Create an index for faster queries (IVFFlat)
-- Note: This is optional for small datasets but recommended for production
create index on memories using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
