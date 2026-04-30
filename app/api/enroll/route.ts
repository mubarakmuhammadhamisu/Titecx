// POST /api/enroll
// Extended to handle points redemption alongside existing coupon logic.
// Points flow: server re-validates balance → passes p_points_applied to RPC
// → RPC atomically deducts balance + awards referral commission if eligible.

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
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

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
    purchaseType?: 'standard' | 'premium';
    pointsApplied?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const {
    courseSlug,
    isFree,
    reference,
    couponCode,
    purchaseType = 'standard',
    pointsApplied: rawPointsApplied = 0,
  } = body;

  if (!courseSlug) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  // Sanitise pointsApplied: must be a non-negative integer
  const pointsApplied = Number.isInteger(rawPointsApplied) && rawPointsApplied >= 0
    ? rawPointsApplied
    : 0;

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

    if (!courseData) return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    if (courseData.price !== 'Free') return NextResponse.json({ error: 'Course is not free' }, { status: 400 });

    const { data: newEnrollment, error } = await supabase
      .from('enrollments')
      .insert({ user_id: userId, course_slug: courseSlug, progress: 0, purchase_type: 'free' })
      .select('id')
      .single();

    if (error) {
      console.error('[enroll] Free enrollment DB error:', error.message);
      return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
    }
    return NextResponse.json({ enrolled: true, enrollmentId: newEnrollment.id });
  }

  // ── Points-only path (finalTotal = ₦0 after coupon + points) ─────────────
  // If the full discount covers the price, no Paystack reference is needed.
  // We verify points + coupon math server-side before calling the RPC.
  const isPointsOnly = !reference && pointsApplied > 0;

  if (!reference && !isPointsOnly) {
    return NextResponse.json({ error: 'Payment reference required for paid course' }, { status: 400 });
  }

  // ── Server-side points validation ────────────────────────────────────────
  // Always validate balance from DB — never trust the client's reported balance.
  let verifiedPointsApplied = 0;
  let pointsEnabled = false;

  if (pointsApplied > 0) {
    const [profileResult, settingResult] = await Promise.all([
      supabase.from('profiles').select('credit_balance').eq('id', userId).single(),
      supabase.from('platform_settings').select('value').eq('key', 'points_enabled').maybeSingle(),
    ]);

    pointsEnabled = settingResult.data?.value === 'true';

    if (!pointsEnabled) {
      // Points feature is disabled — treat as 0 points applied
      verifiedPointsApplied = 0;
    } else if (profileResult.error) {
      return NextResponse.json({ error: 'Could not verify points balance' }, { status: 500 });
    } else {
      const balance = profileResult.data.credit_balance ?? 0;
      if (pointsApplied > balance) {
        return NextResponse.json({
          error: `Insufficient points balance. You have ${balance} points.`,
        }, { status: 400 });
      }
      verifiedPointsApplied = pointsApplied;
    }
  }

  // ── Coupon validation ──────────────────────────────────────────────────────
  let minimumAmountKoboOverride: number | undefined;
  let validatedCouponId: string | null = null;
  let validatedCouponMaxUsage: number | null = null;
  let validatedCouponUsedCount: number | null = null;
  let couponDiscountKobo = 0;
  let fullPriceKobo = 0;

  // Always fetch course price (needed for points + coupon math verification)
  const { data: courseForPrice } = await supabase
    .from('courses')
    .select('price')
    .eq('slug', courseSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (!courseForPrice) {
    return NextResponse.json({ error: 'Course not found' }, { status: 404 });
  }

  fullPriceKobo = Number(courseForPrice.price.replace(/[^\d]/g, '') ?? 0) * 100;

  if (couponCode && typeof couponCode === 'string' && couponCode.trim()) {
    const { data: couponRow, error: couponError } = await supabase
      .from('coupons')
      .select('id, discount_percent, max_usage, used_count, is_active, expires_at')
      .eq('code', couponCode.trim().toUpperCase())
      .maybeSingle();

    if (couponError) {
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

    couponDiscountKobo = Math.floor(fullPriceKobo * couponRow.discount_percent / 100);
    const afterCouponKobo = fullPriceKobo - couponDiscountKobo;

    // Points can only reduce the post-coupon amount, not go below ₦0
    const pointsKobo = Math.min(verifiedPointsApplied * 100, afterCouponKobo);
    minimumAmountKoboOverride = Math.max(0, afterCouponKobo - pointsKobo);

    validatedCouponId        = couponRow.id;
    validatedCouponMaxUsage  = couponRow.max_usage;
    validatedCouponUsedCount = couponRow.used_count;
  } else {
    // No coupon: minimum is full price minus points
    const pointsKobo = Math.min(verifiedPointsApplied * 100, fullPriceKobo);
    minimumAmountKoboOverride = Math.max(0, fullPriceKobo - pointsKobo);
  }

  // ── Points-only enrollment (no Paystack, total ₦0) ───────────────────────
  if (isPointsOnly || minimumAmountKoboOverride === 0) {
    if (verifiedPointsApplied === 0) {
      return NextResponse.json({ error: 'Points required for zero-amount enrollment' }, { status: 400 });
    }

    // Claim coupon slot if applicable
    if (validatedCouponId !== null && validatedCouponUsedCount !== null && validatedCouponMaxUsage !== null) {
      const { data: claimedRow } = await supabase
        .from('coupons')
        .update({ used_count: validatedCouponUsedCount + 1 })
        .eq('id', validatedCouponId)
        .eq('used_count', validatedCouponUsedCount)
        .lt('used_count', validatedCouponMaxUsage)
        .select('id')
        .maybeSingle();

      if (!claimedRow) {
        return NextResponse.json(
          { error: 'This coupon has just reached its usage limit. Please try without it or contact support.' },
          { status: 409 }
        );
      }
    }

    // RPC handles points deduction + referral commission atomically
    const { error: rpcError } = await supabase.rpc('enroll_after_payment', {
      p_user_id:            userId,
      p_course_slug:        courseSlug,
      p_paystack_reference: `POINTS-${userId.slice(0, 8)}-${Date.now()}`,
      p_amount_kobo:        0,
      p_status:             'points_only',
      p_points_applied:     verifiedPointsApplied,
      p_purchase_type:      purchaseType === 'premium' ? 'premium' : 'standard',
    });

    if (rpcError) {
      console.error('[enroll] Points-only RPC failed:', rpcError.message);
      return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
    }

    const { data: newEnrollment } = await supabase
      .from('enrollments')
      .select('id')
      .eq('user_id', userId)
      .eq('course_slug', courseSlug)
      .maybeSingle();

    return NextResponse.json({ enrolled: true, enrollmentId: newEnrollment?.id ?? null });
  }

  // ── Paid path — verify with Paystack ─────────────────────────────────────
  if (!reference) {
    return NextResponse.json({ error: 'Payment reference required' }, { status: 400 });
  }

  let paystackData: PaystackTransactionData & { validatedSlug: string };
  try {
    paystackData = await verifyPaystackPayment(
      reference,
      courseSlug,
      supabase,
      minimumAmountKoboOverride,
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

  const paystackCourseSlug = paystackData.metadata?.course_slug as string | undefined;
  if (paystackCourseSlug && paystackCourseSlug !== courseSlug) {
    return NextResponse.json({ error: 'Reference is for a different course' }, { status: 400 });
  }

  // Claim coupon slot before enrollment
  if (validatedCouponId !== null && validatedCouponUsedCount !== null && validatedCouponMaxUsage !== null) {
    const { data: claimedRow } = await supabase
      .from('coupons')
      .update({ used_count: validatedCouponUsedCount + 1 })
      .eq('id', validatedCouponId)
      .eq('used_count', validatedCouponUsedCount)
      .lt('used_count', validatedCouponMaxUsage)
      .select('id')
      .maybeSingle();

    if (!claimedRow) {
      return NextResponse.json(
        { error: 'This coupon has just reached its usage limit. Please try without it or contact support.' },
        { status: 409 }
      );
    }
  }

  // RPC: payment + enrollment + points deduction + referral commission (all atomic)
  const { error: rpcError } = await supabase.rpc('enroll_after_payment', {
    p_user_id:            userId,
    p_course_slug:        paystackData.validatedSlug,
    p_paystack_reference: reference,
    p_amount_kobo:        paystackData.amount,
    p_status:             'success',
    p_points_applied:     verifiedPointsApplied,
    p_purchase_type:      purchaseType === 'premium' ? 'premium' : 'standard',
  });

  if (rpcError) {
    console.error('[enroll] Payment+enrollment RPC failed:', rpcError.message);
    return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
  }

  // Patch premium-specific fields (RPC doesn't know about premium tiers)
  const safePurchaseType = purchaseType === 'premium' ? 'premium' : 'standard';
  let premiumDeadline: string | null = null;
  if (safePurchaseType === 'premium') {
    const { data: courseForDeadline } = await supabase
      .from('courses').select('premium_deadline_days').eq('slug', paystackData.validatedSlug).maybeSingle();
    const deadlineDays = courseForDeadline?.premium_deadline_days ?? 60;
    const deadline = new Date();
    deadline.setDate(deadline.getDate() + deadlineDays);
    premiumDeadline = deadline.toISOString();
  }

  const { error: patchError } = await supabase
    .from('enrollments')
    .update({
      purchase_type:      safePurchaseType,
      premium_deadline:   premiumDeadline,
      mystery_box_status: safePurchaseType === 'premium' ? 'pending' : null,
    })
    .eq('user_id', userId)
    .eq('course_slug', paystackData.validatedSlug);

  if (patchError) {
    console.error('[enroll] Failed to patch purchase_type:', patchError.message);
  }

  const { data: newEnrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', userId)
    .eq('course_slug', paystackData.validatedSlug)
    .maybeSingle();

  return NextResponse.json({ enrolled: true, enrollmentId: newEnrollment?.id ?? null });
}
