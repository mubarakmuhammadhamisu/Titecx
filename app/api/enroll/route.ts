// ─────────────────────────────────────────────────────────────────────────────
// POST /api/enroll
//
// Called by the checkout page AFTER Paystack popup returns success.
// It verifies the Paystack reference with Paystack's own API using the
// SECRET key (never exposed to the browser), then enrolls the user.
//
// This means even if someone calls enroll() from DevTools, they need
// a valid Paystack reference that was actually paid — they can't fake it.
//
// Flow:
//   Client pays → Paystack popup returns reference → client calls this route
//   → we call Paystack /transaction/verify/:reference → if paid → enroll
//
// The webhook (above) handles the fallback case where the browser closes
// before this route is called.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  // ── Step 0: Verify session — never trust userId from the request body ────
  // Read the authenticated user from the JWT cookie (same pattern as
  // /api/delete-account). An unauthenticated caller or a caller passing
  // someone else's userId in the body is rejected here before anything else.
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
  // userId is now always the authenticated caller — cannot be spoofed by body
  const userId = user.id;

  let body: {
    courseSlug: string;
    isFree?: boolean;
    reference?: string;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseSlug, isFree, reference } = body;

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
    // Validate server-side that the course exists and is actually free.
    // Prevents someone POST-ing { isFree: true } against a paid course slug.
    // Now queries Supabase instead of the old static file.
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

    const { error } = await supabase.from('enrollments').insert({
      user_id: userId,
      course_slug: courseSlug,
      progress: 0,
    });

    if (error) {
      console.error('[enroll] Free enrollment DB error:', error.message);
      return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
    }

    return NextResponse.json({ enrolled: true });
  }

  // ── Paid course path ──────────────────────────────────────────────────────
  if (!reference) {
    return NextResponse.json({ error: 'Payment reference required for paid course' }, { status: 400 });
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('[enroll] PAYSTACK_SECRET_KEY not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // 1. Verify the transaction with Paystack using the secret key
  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );

  if (!verifyRes.ok) {
    return NextResponse.json({ error: 'Could not verify payment' }, { status: 502 });
  }

  const verifyData = await verifyRes.json() as PaystackVerifyResponse;

  if (!verifyData.status || verifyData.data?.status !== 'success') {
    console.warn('[enroll] Payment not successful:', verifyData.data?.status);
    return NextResponse.json({ error: 'Payment not confirmed' }, { status: 402 });
  }

  // ── Guard: reference must be for THIS course, not a different one ─────────
  // Prevents reusing a paid reference from Course A to enroll in Course B.
  const paystackCourseSlug = verifyData.data.metadata?.course_slug as string | undefined;
  if (paystackCourseSlug && paystackCourseSlug !== courseSlug) {
    console.warn('[enroll] Reference course_slug mismatch:', paystackCourseSlug, '!=', courseSlug);
    return NextResponse.json({ error: 'Reference is for a different course' }, { status: 400 });
  }

  // ── Guard: paid amount must be >= expected course price ───────────────────
  // Prevents paying ₦1 and getting enrolled via a tampered client amount.
  const { data: courseForPrice } = await supabase
    .from('courses')
    .select('price')
    .eq('slug', courseSlug)
    .eq('is_published', true)
    .maybeSingle();
  const expectedKobo = Number(courseForPrice?.price?.replace(/[^\d]/g, '') ?? 0) * 100;
  if (expectedKobo > 0 && verifyData.data.amount < expectedKobo) {
    console.warn('[enroll] Underpayment detected:', verifyData.data.amount, '<', expectedKobo);
    return NextResponse.json({ error: 'Payment amount is less than course price' }, { status: 400 });
  }

  // 2. Log payment — use the amount Paystack confirmed, never the body amount
  await supabase.from('payments').upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      paystack_reference: reference,
      amount_kobo: verifyData.data.amount,
      status: 'success',
    },
    { onConflict: 'paystack_reference' },
  );

  // 3. Enroll
  const { error } = await supabase.from('enrollments').insert({
    user_id: userId,
    course_slug: courseSlug,
    progress: 0,
  });

  if (error) {
    console.error('[enroll] Paid enrollment DB error:', error.message);
    return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
  }

  return NextResponse.json({ enrolled: true });
}

interface PaystackVerifyResponse {
  status: boolean;
  data: {
    status: string;
    reference: string;
    amount: number;
    customer: { email: string };
    metadata?: Record<string, unknown>;
  };
}
