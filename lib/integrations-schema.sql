-- =========================================================================
-- Integrations Table Migration
-- =========================================================================

-- First, create the consolidated integrations table
CREATE TABLE IF NOT EXISTS user_integrations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL CHECK (provider IN ('google', 'notion', 'todoist', 'slack')),
  provider_user_id TEXT, -- User's ID on the provider side
  access_token TEXT NOT NULL,
  refresh_token TEXT,
  token_expiry TIMESTAMPTZ,
  settings JSONB DEFAULT '{}'::jsonb, -- Store provider specific metadata (e.g. default Notion DB, Todoist project)
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Prevent multiple connections of the same provider for a single user
  UNIQUE(user_id, provider)
);

-- Turn on RLS
ALTER TABLE user_integrations ENABLE ROW LEVEL SECURITY;

-- Allow users to see their own integrations
CREATE POLICY "Users can view their own integrations"
  ON user_integrations FOR SELECT
  USING (auth.uid() = user_id);

-- Allow users to delete their own integrations (disconnecting)
CREATE POLICY "Users can delete their own integrations"
  ON user_integrations FOR DELETE
  USING (auth.uid() = user_id);

-- =========================================================================
-- Tasks Table Update
-- =========================================================================
-- Add a column to track which integrations a task has been synced to.
-- This prevents duplicating a task by syncing it twice accidentally.

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS synced_to JSONB DEFAULT '[]'::jsonb;
