// ─────────────────────────────────────────────────────────────────────────────
// GET /api/paystack/callback
//
// This route exists because the Paystack dashboard was configured with:
//   Callback URL: yourdomain.com/api/paystack/callback
//
// When does Paystack hit this URL?
//   In INLINE (popup) mode — which is what the checkout page uses — Paystack
//   does NOT redirect the browser here. Instead it calls the JavaScript
//   `callback` function inside the popup. The popup handles success inline.
//
//   However, Paystack MAY fall back to REDIRECT mode in some cases:
//   - The user's browser blocks popups
//   - The inline script fails to load
//   - Certain mobile browsers or WebViews
//
//   In redirect mode, after payment Paystack sends the browser to:
//     /api/paystack/callback?reference=xxx&trxref=xxx
//
//   This route handles that case: verifies the transaction server-side,
//   enrolls the student, then redirects them to the correct page.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { validateCourseFromMetadata, ValidatedCourse } from '@/lib/verifyPaystackPayment';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  // Paystack sends both `reference` and `trxref` — they are the same value.
  const reference =
    req.nextUrl.searchParams.get('reference') ??
    req.nextUrl.searchParams.get('trxref');

  if (!reference) {
    return NextResponse.redirect(
      new URL('/dashboard/my-courses?paystack_error=no_reference', req.url)
    );
  }

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    console.error('[callback] PAYSTACK_SECRET_KEY not set');
    return NextResponse.redirect(
      new URL('/dashboard/my-courses?paystack_error=server_error', req.url)
    );
  }

  // ── Verify the transaction with Paystack's API ────────────────────────────
  let verifyData: PaystackVerifyResponse;
  try {
    const verifyRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
      { headers: { Authorization: `Bearer ${secret}` } }
    );
    if (!verifyRes.ok) {
      throw new Error(`Paystack verify returned ${verifyRes.status}`);
    }
    verifyData = await verifyRes.json() as PaystackVerifyResponse;
  } catch (err) {
    console.error('[callback] Paystack verify failed:', err);
    return NextResponse.redirect(
      new URL('/dashboard/my-courses?paystack_error=verify_failed', req.url)
    );
  }

  if (!verifyData.status || verifyData.data?.status !== 'success') {
    return NextResponse.redirect(
      new URL('/dashboard/my-courses?paystack_error=payment_not_successful', req.url)
    );
  }

  const email      = verifyData.data.customer?.email;
  const courseSlug = verifyData.data.metadata?.course_slug as string | undefined;
  const amount     = verifyData.data.amount;

  if (!email || !courseSlug) {
    console.error('[callback] Missing email or course_slug from verify response');
    return NextResponse.redirect(
      new URL('/dashboard/my-courses?paystack_error=missing_data', req.url)
    );
  }

  // ── Guard: validate courseSlug is a safe path segment ────────────────────
  // courseSlug comes from Paystack metadata, which was set by the client before
  // payment. A malicious value like "../admin" or "../../login?redirect=..."
  // would be injected into redirect URLs below, bypassing the open-redirect
  // fix on /login. Only allow real slug format: lowercase alphanumeric + hyphens.
  const SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
  if (!SLUG_RE.test(courseSlug)) {
    console.warn('[callback] Invalid course_slug in metadata rejected:', courseSlug);
    return NextResponse.redirect(
      new URL('/dashboard/my-courses?paystack_error=invalid_course', req.url)
    );
  }

  const supabase = getAdminClient();

  // ── Metadata validation gate ─────────────────────────────────────────
  // courseSlug comes from Paystack metadata -- treat as untrusted until the DB
  // confirms the course exists, is published, and the paid amount is sufficient.
  // All downstream code uses validatedCourse.slug, not the raw metadata string.
  let validatedCourse: ValidatedCourse;
  try {
    validatedCourse = await validateCourseFromMetadata(courseSlug, amount, supabase);
  } catch (err) {
    const msg = err instanceof Error ? err.message : '';
    console.warn('[callback] Course metadata validation failed:', msg);
    return NextResponse.redirect(
      new URL('/dashboard/my-courses?paystack_error=invalid_amount', req.url)
    );
  }

  // ── Idempotency check ─────────────────────────────────────────────────────────────
  const { data: existingPayment } = await supabase
    .from('payments')
    .select('id')
    .eq('paystack_reference', reference)
    .maybeSingle();

  // If already processed (e.g. webhook fired first), go straight to the course
  if (existingPayment) {
    return NextResponse.redirect(
      new URL(`/dashboard/courses/${validatedCourse.slug}?enrolled=true`, req.url)
    );
  }

  // ── Look up the user ──────────────────────────────────────────────────────────────────────
  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('email', email)
    .maybeSingle();

  if (!profile) {
    console.error('[callback] No profile for email:', email);
    // User might not be logged in — redirect to login with a message
    return NextResponse.redirect(
      new URL(
        `/login?redirect=/dashboard/my-courses&paystack_ref=${encodeURIComponent(reference)}&paystack_note=login_required`,
        req.url
      )
    );
  }

  // ── Log payment ───────────────────────────────────────────────────────────────────────────
  await supabase.from('payments').upsert(
    {
      user_id:             profile.id,
      course_slug:         validatedCourse.slug,
      paystack_reference:  reference,
      amount_kobo:         amount,
      status:              'success',
    },
    { onConflict: 'paystack_reference' }
  );

  // ── Enroll ────────────────────────────────────────────────────────────────────────────────────
  const { error: enrollError } = await supabase
    .from('enrollments')
    .upsert(
      { user_id: profile.id, course_slug: validatedCourse.slug, progress: 0 },
      { onConflict: 'user_id,course_slug' }
    );

  if (enrollError) {
    console.error('[callback] Enrollment DB error:', enrollError.message);
    return NextResponse.redirect(
      new URL('/dashboard/my-courses?paystack_error=enrollment_failed', req.url)
    );
  }

  const maskedEmail = email.split('@').map((p, i) => i === 0 ? p.slice(0, 2) + '***' : p).join('@');
  console.log(`[callback] Enrolled ${maskedEmail} in ${validatedCourse.slug} via callback (ref: ${reference.slice(0, 8)}...)`);

  // ── Success — redirect to the course ─────────────────────────────────────────────────
  return NextResponse.redirect(
    new URL(`/dashboard/courses/${validatedCourse.slug}?enrolled=true`, req.url)
  );
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
