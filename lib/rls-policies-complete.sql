-- VoxValt Row-Level Security (RLS) Setup - COMPLETE VERSION
-- This includes table creation + RLS policies
-- Run this in Supabase SQL Editor

-- ============================================
-- 0. CREATE NOTIFICATIONS TABLE (if missing)
-- ============================================

CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lead_time_minutes integer DEFAULT 10,
  sound_enabled boolean DEFAULT true,
  vibration_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ============================================
-- 1. ENABLE RLS ON ALL TABLES
-- ============================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. TASKS TABLE POLICIES
-- ============================================

-- Drop existing policies if they exist (in case you're re-running)
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

-- Allow users to SELECT only their own tasks
CREATE POLICY "Users can view own tasks"
ON public.tasks
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to INSERT tasks for themselves
CREATE POLICY "Users can create own tasks"
ON public.tasks
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own tasks
CREATE POLICY "Users can update own tasks"
ON public.tasks
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own tasks
CREATE POLICY "Users can delete own tasks"
ON public.tasks
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 3. RECORDINGS TABLE POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own recordings" ON public.recordings;
DROP POLICY IF EXISTS "Users can create own recordings" ON public.recordings;
DROP POLICY IF EXISTS "Users can update own recordings" ON public.recordings;
DROP POLICY IF EXISTS "Users can delete own recordings" ON public.recordings;

-- Allow users to SELECT only their own recordings
CREATE POLICY "Users can view own recordings"
ON public.recordings
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to INSERT recordings for themselves
CREATE POLICY "Users can create own recordings"
ON public.recordings
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own recordings
CREATE POLICY "Users can update own recordings"
ON public.recordings
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own recordings
CREATE POLICY "Users can delete own recordings"
ON public.recordings
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 4. NOTIFICATIONS TABLE POLICIES
-- ============================================

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

-- Allow users to SELECT only their own notification settings
CREATE POLICY "Users can view own notifications"
ON public.notifications
FOR SELECT
USING (auth.uid() = user_id);

-- Allow users to INSERT notification settings for themselves
CREATE POLICY "Users can create own notifications"
ON public.notifications
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own notification settings
CREATE POLICY "Users can update own notifications"
ON public.notifications
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own notification settings
CREATE POLICY "Users can delete own notifications"
ON public.notifications
FOR DELETE
USING (auth.uid() = user_id);

-- ============================================
-- 5. VERIFY RLS IS ENABLED
-- ============================================

SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' AND tablename IN ('tasks', 'recordings', 'notifications');

-- Expected output: All three tables should show rowsecurity = true
