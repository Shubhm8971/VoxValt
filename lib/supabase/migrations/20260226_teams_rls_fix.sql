-- migrations/20260226_teams_rls_fix.sql

-- Drop existing restricted policy
DROP POLICY IF EXISTS "Owners can manage members" ON team_members;

-- Allow users to see their own membership (needed for some queries)
CREATE POLICY "Users can view own membership" ON team_members FOR SELECT USING (auth.uid() = user_id);

-- Allow users to leave teams
CREATE POLICY "Users can leave teams" ON team_members FOR DELETE USING (auth.uid() = user_id);

-- Allow owners and admins to manage members
-- We check if the requester is an admin or owner of the team
CREATE POLICY "Admins and Owners can manage team members"
ON team_members
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM team_members tm
    WHERE tm.team_id = team_members.team_id
    AND tm.user_id = auth.uid()
    AND (tm.role = 'admin' OR EXISTS (SELECT 1 FROM teams t WHERE t.id = tm.team_id AND t.owner_id = auth.uid()))
  )
);
