-- Create whatsapp_users table for mapping phone numbers to Supabase users
CREATE TABLE IF NOT EXISTS public.whatsapp_users (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    phone_number text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.whatsapp_users ENABLE ROW LEVEL SECURITY;

-- Policies
CREATE POLICY "Users can view own whatsapp mapping" ON public.whatsapp_users FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own whatsapp mapping" ON public.whatsapp_users FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own whatsapp mapping" ON public.whatsapp_users FOR DELETE USING (auth.uid() = user_id);

-- Index
CREATE INDEX IF NOT EXISTS idx_whatsapp_users_phone_number ON public.whatsapp_users(phone_number);
