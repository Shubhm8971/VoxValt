-- Team Calendar Integration Schema
-- Add team calendar sharing and sync capabilities

-- Create team_calendars table for shared team calendars
CREATE TABLE IF NOT EXISTS team_calendars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id uuid NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  calendar_id text NOT NULL, -- Google Calendar ID
  calendar_name text NOT NULL,
  calendar_color text DEFAULT '#3788d8',
  is_default boolean DEFAULT false,
  created_by uuid NOT NULL REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(team_id, calendar_id)
);

-- Create team_calendar_shares table for member-specific calendar access
CREATE TABLE IF NOT EXISTS team_calendar_shares (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  team_calendar_id uuid NOT NULL REFERENCES team_calendars(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  permission_level text NOT NULL DEFAULT 'read', -- 'read', 'write', 'admin'
  synced_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
  UNIQUE(team_calendar_id, user_id)
);

-- Update tasks table to include calendar event ID for team tasks
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS calendar_event_id text,
  ADD COLUMN IF NOT EXISTS team_calendar_id uuid REFERENCES team_calendars(id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_team_calendars_team ON team_calendars(team_id);
CREATE INDEX IF NOT EXISTS idx_team_calendar_shares_calendar ON team_calendar_shares(team_calendar_id);
CREATE INDEX IF NOT EXISTS idx_team_calendar_shares_user ON team_calendar_shares(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_team_calendar ON tasks(team_calendar_id);

-- Row Level Security for team_calendars
ALTER TABLE team_calendars ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Team members can view team calendars"
  ON team_calendars FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_calendars.team_id
      AND team_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can create team calendars"
  ON team_calendars FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_calendars.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('admin', 'owner')
    ) OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_calendars.team_id
      AND teams.owner_id = auth.uid()
    )
  );

CREATE POLICY "Team admins can update team calendars"
  ON team_calendars FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = team_calendars.team_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('admin', 'owner')
    ) OR
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_calendars.team_id
      AND teams.owner_id = auth.uid()
    )
  );

-- RLS for team_calendar_shares
ALTER TABLE team_calendar_shares ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their calendar shares"
  ON team_calendar_shares FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Team admins can manage calendar shares"
  ON team_calendar_shares FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM team_calendars
      JOIN team_members ON team_members.team_id = team_calendars.team_id
      WHERE team_calendars.id = team_calendar_shares.team_calendar_id
      AND team_members.user_id = auth.uid()
      AND team_members.role IN ('admin', 'owner')
    ) OR
    EXISTS (
      SELECT 1 FROM team_calendars
      JOIN teams ON teams.id = team_calendars.team_id
      WHERE team_calendars.id = team_calendar_shares.team_calendar_id
      AND teams.owner_id = auth.uid()
    )
  );
