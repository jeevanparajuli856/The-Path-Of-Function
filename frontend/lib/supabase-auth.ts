import { createClient } from '@supabase/supabase-js';

/**
 * Creates a fresh anon-key Supabase client for auth flows.
 * Do not reuse the service-role DB client for auth requests.
 */
export function createSupabaseAuthClient() {
  const supabaseUrl =
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SUPABASE_URL;

  const anonKey =
    process.env.NEXT_PUBLIC_SUPABASE_KEY ??
    process.env.SUPABASE_ANON_KEY;

  if (!supabaseUrl) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL (or SUPABASE_URL) for auth client.');
  }

  if (!anonKey) {
    throw new Error('Missing NEXT_PUBLIC_SUPABASE_KEY (or SUPABASE_ANON_KEY) for auth client.');
  }

  return createClient(supabaseUrl, anonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
      detectSessionInUrl: false,
    },
  });
}
