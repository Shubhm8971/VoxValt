-- migrations/20260226_memory_boards.sql

-- Create memory_boards table
CREATE TABLE IF NOT EXISTS memory_boards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  color text DEFAULT '#4F46E5',
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now())
);

-- Add board_id to memories, tasks, and recordings
ALTER TABLE memories
  ADD COLUMN IF NOT EXISTS board_id uuid REFERENCES memory_boards(id) ON DELETE SET NULL;

ALTER TABLE recordings
  ADD COLUMN IF NOT EXISTS board_id uuid REFERENCES memory_boards(id) ON DELETE SET NULL;

ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS board_id uuid REFERENCES memory_boards(id) ON DELETE SET NULL;

-- Create index for board lookups
CREATE INDEX IF NOT EXISTS idx_memory_boards_team_id ON memory_boards(team_id);
CREATE INDEX IF NOT EXISTS idx_memories_board_id ON memories(board_id);

-- Row Level Security for memory_boards
ALTER TABLE memory_boards ENABLE ROW LEVEL SECURITY;

-- Members can view boards in their teams
CREATE POLICY "Team members can view boards"
  ON memory_boards FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = memory_boards.team_id
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = memory_boards.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- Team members can create boards
CREATE POLICY "Team members can create boards"
  ON memory_boards FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = memory_boards.team_id
      AND team_members.user_id = auth.uid()
    ) OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = memory_boards.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- Only creator or team owner can update boards
CREATE POLICY "Creators or owners can update boards"
  ON memory_boards FOR UPDATE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = memory_boards.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- Only creator or team owner can delete boards
CREATE POLICY "Creators or owners can delete boards"
  ON memory_boards FOR DELETE
  USING (
    auth.uid() = created_by OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = memory_boards.team_id
      AND teams.owner_id = auth.uid()
    )
  );
