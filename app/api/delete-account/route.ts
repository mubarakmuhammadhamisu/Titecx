// ─────────────────────────────────────────────────────────────────────────────
// API Route: POST /api/delete-account
//
// Why this exists:
//   Deleting a Supabase Auth user requires the "service_role" secret key,
//   which has admin powers. That key must NEVER be sent to the browser.
//   So we do it here, server-side, where it is safe.
//
// The client calls this after it has already deleted the profile and
// enrollment rows. This route only deletes the auth.users entry.
//
// Environment variable needed (server-side only, no NEXT_PUBLIC_ prefix):
//   SUPABASE_SERVICE_ROLE_KEY — from Supabase → Settings → API → service_role
// ─────────────────────────────────────────────────────────────────────────────

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export async function POST(req: Request) {
  try {
    const { userId } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Create an admin client using the service_role key (server-side only)
    const adminClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!, // ← this key never leaves the server
    );

    const { error } = await adminClient.auth.admin.deleteUser(userId);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (_err) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
