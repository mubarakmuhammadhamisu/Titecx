// ─────────────────────────────────────────────────────────────────────────────
// POST /api/enroll
//
// Called by the checkout page AFTER Paystack popup returns success.
// It verifies the Paystack reference with Paystack's own API using the
// SECRET key (never exposed to the browser), then enrolls the user.
//
// Coupon support (Phase 4):
//   If the request body includes a couponCode, this route:
//   1. Re-validates the coupon from the DB (is_active, not expired, under limit).
//   2. Calculates the discounted expected price.
//   3. Passes that as minimumAmountKoboOverride to verifyPaystackPayment so the
//      paid amount is compared to the discounted price, not the full price.
//   4. After successful enrollment, atomically increments the coupon's used_count.
//
// Flow:
//   Client pays → Paystack popup returns reference → client calls this route
//   → we call Paystack /transaction/verify/:reference → if paid → enroll
//   → if coupon was used → increment used_count
//
// The webhook handles the fallback case where the browser closes before this
// route is called (no coupon increment in that path — coupon use isn't tracked
// for webhook-triggered enrollments, which is an acceptable trade-off).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { verifyPaystackPayment, PaystackTransactionData } from '@/lib/verifyPaystackPayment';
import { checkCsrfHeader } from '@/lib/csrf';
import { checkRateLimit } from '@/lib/rateLimit';

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

  // ── Step 0: Verify session — never trust userId from the request body ────
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
  const userId = user.id;

  // ── Rate limit: 10 enroll attempts per user per minute ───────────────────
  const { allowed } = checkRateLimit(`enroll:${userId}`, 10, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests. Please wait a minute.' }, {
      status: 429,
      headers: { 'Retry-After': '60' },
    });
  }

  let body: {
    courseSlug: string;
    isFree?: boolean;
    reference?: string;
    couponCode?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseSlug, isFree, reference, couponCode } = body;

  if (!courseSlug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // ── Idempotency: already enrolled? ───────────────────────────────────────
  const { data: existingEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_slug', courseSlug)
    .maybeSingle();

  if (existingEnrollment) {
    return NextResponse.json({ enrolled: true, alreadyExisted: true });
  }

  // ── Free course path ──────────────────────────────────────────────────────
  if (isFree) {
    const { data: courseData } = await supabase
      .from('courses')
      .select('price')
      .eq('slug', courseSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (!courseData) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    if (courseData.price !== 'Free') {
      return NextResponse.json({ error: 'Course is not free' }, { status: 400 });
    }

    const { data: newEnrollment, error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_slug: courseSlug, progress: 0 })
      .select('id')
      .single();

    if (error) {
      console.error('[enroll] Free enrollment DB error:', error.message);
      return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
    }

    return NextResponse.json({ enrolled: true, enrollmentId: newEnrollment.id });
  }

  // ── Paid course path ──────────────────────────────────────────────────────
  if (!reference) {
    return NextResponse.json({ error: 'Payment reference required for paid course' }, { status: 400 });
  }

  // ── Coupon validation (if a code was submitted) ───────────────────────────
  // We re-validate here even though the checkout page already called
  // /api/validate-coupon. Time may have passed; another student may have
  // consumed the last slot between validation and payment. This is the only
  // authoritative check — the client result is advisory only.
  //
  // Security note: .eq() with uppercased input is used instead of .ilike()
  // to prevent SQL LIKE wildcard injection (e.g. '%' matching all rows).
  let minimumAmountKoboOverride: number | undefined;
  let validatedCouponId: string | null = null;
  let validatedCouponMaxUsage: number | null = null;
  let validatedCouponUsedCount: number | null = null; // for optimistic-lock claim

  if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
    const { data: couponRow, error: couponError } = await supabase
      .from('coupons')
      .select('id, discount_percent, max_usage, used_count, is_active, expires_at')
      .eq('code', couponCode.trim().toUpperCase())
      .maybeSingle();

    if (couponError) {
      console.error('[enroll] Coupon DB lookup error:', couponError.message);
      return NextResponse.json({ error: 'Could not validate coupon. Please try again.' }, { status: 500 });
    }

    if (!couponRow || !couponRow.is_active) {
      return NextResponse.json({ error: 'Invalid or inactive coupon code.' }, { status: 400 });
    }

    if (couponRow.expires_at && new Date(couponRow.expires_at) < new Date()) {
      return NextResponse.json({ error: 'Coupon has expired.' }, { status: 400 });
    }

    if (couponRow.used_count >= couponRow.max_usage) {
      return NextResponse.json({ error: 'Coupon has reached its usage limit.' }, { status: 400 });
    }

    // Fetch the course price to calculate the discounted floor.
    const { data: courseForPrice } = await supabase
      .from('courses')
      .select('price')
      .eq('slug', courseSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (!courseForPrice) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }

    // Strip non-digits from price string (e.g. "₦9,999" → 9999), convert to kobo.
    const fullPriceKobo = Number(courseForPrice.price.replace(/[^\d]/g, '') ?? 0) * 100;
    const discountKobo  = Math.floor(fullPriceKobo * couponRow.discount_percent / 100);
    minimumAmountKoboOverride = fullPriceKobo - discountKobo;

    // Store for optimistic-lock claim below — executed BEFORE enrollment.
    validatedCouponId        = couponRow.id;
    validatedCouponMaxUsage  = couponRow.max_usage;
    validatedCouponUsedCount = couponRow.used_count;
  }

  // ── Verify payment with Paystack ──────────────────────────────────────────
  let paystackData: PaystackTransactionData & { validatedSlug: string };
  try {
    paystackData = await verifyPaystackPayment(
      reference,
      courseSlug,
      supabase,
      minimumAmountKoboOverride,  // undefined = compare against full price (no coupon)
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    console.error('[enroll] Payment verification failed:', msg);
    if (msg.startsWith('PAYSTACK_SECRET_KEY'))  return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
    if (msg.startsWith('Underpayment'))          return NextResponse.json({ error: 'Payment amount is less than the expected price.' }, { status: 400 });
    if (msg.startsWith('Payment not confirmed')) return NextResponse.json({ error: 'Payment not confirmed' }, { status: 402 });
    if (msg.startsWith('Course not found'))      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 502 });
  }

  // ── Guard: reference must be for THIS course, not a different one ─────────
  const paystackCourseSlug = paystackData.metadata?.course_slug as string | undefined;
  if (paystackCourseSlug && paystackCourseSlug !== courseSlug) {
    console.warn('[enroll] Reference course_slug mismatch:', paystackCourseSlug, '!=', courseSlug);
    return NextResponse.json({ error: 'Reference is for a different course' }, { status: 400 });
  }

  // ── Claim coupon slot BEFORE enrollment ──────────────────────────────────
  // This UPDATE runs BEFORE the enrollment RPC so that if the slot is already
  // gone (race condition), we fail here rather than enrolling without enforcing
  // the limit.
  //
  // Optimistic-lock pattern:
  //   SET used_count = [known_value + 1]
  //   WHERE id = [id]
  //     AND used_count = [known_value]   ← only succeeds if nobody changed it
  //     AND used_count < max_usage       ← hard cap enforcement
  //
  // If another request incremented first, used_count no longer matches the
  // snapshot we read, so 0 rows are updated and we return 409 immediately.
  if (validatedCouponId !== null && validatedCouponUsedCount !== null && validatedCouponMaxUsage !== null) {
    const { data: claimedRow, error: claimErr } = await supabase
      .from('coupons')
      .update({ used_count: validatedCouponUsedCount + 1 })
      .eq('id', validatedCouponId)
      .eq('used_count', validatedCouponUsedCount)      // optimistic lock
      .lt('used_count', validatedCouponMaxUsage)       // hard max_usage cap
      .select('id')
      .maybeSingle();

    if (claimErr) {
      console.error('[enroll] Coupon claim update error:', claimErr.message);
      return NextResponse.json({ error: 'Could not claim coupon. Please try again.' }, { status: 500 });
    }

    if (!claimedRow) {
      // 0 rows updated — coupon was exhausted by a concurrent request
      // between our validation read and now.
      console.warn('[enroll] Coupon exhausted by concurrent claim:', validatedCouponId);
      return NextResponse.json(
        { error: 'This coupon has just reached its usage limit. Please try without it or contact support.' },
        { status: 409 },
      );
    }
  }

  // ── Record payment and enroll atomically via DB transaction (RPC) ─────────
  const { error: rpcError } = await supabase.rpc('enroll_after_payment', {
    p_user_id:            userId,
    p_course_slug:        paystackData.validatedSlug,
    p_paystack_reference: reference,
    p_amount_kobo:        paystackData.amount,
    p_status:             'success',
  });

  if (rpcError) {
    console.error('[enroll] Payment+enrollment transaction failed:', rpcError.message);
    return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
  }

  // ── Return the real DB enrollment ID ─────────────────────────────────────
  const { data: newEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_slug', paystackData.validatedSlug)
    .maybeSingle();

  return NextResponse.json({ enrolled: true, enrollmentId: newEnrollment?.id ?? null });
}
