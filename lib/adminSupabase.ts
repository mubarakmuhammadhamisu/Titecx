// ─────────────────────────────────────────────────────────────────────────────
// lib/adminSupabase.ts
//
// Shared helpers for all /api/admin/* routes.
// • getAdminClient()         — service-role Supabase client (bypasses RLS)
// • getAuthenticatedAdmin()  — verifies session + confirms role = 'Admin'
//
// Import these instead of re-declaring them in every route file.
// ─────────────────────────────────────────────────────────────────────────────

import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

/** Service-role client — bypasses RLS. Never expose to the browser. */
export function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

/**
 * Verifies the incoming request has a valid Supabase session AND that the
 * user's profile has role = 'Admin'.
 *
 * Returns the auth user on success, null on any failure.
 */
export async function getAuthenticatedAdmin() {
  try {
    const cookieStore = await cookies();
    const sessionClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
      { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
    );

    const { data: { user }, error } = await sessionClient.auth.getUser();
    if (error) {
      console.warn('[getAuthenticatedAdmin] Session check failed:', error.message);
      return null;
    }
    if (!user) {
      console.warn('[getAuthenticatedAdmin] No authenticated user on request');
      return null;
    }

    const supabase = getAdminClient();
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profileError) {
      console.error('[getAuthenticatedAdmin] Failed to load profile for user', user.id, ':', profileError);
      return null;
    }
    if (!profile || profile.role !== 'Admin') {
      console.warn('[getAuthenticatedAdmin] User is not an Admin:', user.id, 'role:', profile?.role);
      return null;
    }
    return user;
  } catch (err) {
    console.error('[getAuthenticatedAdmin] Unexpected error:', err);
    return null;
  }
}
