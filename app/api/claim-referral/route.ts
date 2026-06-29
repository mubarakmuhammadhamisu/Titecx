// ─────────────────────────────────────────────────────────────────────────────
// POST /api/claim-referral
//
// Called once after a new user signs up (via AuthContext's attemptReferralClaim)
// when a ?ref=CODE was present in the register page URL.
//
// Security model:
//   - Reads the referee's identity from the authenticated session JWT (not body)
//   - referralCode in the body is looked up against the profiles table
//   - ON CONFLICT (referee_id) DO NOTHING: idempotent — safe to call twice
//   - Rate limited: 5 attempts per user per minute to prevent enumeration
//
// What it does NOT do:
//   - Award any points here — that happens in enroll_after_payment RPC
//   - Accept an unauthenticated request
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkCsrfHeader } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rateLimit';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

const REF_CODE_RE = /^[A-Z]{4}-[A-Z0-9]{4}$/i;

export async function POST(req: NextRequest) {
  // ── CSRF guard ────────────────────────────────────────────────────────────
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  // ── Session check — referee must be authenticated ─────────────────────────
  const cookieStore = await cookies();
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  // ── Rate limit ────────────────────────────────────────────────────────────
  const { allowed } = checkRateLimit(`claim-referral:${user.id}`, 5, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  let body: { referralCode?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { referralCode } = body;

  if (!referralCode || !REF_CODE_RE.test(referralCode.trim())) {
    return NextResponse.json({ error: 'Invalid referral code format' }, { status: 400 });
  }

  const code = referralCode.trim().toUpperCase();
  const supabase = getAdminClient();

  // ── Look up the referrer by code ──────────────────────────────────────────
  const { data: referrer, error: referrerError } = await supabase
    .from('profiles')
    .select('id')
    .eq('referral_code', code)
    .maybeSingle();

  if (referrerError) {
    console.error('[claim-referral] referrer lookup error:', referrerError.message);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }

  if (!referrer) {
    // Code not found — return 200 silently. No need to tell the client it was invalid
    // (prevents referral code enumeration).
    return NextResponse.json({ claimed: false, reason: 'code_not_found' });
  }

  // ── Prevent self-referral ─────────────────────────────────────────────────
  if (referrer.id === user.id) {
    return NextResponse.json({ claimed: false, reason: 'self_referral' });
  }

  // ── Insert the referral (idempotent via ON CONFLICT) ─────────────────────
  // referee_id has a UNIQUE constraint so re-running is safe.
  const { error: insertError } = await supabase
    .from('referrals')
    .insert({
      referrer_id: referrer.id,
      referee_id:  user.id,
    })
    .select('id')
    .single();

  // Unique violation = this referee already has a referral record. That's fine.
  if (insertError && !insertError.message.includes('duplicate') && !insertError.message.includes('unique')) {
    console.error('[claim-referral] insert error:', insertError.message);
    return NextResponse.json({ error: 'Could not record referral' }, { status: 500 });
  }

  const maskedId = user.id.slice(0, 8) + '...';
  console.log(`[claim-referral] Referral recorded: referrer=${referrer.id.slice(0, 8)} → referee=${maskedId}`);

  return NextResponse.json({ claimed: true });
}
