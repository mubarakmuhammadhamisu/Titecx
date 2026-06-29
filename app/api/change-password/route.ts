// -----------------------------------------------------------------------------
// POST /api/change-password
//
// Securely changes a user's password with server-side re-authentication.
//
// Problem with the previous client-side flow:
//   The browser called supabase.auth.signInWithPassword (re-auth) and then
//   supabase.auth.updateUser (password update) as two separate client calls.
//   An attacker with an active session could skip the re-auth step in DevTools
//   and call updateUser directly, permanently locking the real user out.
//
// This route enforces re-authentication server-side before any password update.
//
// Flow:
//   1. Verify the caller's active session via JWT cookie (cannot be spoofed)
//   2. Re-authenticate with currentPassword + email against Supabase Auth
//   3. If valid, update password via admin client (service role)
//   4. Return success or a specific error
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { checkCsrfHeader } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rateLimit';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  // CSRF: reject cross-site requests
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  // ── Rate limit: 5 attempts per minute per IP ──────────────────────────────
  // Prevents an attacker with a hijacked session from brute-forcing the
  // current password at the re-authentication step.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
  if (ip !== 'unknown') {
    const { allowed } = checkRateLimit(`change-password:${ip}`, 5, 60_000);
    if (!allowed) {
      return NextResponse.json({ error: 'Too many attempts. Please wait a minute.' }, {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
  }

  // Step 1: Verify the caller's session from the JWT cookie
  const cookieStore = await cookies();
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: () => {},
      },
    },
  );

  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // Guard: password change requires an email-based account.
  // Supabase allows phone-only accounts with no email — re-authenticating
  // via signInWithPassword would crash with a null email assertion.
  if (!user.email) {
    return NextResponse.json({ error: 'Password change is only available for email accounts' }, { status: 400 });
  }

  // Step 2: Parse and validate the request body
  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { currentPassword, newPassword } = body;

  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Current and new passwords are required' }, { status: 400 });
  }
  if (typeof newPassword !== 'string' || newPassword.length < 8) {
    return NextResponse.json({ error: 'New password must be at least 8 characters' }, { status: 400 });
  }
  if (currentPassword === newPassword) {
    return NextResponse.json({ error: 'New password must be different from current password' }, { status: 400 });
  }

  // Step 3: Re-authenticate with the current password server-side.
  // This is the critical gate — the client cannot skip or bypass this.
  // Using the anon client so Supabase applies normal auth rate limiting.
  const anonClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
  );

  const { error: reAuthError } = await anonClient.auth.signInWithPassword({
    email: user.email,
    password: currentPassword,
  });

  if (reAuthError) {
    console.warn('[change-password] Re-authentication failed for user:', user.id);
    return NextResponse.json({ error: 'Current password is incorrect' }, { status: 401 });
  }

  // Step 4: Update the password via the admin client.
  // admin.updateUserById does not disturb the caller's active session.
  const adminClient = getAdminClient();
  const { error: updateError } = await adminClient.auth.admin.updateUserById(
    user.id,
    { password: newPassword },
  );

  if (updateError) {
    console.error('[change-password] Password update failed:', updateError.message);
    return NextResponse.json({ error: 'Password update failed. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
