// GET /api/admin/students
//
// Returns all students (profiles where role != 'Admin') enriched with
// enrollment count, total amount paid, referral stats, and ban status.
// Shape matches the Student interface in components/admin/mock-data.ts exactly.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  // ── 1. All student profiles ──────────────────────────────────────────────
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, name, email, created_at, last_login_at, is_banned, credit_balance, lifetime_points')
    .neq('role', 'Admin')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profileIds = (profiles ?? []).map((p) => p.id);
  if (profileIds.length === 0) return NextResponse.json({ students: [] });

  // ── 2. Enrollment counts per user ────────────────────────────────────────
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user_id')
    .in('user_id', profileIds);

  const enrollCountMap: Record<string, number> = {};
  for (const e of enrollments ?? []) {
    enrollCountMap[e.user_id] = (enrollCountMap[e.user_id] ?? 0) + 1;
  }

  // ── 3. Total amount paid per user ────────────────────────────────────────
  const { data: payments } = await supabase
    .from('payments')
    .select('user_id, amount_kobo')
    .eq('status', 'success')
    .in('user_id', profileIds);

  const amountMap: Record<string, number> = {};
  for (const p of payments ?? []) {
    amountMap[p.user_id] = (amountMap[p.user_id] ?? 0) + Math.round(p.amount_kobo / 100);
  }

  // ── 4. Referral stats per user (as referrer) ─────────────────────────────
  const { data: referrals } = await supabase
    .from('referrals')
    .select('referrer_id, status, commission_points')
    .in('referrer_id', profileIds);

  const referralSentMap:      Record<string, number> = {};
  const referralConvMap:      Record<string, number> = {};
  const referralCommMap:      Record<string, number> = {};

  for (const r of referrals ?? []) {
    referralSentMap[r.referrer_id] = (referralSentMap[r.referrer_id] ?? 0) + 1;
    if (r.status === 'converted') {
      referralConvMap[r.referrer_id]  = (referralConvMap[r.referrer_id]  ?? 0) + 1;
      referralCommMap[r.referrer_id]  = (referralCommMap[r.referrer_id]  ?? 0) + (r.commission_points ?? 0);
    }
  }

  // ── 5. Assemble final shape ──────────────────────────────────────────────
  const students = (profiles ?? []).map((p) => ({
    id:                     p.id,
    name:                   p.name ?? 'Unknown',
    email:                  p.email ?? '',
    joinDate:               p.created_at,
    lastLogin:              p.last_login_at ?? p.created_at,
    enrollmentCount:        enrollCountMap[p.id]  ?? 0,
    amountPaid:             amountMap[p.id]        ?? 0,
    referralCount:          referralConvMap[p.id]  ?? 0,
    isBanned:               p.is_banned            ?? false,
    credit_balance:         p.credit_balance       ?? 0,
    lifetime_points:        p.lifetime_points      ?? 0,
    referrals_sent:         referralSentMap[p.id]  ?? 0,
    referrals_converted:    referralConvMap[p.id]  ?? 0,
    total_commission_earned: referralCommMap[p.id] ?? 0,
  }));

  return NextResponse.json({ students });
}

// ── PATCH — ban/unban ─────────────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, isBanned } = body;
  if (!id || isBanned === undefined) return NextResponse.json({ error: 'id and isBanned required' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('profiles').update({ is_banned: isBanned }).eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── DELETE — remove account ───────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const supabase = getAdminClient();
  // Delete auth user — Supabase cascades to profiles via FK
  const { error } = await supabase.auth.admin.deleteUser(id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
