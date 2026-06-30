// GET /api/admin/payments
//
// Returns all payments joined with profile names and course titles.
// Shape matches the Payment interface in components/admin/mock-data.ts exactly.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  // ── 1. All payments ──────────────────────────────────────────────────────
  const { data: payments, error } = await supabase
    .from('payments')
    .select('id, user_id, course_slug, paystack_reference, amount_kobo, status, paid_at, points_applied')
    .order('paid_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!payments || payments.length === 0) return NextResponse.json({ payments: [] });

  // ── 2. Enrich with names ─────────────────────────────────────────────────
  const userIds  = [...new Set(payments.map((p) => p.user_id))];
  const slugs    = [...new Set(payments.map((p) => p.course_slug))];

  const [{ data: profiles }, { data: courses }] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', userIds),
    supabase.from('courses').select('slug, title').in('slug', slugs),
  ]);

  const profileMap: Record<string, string> = {};
  for (const p of profiles ?? []) profileMap[p.id] = p.name ?? 'Unknown';

  const courseMap: Record<string, string> = {};
  for (const c of courses ?? []) courseMap[c.slug] = c.title;

  // ── 3. Assemble final shape ──────────────────────────────────────────────
  const result = payments.map((p) => {
    const amountNGN  = Math.round(p.amount_kobo / 100);
    const credits    = p.points_applied ?? 0;
    return {
      id:               p.id,
      studentId:        p.user_id,
      studentName:      profileMap[p.user_id]    ?? 'Unknown',
      courseId:         p.course_slug,
      courseName:       courseMap[p.course_slug] ?? p.course_slug,
      amount:           amountNGN,
      currency:         'NGN',
      reference:        p.paystack_reference,
      date:             p.paid_at,
      status:           p.status as 'success' | 'failed' | 'pending',
      credits_applied:   credits,
      credits_value_ngn: credits,
      net_amount:        amountNGN - credits,
      referral_id:       null,
    };
  });

  return NextResponse.json({ payments: result });
}

// ── POST — verify a payment against Paystack ──────────────────────────────────
// Body: { reference: string }
// Calls Paystack's verify endpoint and returns the transaction status.
export async function POST(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { reference } = await req.json();
  if (!reference) return NextResponse.json({ error: 'reference is required' }, { status: 400 });

  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) return NextResponse.json({ error: 'Payment verification not configured' }, { status: 500 });

  const psRes = await fetch(
    `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
    { headers: { Authorization: `Bearer ${secret}` } },
  );

  if (!psRes.ok) {
    return NextResponse.json({ error: `Paystack returned ${psRes.status}` }, { status: 502 });
  }

  const body = await psRes.json();
  const tx   = body.data;

  return NextResponse.json({
    verified: body.status === true && tx?.status === 'success',
    status:   tx?.status ?? 'unknown',
    amount:   tx?.amount ? Math.round(tx.amount / 100) : 0,
    currency: tx?.currency ?? 'NGN',
    paidAt:   tx?.paid_at ?? null,
  });
}
