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

  const expectedSig = createHmac('sha512', secret).update(rawBody).digest('hex');

  if (expectedSig !== paystackSig) {
    console.warn('[webhook] Invalid Paystack signature');
    return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
  }

  let event: PaystackEvent;
  try {
    event = JSON.parse(rawBody) as PaystackEvent;
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (event.event !== 'charge.success') {
    return NextResponse.json({ received: true });
  }

  const { reference, amount, customer, metadata } = event.data;
  const email = customer?.email;
  const courseSlug = metadata?.course_slug as string | undefined;

  if (!email || !courseSlug) {
    console.error('[webhook] Missing email or course_slug', event.data);
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Idempotency check — don't double-enroll
  const { data: existing } = await supabase
    .from('payments')
    .select('id')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ received: true, duplicate: true });
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    console.error('[webhook] No profile for email:', email);
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  await supabase.from('payments').insert({
    user_id: profile.id,
    course_slug: courseSlug,
    paystack_reference: reference,
    amount_kobo: amount,
    status: 'success',
  });

  const { error: enrollError } = await supabase
    .from('enrollments')
    .upsert(
      { user_id: profile.id, course_slug: courseSlug, progress: 0 },
      { onConflict: 'user_id,course_slug' },
    );

  if (enrollError) {
    console.error('[webhook] Enrollment failed:', enrollError.message);
    return NextResponse.json({ error: 'Enrollment failed' }, { status: 500 });
  }

  console.log(`[webhook] Enrolled ${email} in ${courseSlug} (ref: ${reference})`);
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
