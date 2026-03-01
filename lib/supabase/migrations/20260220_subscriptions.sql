-- VoxValt Subscription Table Migration
-- Run this in Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.user_subscriptions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  razorpay_customer_id text,
  razorpay_subscription_id text,
  plan_id text,
  status text NOT NULL DEFAULT 'inactive',
  current_period_end timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_subscriptions ENABLE ROW LEVEL SECURITY;

-- Allow users to view their own subscription
CREATE POLICY "Users can view own subscription"
ON public.user_subscriptions
FOR SELECT
USING (auth.uid() = user_id);

-- DO NOT allow users to insert/update their own subscriptions
-- This should only be done by our secure backend API
-- (No INSERT or UPDATE policies created for anon/authenticated roles for this purpose)
