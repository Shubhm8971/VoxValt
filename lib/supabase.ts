import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Create a singleton instance but don't throw immediately
export const supabase = (supabaseUrl && supabaseKey)
  ? createSupabaseClient(supabaseUrl, supabaseKey)
  : null as any;

/**
 * Safer way to get the supabase client with validation
 */
export const getSupabase = () => {
  if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase configuration is missing. Check your environment variables.');
    return null;
  }
  return supabase || createSupabaseClient(supabaseUrl, supabaseKey);
};

// Create client function for reusability
export const createClient = (url?: string, key?: string) => {
  return createSupabaseClient(url || supabaseUrl, key || supabaseKey);
};

// Server-side client for API routes
export const createServerClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseKey);
};
