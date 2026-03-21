// ─────────────────────────────────────────────────────────────────────────────
// API Route: POST /api/delete-account
//
// SECURITY MODEL (updated):
//   We no longer trust the userId from the request body.
//   We read the authenticated user's identity directly from the JWT stored
//   in the HTTP-only cookie, using createServerClient from @supabase/ssr.
//   auth.getUser() validates the JWT with Supabase's servers — it cannot
//   be spoofed by a request body or a forged header.
//
//   Flow:
//     1. Read JWT from cookie → get authenticated user ID
//     2. Reject immediately if no valid session
//     3. Delete that authenticated user — never the body userId
//
// Environment variables required (server-side only):
//   NEXT_PUBLIC_SUPABASE_URL
//   NEXT_PUBLIC_SUPABASE_Publishable_KEY  (anon key — for session reading)
//   SUPABASE_SERVICE_ROLE_KEY             (admin key — for deleteUser)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';

export async function POST(req: NextRequest) {
  try {
    // ── Step 1: Read the authenticated user from the JWT in the cookie ──────
    // createServerClient reads the HTTP-only session cookie set by @supabase/ssr.
    // auth.getUser() sends the JWT to Supabase's servers for verification —
    // it cannot be faked by manipulating the request body or headers.
    const cookieStore = await cookies();

    const serverClient = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll();
          },
          setAll(cookiesToSet) {
            // In a read-only API route context we don't need to write cookies
            // back, but the interface requires this method to be present.
            try {
              cookiesToSet.forEach(({ name, value, options }) =>
                cookieStore.set(name, value, options)
              );
            } catch {
              // Called from a Server Component — cookie writes are a no-op
            }
          },
        },
      }
    );

    const { data: { user }, error: authError } = await serverClient.auth.getUser();

    // ── Step 2: Reject if no valid authenticated session ────────────────────
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized — you must be logged in to delete your account.' },
        { status: 401 }
      );
    }

    // ── Step 3: Delete the authenticated user — NOT the body userId ─────────
    // We deliberately ignore any userId from the request body.
    // The only user that gets deleted is the one who owns the current session.
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );

    const { error: deleteError } = await adminClient.auth.admin.deleteUser(user.id);

    if (deleteError) {
      return NextResponse.json({ error: deleteError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (_err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
