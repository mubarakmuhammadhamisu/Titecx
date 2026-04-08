// POST /api/validate-coupon
//
// Validates a coupon code server-side against the COUPON_CODE environment
// variable. The code never appears in the client bundle.
//
// SETUP REQUIRED:
//   Add to Vercel environment variables (NOT prefixed with NEXT_PUBLIC_):
//     COUPON_CODE=LEARN10
//
// Why not NEXT_PUBLIC_: any variable prefixed with NEXT_PUBLIC_ is embedded
// in the browser bundle and readable by anyone. A plain COUPON_CODE env var
// is only readable by the server.
//
// The client sends the raw coupon string; we compare it here.
// We return only { valid: boolean } — never the real code.

import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function POST(req: NextRequest) {
  // ── Rate limit: 10 requests per minute per IP ─────────────────────────────
  // Prevents automated brute-forcing of coupon codes.
  const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
    ?? req.headers.get('x-real-ip')
    ?? 'unknown';
  // Skip rate limiting when IP cannot be determined (local dev, stripped headers).
  // A shared 'unknown' bucket would incorrectly throttle unrelated clients.
  if (ip !== 'unknown') {
    const { allowed } = checkRateLimit(`validate-coupon:${ip}`, 10, 60_000);
    if (!allowed) {
      return NextResponse.json({ valid: false }, {
        status: 429,
        headers: { 'Retry-After': '60' },
      });
    }
  }

  try {
    const { coupon } = await req.json() as { coupon?: string };

    if (!coupon || typeof coupon !== 'string') {
      return NextResponse.json({ valid: false }, { status: 400 });
    }

    const validCode = process.env.COUPON_CODE;
    if (!validCode) {
      // No coupon configured on this server — treat all coupons as invalid
      console.warn('[validate-coupon] COUPON_CODE env var not set');
      return NextResponse.json({ valid: false });
    }

    const isValid = coupon.trim().toUpperCase() === validCode.trim().toUpperCase();
    return NextResponse.json({ valid: isValid });

  } catch {
    return NextResponse.json({ valid: false }, { status: 400 });
  }
}
