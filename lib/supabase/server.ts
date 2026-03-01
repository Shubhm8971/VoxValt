import { createClient } from '@/lib/supabase';

// Server-side Supabase client with service role key for admin operations
export function createAdminClient() {
  return createClient();
}

// For server-side operations that need elevated permissions
export const supabaseAdmin = createAdminClient();

// Export createServerClient for compatibility
export function createServerClient() {
  return createClient();
}

// Export createServerSupabaseClient for compatibility
export function createServerSupabaseClient() {
  return createClient();
}
