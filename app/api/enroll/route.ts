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

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  let body: {
    courseSlug: string;
    userId: string;
    isFree?: boolean;
    reference?: string;
    amountKobo?: number;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseSlug, userId, isFree, reference, amountKobo } = body;

  if (!courseSlug || !userId) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // ── Guard: verify user actually exists before doing anything ─────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .maybeSingle();

  if (!profile) {
    return NextResponse.json({ error: 'User not found' }, { status: 401 });
  }

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
    // Validate server-side that the course is actually free.
    // Prevents someone POST-ing { isFree: true } against a paid course slug.
    const { courseSchemas } = await import('@/lib/Course');
    const courseSchema = courseSchemas.find((c) => c.slug === courseSlug);
    if (!courseSchema) {
      return NextResponse.json({ error: 'Course not found' }, { status: 404 });
    }
    if (courseSchema.price !== 'Free') {
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

  // 2. Log payment (upsert is idempotent if webhook already logged it)
  await supabase.from('payments').upsert(
    {
      user_id: userId,
      course_slug: courseSlug,
      paystack_reference: reference,
      amount_kobo: amountKobo ?? 0,
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
  };
}
