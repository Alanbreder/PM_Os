import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config, isSupabaseConfigured } from '../config/env.js';

let supabaseAdmin: SupabaseClient | null = null;

/**
 * Returns an administrative Supabase client using SUPABASE_SERVICE_ROLE_KEY.
 * Used exclusively for server-side bootstrap and administrative operations.
 */
export function getSupabaseAdmin(): SupabaseClient {
  if (!isSupabaseConfigured() || !config.SUPABASE_URL || !config.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('Supabase admin credentials (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are not configured.');
  }

  if (!supabaseAdmin) {
    supabaseAdmin = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_ROLE_KEY, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  return supabaseAdmin;
}

/**
 * Creates a scoped Supabase client with the user's specific JWT token.
 * This guarantees that all Postgres queries run within the authenticated user's RLS context.
 */
export function getScopedSupabaseClient(userToken?: string): SupabaseClient {
  if (!config.SUPABASE_URL || !config.SUPABASE_ANON_KEY) {
    throw new Error('Supabase client credentials (SUPABASE_URL and SUPABASE_ANON_KEY) are not configured.');
  }

  return createClient(config.SUPABASE_URL, config.SUPABASE_ANON_KEY, {
    global: {
      headers: userToken ? { Authorization: `Bearer ${userToken}` } : {},
    },
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
