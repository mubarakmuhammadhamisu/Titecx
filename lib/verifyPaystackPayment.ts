// -----------------------------------------------------------------------------
// lib/verifyPaystackPayment.ts
//
// Shared payment validation logic used by:
//   /api/enroll            -- verifyPaystackPayment (full: Paystack fetch + course validation)
//   /api/paystack/callback -- validateCourseFromMetadata (exists + published + price)
//   /api/paystack/webhook  -- validateCourseFromMetadata (exists + published + price)
//
// Security model:
//   course_slug originates from the CLIENT in all three paths:
//     - /api/enroll     -> request body
//     - /api/callback   -> Paystack metadata (set by client before payment)
//     - /api/webhook    -> Paystack metadata (set by client before payment)
//
//   validateCourseFromMetadata is the single authoritative gate.
//   After it returns, callers must use validatedCourse.slug -- not the raw
//   metadata string -- for all enrollment, payment logging, and redirects.
// -----------------------------------------------------------------------------

import { SupabaseClient } from '@supabase/supabase-js';

export interface PaystackTransactionData {
  status: string;
  reference: string;
  amount: number;
  customer: { email: string };
  metadata?: Record<string, unknown>;
}

/** The database-verified course record returned after metadata validation. */
export interface ValidatedCourse {
  slug: string;
  price: string;
}

/**
 * Validates a course_slug from untrusted input (metadata, request body)
 * against the database and enforces the payment amount rule.
 *
 * This is the single authoritative gate all payment paths must pass through.
 * The returned object is DB-sourced -- use it for all downstream operations
 * instead of the raw metadata value.
 *
 * Validates in order:
 *   1. Course exists in the database
 *   2. Course is published (is_published = true)
 *   3. Paid amount meets the course price (no underpayment)
 *
 * @throws Error('Course not found: <slug>')              course missing or unpublished
 * @throws Error('Underpayment: paid X kobo, expected Y') paid amount insufficient
 * @returns DB-verified course record -- slug is authoritative, use it downstream
 */
export async function validateCourseFromMetadata(
  courseSlug: string,
  paidAmountKobo: number,
  supabase: SupabaseClient,
): Promise<ValidatedCourse> {
  const { data: courseData } = await supabase
    .from('courses')
    .select('slug, price')
    .eq('slug', courseSlug)
    .eq('is_published', true)
    .maybeSingle();

  if (!courseData) {
    throw new Error(`Course not found: ${courseSlug}`);
  }

  // Strip non-digit characters ("N9,999" -> 9999) then convert to kobo
  const expectedKobo = Number(courseData.price?.replace(/[^\d]/g, '') ?? 0) * 100;

  if (expectedKobo > 0 && paidAmountKobo < expectedKobo) {
    throw new Error(
      `Underpayment: paid ${paidAmountKobo} kobo, expected ${expectedKobo} kobo`,
    );
  }

  return courseData as ValidatedCourse;
}

/**
 * Validates the paid amount against the DB course price.
 * Delegates to validateCourseFromMetadata -- kept for internal use by
 * verifyPaystackPayment so its call site in /api/enroll stays unchanged.
 *
 * @throws Error('Course not found: <slug>')
 * @throws Error('Underpayment: ...')
 */
export async function assertPaymentAmount(
  paidAmountKobo: number,
  courseSlug: string,
  supabase: SupabaseClient,
): Promise<ValidatedCourse> {
  return validateCourseFromMetadata(courseSlug, paidAmountKobo, supabase);
}

/**
 * Verifies a Paystack payment reference against Paystack's API, then validates
 * the confirmed amount against the course price in the database.
 *
 * Use this in endpoints that receive only a payment reference (e.g. /api/enroll).
 * Endpoints that already hold verified Paystack data (callback, webhook) should
 * call validateCourseFromMetadata directly to avoid a redundant Paystack round-trip.
 *
 * @param minimumAmountKoboOverride  When provided (e.g. a coupon-discounted price),
 *   this value is used as the minimum acceptable payment instead of the full DB price.
 *   The course slug is still validated against the DB — only the amount floor changes.
 *   Pass undefined (default) to use the full course price as the floor.
 *
 * @throws Error('PAYSTACK_SECRET_KEY not set')     server misconfiguration
 * @throws Error('Paystack verify returned <N>')    Paystack API failure
 * @throws Error('Payment not confirmed: <status>') transaction not 'success'
 * @throws Error('Course not found: <slug>')        course missing or unpublished
 * @throws Error('Underpayment: ...')               paid amount < expected floor
 * @returns The verified transaction data from Paystack
 */
export async function verifyPaystackPayment(
  reference: string,
  courseSlug: string,
  supabase: SupabaseClient,
  minimumAmountKoboOverride?: number,
): Promise<PaystackTransactionData & { validatedSlug: string }> {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) {
    throw new Error('PAYSTACK_SECRET_KEY not set');
  }

  const verifyRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );

  if (!verifyRes.ok) {
    throw new Error(`Paystack verify returned ${verifyRes.status}`);
  }

  const body = await verifyRes.json() as { status: boolean; data: PaystackTransactionData };

  if (!body.status || body.data?.status !== 'success') {
    throw new Error(`Payment not confirmed: ${body.data?.status}`);
  }

  // ── Amount check ────────────────────────────────────────────────────────────
  // When a coupon discount was applied, the caller pre-calculates the discounted
  // floor and passes it as minimumAmountKoboOverride. We use that value instead
  // of re-reading the full price from the DB so discounted payments aren't
  // incorrectly rejected as underpayments.
  if (minimumAmountKoboOverride !== undefined) {
    // Still validate the course exists and is published — only the amount floor
    // changes. Use a select that does NOT throw on price mismatch.
    const { data: courseData } = await supabase
      .from('courses')
      .select('slug, price')
      .eq('slug', courseSlug)
      .eq('is_published', true)
      .maybeSingle();

    if (!courseData) {
      throw new Error(`Course not found: ${courseSlug}`);
    }

    if (body.data.amount < minimumAmountKoboOverride) {
      throw new Error(
        `Underpayment: paid ${body.data.amount} kobo, expected at least ${minimumAmountKoboOverride} kobo`,
      );
    }

    return { ...body.data, validatedSlug: courseData.slug };
  }

  // Standard path (no coupon): validate against full DB price
  const validated = await assertPaymentAmount(body.data.amount, courseSlug, supabase);

  return { ...body.data, validatedSlug: validated.slug };
}
