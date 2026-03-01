-- Migration for Notifications and Push Subscriptions
-- Table for storing Web Push subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  endpoint text NOT NULL,
  p256dh text NOT NULL,
  auth text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id, endpoint)
);

-- Table for tracking scheduled notifications
CREATE TABLE IF NOT EXISTS public.scheduled_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  task_id uuid REFERENCES public.tasks(id) ON DELETE CASCADE,
  memory_id uuid REFERENCES public.memories(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  scheduled_for timestamp with time zone NOT NULL,
  sent boolean DEFAULT false,
  error text,
  type text NOT NULL DEFAULT 'reminder',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_user ON scheduled_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_notifications_scheduled_for ON scheduled_notifications(scheduled_for) WHERE sent = false;
CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user ON push_subscriptions(user_id);

-- Enable RLS
ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.scheduled_notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for push_subscriptions
CREATE POLICY "Users can manage own push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id);

-- RLS Policies for scheduled_notifications
CREATE POLICY "Users can view own scheduled notifications"
  ON public.scheduled_notifications
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own scheduled notifications"
  ON public.scheduled_notifications
  FOR DELETE
  USING (auth.uid() = user_id);

-- Note: We don't allow general INSERT/UPDATE from client for scheduled_notifications
-- to ensure the backend logic (API) handles timing and validation securely.
