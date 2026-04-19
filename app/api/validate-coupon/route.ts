// POST /api/validate-coupon
//
// Validates a coupon code against the coupons DB table.
//
// Migrated from: a single COUPON_CODE environment variable.
// Now queries the DB so you can create, expire, and limit coupons in real-time
// without redeploying the app or restarting the server.
//
// Returns:
//   { valid: true,  discount_percent: number }   — coupon is usable
//   { valid: false, reason: string }             — coupon is not usable
//
// This route never returns the raw DB row. It never increments used_count —
// that only happens in /api/enroll after a successful payment, so a student
// who validates but never pays doesn't consume a coupon slot.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { checkRateLimit } from '@/lib/rateLimit';
import { checkCsrfHeader } from '@/lib/csrf';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  // ── CSRF: reject cross-site requests missing the custom header ───────────
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  // ── Rate limit: 10 requests per minute per IP ─────────────────────────────
  // Prevents automated brute-forcing of coupon codes.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
  if (ip !== 'unknown') {
    const { allowed } = checkRateLimit(`validate-coupon:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json(
        { valid: false, reason: 'Too many attempts. Please wait a minute.' },
        { status: 429, headers: { 'Retry-After': '60' } },
      );
    }
  }

  let coupon: string | undefined;
  try {
    const body = await req.json() as { coupon?: string };
    coupon = body.coupon;
  } catch {
    return NextResponse.json({ valid: false, reason: 'Invalid request.' }, { status: 400 });
  }

  if (!coupon || typeof coupon !== 'string' || !coupon.trim()) {
    return NextResponse.json({ valid: false, reason: 'Please enter a coupon code.' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Lookup is case-insensitive — stored codes are uppercase, client sends uppercase,
  // but we normalise both sides for safety.
  const { data: row, error } = await supabase
    .from('coupons')
    .select('id, discount_percent, max_usage, used_count, is_active, expires_at')
    .ilike('code', coupon.trim())   // ilike = case-insensitive LIKE (exact match here)
    .maybeSingle();

  if (error) {
    console.error('[validate-coupon] DB error:', error.message);
    return NextResponse.json(
      { valid: false, reason: 'Could not validate coupon. Please try again.' },
      { status: 500 },
    );
  }

  if (!row) {
    return NextResponse.json({ valid: false, reason: 'Coupon not found.' });
  }

  if (!row.is_active) {
    return NextResponse.json({ valid: false, reason: 'This coupon is no longer active.' });
  }

  if (row.expires_at && new Date(row.expires_at) < new Date()) {
    return NextResponse.json({ valid: false, reason: 'This coupon has expired.' });
  }

  if (row.used_count >= row.max_usage) {
    return NextResponse.json({ valid: false, reason: 'This coupon has reached its usage limit.' });
  }

  // Valid — return the discount percentage. Never return the raw DB row.
  return NextResponse.json({ valid: true, discount_percent: row.discount_percent });
}
