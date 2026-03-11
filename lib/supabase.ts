import { createClient as createSupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Safe fallback for build-time or missing config
const dummySupabase = {
  auth: {
    getSession: async () => ({ data: { session: null }, error: null }),
    onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => { } } }, error: null }),
    signInWithPassword: async () => ({ data: { session: null, user: null }, error: null }),
    signInWithOtp: async () => ({ data: { session: null, user: null }, error: null }),
    signUp: async () => ({ data: { session: null, user: null }, error: null }),
    signOut: async () => ({ error: null }),
    updateUser: async () => ({ data: { user: null }, error: null }),
  },
  from: () => ({
    select: () => ({
      eq: () => ({
        single: async () => ({ data: null, error: null }),
        order: () => ({
          limit: async () => ({ data: [], error: null }),
        }),
      }),
      order: () => ({
        limit: async () => ({ data: [], error: null }),
      }),
    }),
    insert: () => ({
      select: () => ({
        single: async () => ({ data: null, error: null }),
      }),
    }),
  }),
} as any;

export const supabase = (supabaseUrl && supabaseKey)
  ? createSupabaseClient(supabaseUrl, supabaseKey)
  : dummySupabase;

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

// Server-side client for API routes (uses anon key — subject to RLS)
export const createServerClient = () => {
  return createSupabaseClient(supabaseUrl, supabaseKey);
};

// Admin client for server-side operations that need to bypass RLS
// Uses SUPABASE_SERVICE_ROLE_KEY — NEVER expose this on the client side
export const createAdminClient = () => {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    console.warn('[Supabase] SUPABASE_SERVICE_ROLE_KEY not set — falling back to anon key. DB writes may fail due to RLS.');
  }
  return createSupabaseClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
};
