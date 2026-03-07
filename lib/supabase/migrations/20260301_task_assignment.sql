-- Add assigned_to column to tasks table for team collaboration
ALTER TABLE tasks
  ADD COLUMN IF NOT EXISTS assigned_to uuid REFERENCES auth.users(id) ON DELETE SET NULL;

-- Create index for assigned_to queries
CREATE INDEX IF NOT EXISTS idx_tasks_assigned_to ON tasks(assigned_to);

-- Update RLS policy to include assigned_to access
DROP POLICY IF EXISTS "Users can access own or team tasks" ON tasks;

CREATE POLICY "Users can access own, assigned, or team tasks"
  ON tasks FOR ALL
  USING (
    auth.uid() = user_id OR
    auth.uid() = assigned_to OR
    (team_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM team_members
      WHERE team_members.team_id = tasks.team_id
      AND team_members.user_id = auth.uid()
    ))
  );
