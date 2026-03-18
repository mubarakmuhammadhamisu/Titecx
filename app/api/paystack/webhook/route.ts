// ─────────────────────────────────────────────────────────────────────────────
// POST /api/paystack/webhook
//
// This route exists because the Paystack dashboard was configured with:
//   Webhook URL: yourdomain.com/api/paystack/webhook
//
// The original webhook handler lives at /api/webhooks/paystack.
// This file is the same logic at the path Paystack is actually calling.
// Both can coexist — whichever Paystack hits will work.
//
// How it works:
//   1. Paystack sends a POST every time a payment event occurs.
//   2. We verify the HMAC-SHA512 signature using our secret key to confirm
//      the request is genuinely from Paystack and not a fake call.
//   3. If it's a charge.success event we enroll the student.
//   4. Idempotency: we check the payments table first — if the reference
//      already exists we do nothing (safe to call twice).
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createHmac } from 'crypto';
import { createClient } from '@supabase/supabase-js';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const paystackSig = req.headers.get('x-paystack-signature') ?? '';
  const secret = process.env.PAYSTACK_SECRET_KEY;

  if (!secret) {
    console.error('[webhook] PAYSTACK_SECRET_KEY not set');
    return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 });
  }

  // Verify the signature — reject anything that isn't signed by Paystack
  const expectedSig = createHmac('sha512', secret).update(rawBody).digest('hex');
  if (expectedSig !== paystackSig) {
    console.warn('[webhook] Invalid Paystack signature — request rejected');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // We only care about successful charges — ignore refunds, transfers, etc.
  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const { reference, amount, customer, metadata } = event.data;
  const email      = customer?.email;
  const courseSlug = metadata?.course_slug as string | undefined;

  if (!email || !courseSlug) {
    console.error('[webhook] Missing email or course_slug in event data', event.data);
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Idempotency — if this reference is already in payments, we already enrolled
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  // Look up user by email
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    console.error('[webhook] No profile found for email:', email);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  // Log the payment first
  await supabase.from('payments').insert({
    user_id: profile.id,
    course_slug: courseSlug,
    paystack_reference: reference,
    amount_kobo: amount,
    status: 'success',
  });

  // Enroll (upsert so it is safe even if /api/enroll already wrote a row)
  const { error: enrollError } = await supabase
    .from('enrollments')
    .upsert(
      { user_id: profile.id, course_slug: courseSlug, progress: 0 },
      { onConflict: 'user_id,course_slug' },
    );

  if (enrollError) {
    console.error('[webhook] Enrollment DB error:', enrollError.message);
    return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
  }

  console.log(`[webhook] Enrolled ${email} in ${courseSlug} via webhook (ref: ${reference})`);
  return NextResponse.json({ received: true });
}

interface PaystackEvent {
  event: string;
  data: {
    reference: string;
    amount: number;
    customer: { email: string };
    metadata?: Record<string, unknown>;
  };
}
