-- lib/slack-migrations.sql
CREATE TABLE IF NOT EXISTS slack_teams (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    slack_team_id TEXT UNIQUE NOT NULL,
    voxvalt_team_id UUID REFERENCES teams(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS
ALTER TABLE slack_teams ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read for slack_teams mapping" 
ON slack_teams FOR SELECT USING (true);
