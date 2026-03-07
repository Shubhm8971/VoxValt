-- VoxValt Production Database Setup
-- Run this in Supabase SQL Editor for Production Setup
-- This creates all necessary tables and RLS policies

-- ============================================
-- 1. CORE TABLES (Safe for existing databases)
-- ============================================

-- Tasks table (main functionality) - Add columns if they don't exist
DO $$
BEGIN
    -- Create table if it doesn't exist
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'tasks') THEN
        CREATE TABLE public.tasks (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            title text NOT NULL,
            description text,
            due_date timestamp with time zone,
            priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high')),
            status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'archived')),
            labels text[] DEFAULT '{}',
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now()
        );
    ELSE
        -- Add missing columns if table exists
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'status') THEN
            ALTER TABLE public.tasks ADD COLUMN status text DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'archived'));
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'priority') THEN
            ALTER TABLE public.tasks ADD COLUMN priority text DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high'));
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'labels') THEN
            ALTER TABLE public.tasks ADD COLUMN labels text[] DEFAULT '{}';
        END IF;
        IF NOT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'tasks' AND column_name = 'updated_at') THEN
            ALTER TABLE public.tasks ADD COLUMN updated_at timestamp with time zone DEFAULT now();
        END IF;
    END IF;
END $$;

-- Recordings table (voice memos) - Safe creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'recordings') THEN
        CREATE TABLE public.recordings (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            audio_url text NOT NULL,
            transcription text,
            duration_seconds integer,
            created_at timestamp with time zone DEFAULT now()
        );
    END IF;
END $$;

-- Notifications table (user preferences) - Safe creation
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'notifications') THEN
        CREATE TABLE public.notifications (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            lead_time_minutes integer DEFAULT 10,
            sound_enabled boolean DEFAULT true,
            vibration_enabled boolean DEFAULT true,
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            UNIQUE(user_id)
        );
    END IF;
END $$;

-- ============================================
-- 2. CALENDAR INTEGRATION TABLES (Safe creation)
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'calendar_accounts') THEN
        CREATE TABLE public.calendar_accounts (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            provider text NOT NULL DEFAULT 'google',
            access_token text NOT NULL,
            refresh_token text,
            token_expiry timestamp with time zone,
            calendar_id text DEFAULT 'primary',
            created_at timestamp with time zone DEFAULT now(),
            updated_at timestamp with time zone DEFAULT now(),
            UNIQUE(user_id, provider)
        );
    END IF;
END $$;

DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'calendar_syncs') THEN
        CREATE TABLE public.calendar_syncs (
            id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
            task_id uuid NOT NULL REFERENCES public.tasks(id) ON DELETE CASCADE,
            user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
            calendar_account_id uuid NOT NULL REFERENCES public.calendar_accounts(id) ON DELETE CASCADE,
            calendar_event_id text NOT NULL,
            synced_at timestamp with time zone DEFAULT now(),
            synced_title text,
            synced_due_date timestamp with time zone,
            UNIQUE(task_id, calendar_account_id)
        );
    END IF;
END $$;

-- ============================================
-- 3. INDEXES FOR PERFORMANCE
-- ============================================

CREATE INDEX IF NOT EXISTS idx_tasks_user_id ON public.tasks(user_id);
CREATE INDEX IF NOT EXISTS idx_tasks_due_date ON public.tasks(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_tasks_status ON public.tasks(status);
CREATE INDEX IF NOT EXISTS idx_recordings_user_id ON public.recordings(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_accounts_user_id ON public.calendar_accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_user_id ON public.calendar_syncs(user_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_task_id ON public.calendar_syncs(task_id);
CREATE INDEX IF NOT EXISTS idx_calendar_syncs_calendar_account_id ON public.calendar_syncs(calendar_account_id);

-- ============================================
-- 4. ENABLE ROW LEVEL SECURITY
-- ============================================

ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.recordings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calendar_syncs ENABLE ROW LEVEL SECURITY;

-- ============================================
-- 5. RLS POLICIES
-- ============================================

-- Tasks policies
DROP POLICY IF EXISTS "Users can view own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can create own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can update own tasks" ON public.tasks;
DROP POLICY IF EXISTS "Users can delete own tasks" ON public.tasks;

CREATE POLICY "Users can view own tasks" ON public.tasks FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own tasks" ON public.tasks FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own tasks" ON public.tasks FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own tasks" ON public.tasks FOR DELETE USING (auth.uid() = user_id);

-- Recordings policies
DROP POLICY IF EXISTS "Users can view own recordings" ON public.recordings;
DROP POLICY IF EXISTS "Users can create own recordings" ON public.recordings;
DROP POLICY IF EXISTS "Users can update own recordings" ON public.recordings;
DROP POLICY IF EXISTS "Users can delete own recordings" ON public.recordings;

CREATE POLICY "Users can view own recordings" ON public.recordings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own recordings" ON public.recordings FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own recordings" ON public.recordings FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own recordings" ON public.recordings FOR DELETE USING (auth.uid() = user_id);

-- Notifications policies
DROP POLICY IF EXISTS "Users can view own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can create own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete own notifications" ON public.notifications;

CREATE POLICY "Users can view own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own notifications" ON public.notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON public.notifications FOR DELETE USING (auth.uid() = user_id);

-- Calendar accounts policies
DROP POLICY IF EXISTS "Users can view own calendar accounts" ON public.calendar_accounts;
DROP POLICY IF EXISTS "Users can create own calendar accounts" ON public.calendar_accounts;
DROP POLICY IF EXISTS "Users can update own calendar accounts" ON public.calendar_accounts;
DROP POLICY IF EXISTS "Users can delete own calendar accounts" ON public.calendar_accounts;

CREATE POLICY "Users can view own calendar accounts" ON public.calendar_accounts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own calendar accounts" ON public.calendar_accounts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar accounts" ON public.calendar_accounts FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar accounts" ON public.calendar_accounts FOR DELETE USING (auth.uid() = user_id);

-- Calendar syncs policies
DROP POLICY IF EXISTS "Users can view own calendar syncs" ON public.calendar_syncs;
DROP POLICY IF EXISTS "Users can create own calendar syncs" ON public.calendar_syncs;
DROP POLICY IF EXISTS "Users can update own calendar syncs" ON public.calendar_syncs;
DROP POLICY IF EXISTS "Users can delete own calendar syncs" ON public.calendar_syncs;

CREATE POLICY "Users can view own calendar syncs" ON public.calendar_syncs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own calendar syncs" ON public.calendar_syncs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own calendar syncs" ON public.calendar_syncs FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own calendar syncs" ON public.calendar_syncs FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. VERIFICATION
-- ============================================

SELECT tablename, rowsecurity FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN ('tasks', 'recordings', 'notifications', 'calendar_accounts', 'calendar_syncs')
ORDER BY tablename;

-- Expected output: All tables should show rowsecurity = true
