-- migrations/20260225_teams_schema.sql

-- Create teams table
CREATE TABLE IF NOT EXISTS teams (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  owner_id uuid NOT NULL REFERENCES auth.users(id),
  invite_code text UNIQUE DEFAULT encode(gen_random_bytes(6), 'hex'),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Create team_members table
CREATE TABLE IF NOT EXISTS team_members (
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- 'admin', 'member'
  joined_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  PRIMARY KEY (team_id, user_id)
);

-- Add team_id to memories
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE recordings
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS team_id uuid REFERENCES teams(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id);
CREATE INDEX IF NOT EXISTS idx_memories_team_id ON memories(team_id);
CREATE INDEX IF NOT EXISTS idx_recordings_team_id ON recordings(team_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_id ON tasks(team_id);

-- Row Level Security for teams
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can create teams"
  ON teams FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

CREATE POLICY "Members can view their teams"
  ON teams FOR SELECT
  USING (
    auth.uid() = owner_id OR
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = teams.id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Owners can update their teams"
  ON teams FOR UPDATE
  USING (auth.uid() = owner_id);

-- RLS for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can see teammates"
  ON team_members FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members tm
      WHERE tm.team_id = team_members.team_id
      AND tm.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  );

CREATE POLICY "Owners can manage members"
  ON team_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_members.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- Update RLS for memories to include team access
DROP POLICY IF EXISTS "Users can only access own memories" ON memories;

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

CREATE POLICY "Users can access own or team recordings"
  ON recordings FOR ALL
  USING (
    auth.uid() = user_id OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = recordings.team_id
      AND team_members.user_id = auth.uid()
    ))
  );

CREATE POLICY "Users can access own or team tasks"
  ON tasks FOR ALL
  USING (
    auth.uid() = user_id OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    ))
  );
