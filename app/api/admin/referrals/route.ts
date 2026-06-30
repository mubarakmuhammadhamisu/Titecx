// GET   /api/admin/referrals         — list all referrals (full audit trail)
// PATCH /api/admin/referrals         — manual convert a pending referral
//
// Joins referrals → profiles (referrer + referee) and payments.
// Shape returned matches the ReferralRecord interface in mock-data.ts exactly.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('id, referrer_id, referee_id, status, referred_at, converted_at, commission_points, payment_id')
    .order('referred_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!referrals || referrals.length === 0) return NextResponse.json({ referrals: [] });

  // Collect all user ids (referrers + referees) in one query
  const allUserIds = [...new Set([
    ...referrals.map((r) => r.referrer_id),
    ...referrals.map((r) => r.referee_id),
  ])];

  const paymentIds = referrals.map((r) => r.payment_id).filter(Boolean);

  const [{ data: profiles }, { data: payments }, { data: referrerProfiles }] =
    await Promise.all([
      supabase.from('profiles').select('id, name, email, referral_code').in('id', allUserIds),
      paymentIds.length
        ? supabase.from('payments').select('id, amount_kobo').in('id', paymentIds)
        : Promise.resolve({ data: [] }),
      supabase.from('profiles').select('id, referral_code').in('id', referrals.map((r) => r.referrer_id)),
    ]);

  const profileMap: Record<string, { name: string; email: string; referral_code?: string }> = {};
  for (const p of profiles ?? []) profileMap[p.id] = { name: p.name ?? 'Unknown', email: p.email ?? '', referral_code: p.referral_code };

  const paymentMap: Record<string, number> = {};
  for (const p of payments ?? []) paymentMap[p.id] = Math.round(p.amount_kobo / 100);

  const result = referrals.map((r) => ({
    id:                        r.id,
    referrer_id:               r.referrer_id,
    referrer_name:             profileMap[r.referrer_id]?.name ?? 'Unknown',
    referee_id:                r.referee_id,
    referee_name:              profileMap[r.referee_id]?.name  ?? 'Unknown',
    referee_email:             profileMap[r.referee_id]?.email ?? '',
    referral_code:             profileMap[r.referrer_id]?.referral_code ?? '',
    created_at:                r.referred_at,
    status:                    r.status as 'pending' | 'converted',
    converted_at:              r.converted_at ?? null,
    commission_credits:        r.commission_points ?? 0,
    triggering_payment_id:     r.payment_id       ?? null,
    triggering_payment_amount: r.payment_id ? (paymentMap[r.payment_id] ?? null) : null,
    admin_notes:               null,
    manually_converted:        false,
  }));

  return NextResponse.json({ referrals: result });
}

// ── PATCH — manual convert ────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, reason } = body;

  if (!id || !reason) {
    return NextResponse.json({ error: 'id and reason are required' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // Fetch the referral to know the commission amount
  const { data: referral, error: fetchErr } = await supabase
    .from('referrals')
    .select('id, referrer_id, commission_points, status')
    .eq('id', id)
    .single();

  if (fetchErr || !referral) return NextResponse.json({ error: 'Referral not found' }, { status: 404 });
  if (referral.status === 'converted') return NextResponse.json({ error: 'Already converted' }, { status: 400 });

  // Mark as converted
  const { error: updateErr } = await supabase
    .from('referrals')
    .update({
      status:       'converted',
      converted_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Award commission credits to the referrer profile
  const commission = referral.commission_points ?? 1500;
  await supabase.rpc('increment_credit_balance', {
    p_user_id: referral.referrer_id,
    p_amount:  commission,
  });

  // Log to point_transactions
  await supabase.from('point_transactions').insert({
    user_id:     referral.referrer_id,
    type:        'referral_commission',
    points:      commission,
    description: `Admin manual conversion: ${reason}`,
    reference_id: id,
  });

  return NextResponse.json({ success: true });
}
