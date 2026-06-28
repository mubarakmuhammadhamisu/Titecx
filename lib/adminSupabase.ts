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
  const cookieStore = await cookies();
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );

  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return null;

  const supabase = getAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'Admin') return null;
  return user;
}
