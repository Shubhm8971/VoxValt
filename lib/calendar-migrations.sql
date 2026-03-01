-- VoxValt Calendar Integration - Database Setup
-- Run this in Supabase SQL Editor

-- ============================================
-- 1. CREATE CALENDAR ACCOUNTS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.calendar_accounts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  provider text NOT NULL DEFAULT 'google', -- google, outlook, etc.
  access_token text NOT NULL,
  refresh_token text, -- null if not supported by provider
  token_expiry timestamp with time zone,
  calendar_id text DEFAULT 'primary', -- which calendar to sync to
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, provider) -- one account per user per provider
);

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_user_id ON public.calendar_accounts(user_id);

-- ============================================
-- 2. CREATE CALENDAR SYNCS TABLE
-- ============================================

CREATE TABLE IF NOT EXISTS public.calendar_syncs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  calendar_account_id uuid NOT NULL REFERENCES public.calendar_accounts(id) ON DELETE CASCADE,
  calendar_event_id text NOT NULL, -- google event ID
  synced_at timestamp with time zone DEFAULT now(),
  synced_title text, -- store what was synced to detect changes
  synced_due_date timestamp with time zone,
  UNIQUE(task_id, calendar_account_id) -- one calendar event per task per calendar
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_user_id ON public.calendar_syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_task_id ON public.calendar_syncs(task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_calendar_account_id ON public.calendar_syncs(calendar_account_id);

-- ============================================
-- 3. RLS POLICIES FOR CALENDAR ACCOUNTS
-- ============================================

-- Enable RLS
ALTER TABLE public.calendar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_syncs ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own calendar accounts" ON public.calendar_accounts;
DROP POLICY IF EXISTS "Users can create own calendar accounts" ON public.calendar_accounts;
DROP POLICY IF EXISTS "Users can update own calendar accounts" ON public.calendar_accounts;
DROP POLICY IF EXISTS "Users can delete own calendar accounts" ON public.calendar_accounts;

-- Calendar accounts policies
CREATE POLICY "Users can view own calendar accounts"
ON public.calendar_accounts
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calendar accounts"
ON public.calendar_accounts
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar accounts"
ON public.calendar_accounts
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar accounts"
ON public.calendar_accounts
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 4. RLS POLICIES FOR CALENDAR SYNCS
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own calendar syncs" ON public.calendar_syncs;
DROP POLICY IF EXISTS "Users can create own calendar syncs" ON public.calendar_syncs;
DROP POLICY IF EXISTS "Users can update own calendar syncs" ON public.calendar_syncs;
DROP POLICY IF EXISTS "Users can delete own calendar syncs" ON public.calendar_syncs;

-- Calendar syncs policies
CREATE POLICY "Users can view own calendar syncs"
ON public.calendar_syncs
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own calendar syncs"
ON public.calendar_syncs
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own calendar syncs"
ON public.calendar_syncs
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own calendar syncs"
ON public.calendar_syncs
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 5. VERIFY TABLES AND RLS
-- ============================================

SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('calendar_accounts', 'calendar_syncs')
ORDER BY tablename;

-- Expected output: Both tables should show rowsecurity = true
