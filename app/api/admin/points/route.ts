// GET  /api/admin/points                  — all students with point summaries + transactions
// POST /api/admin/points                  — apply a manual credit/deduction
//
// Shape matches StudentPointSummary + PointTransaction from mock-data.ts.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  // All student profiles
  const { data: profiles, error: profErr } = await supabase
    .from('profiles')
    .select('id, name, credit_balance, lifetime_points')
    .neq('role', 'Admin')
    .order('lifetime_points', { ascending: false });

  if (profErr) return NextResponse.json({ error: profErr.message }, { status: 500 });
  if (!profiles || profiles.length === 0) return NextResponse.json({ summaries: [] });

  const profileIds = profiles.map((p) => p.id);

  // All enrollments for learning_points derivation
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('user_id, progress')
    .in('user_id', profileIds);

  // Derive learning_points per user: (completions × 800) + (in_progress × 200)
  const learningMap: Record<string, number> = {};
  for (const e of enrollments ?? []) {
    const pts = e.progress === 100 ? 800 : e.progress > 0 ? 200 : 0;
    learningMap[e.user_id] = (learningMap[e.user_id] ?? 0) + pts;
  }

  // All point_transactions
  const { data: txns } = await supabase
    .from('point_transactions')
    .select('id, user_id, type, points, description, reference_id, created_at')
    .in('user_id', profileIds)
    .order('created_at', { ascending: false });

  // Group transactions by user
  const txnMap: Record<string, object[]> = {};
  for (const t of txns ?? []) {
    if (!txnMap[t.user_id]) txnMap[t.user_id] = [];
    txnMap[t.user_id].push({
      id:            t.id,
      student_id:    t.user_id,
      type:          t.type,
      amount:        t.points,
      balance_after: 0,          // not stored; computed client-side or omitted
      description:   t.description ?? '',
      reference_id:  t.reference_id ?? null,
      created_at:    t.created_at,
      created_by:    'system',
    });
  }

  const summaries = profiles.map((p) => ({
    student_id:      p.id,
    student_name:    p.name ?? 'Unknown',
    credit_balance:  p.credit_balance  ?? 0,
    lifetime_points: p.lifetime_points ?? 0,
    learning_points: learningMap[p.id] ?? 0,
    transactions:    txnMap[p.id]      ?? [],
  }));

  return NextResponse.json({ summaries });
}

// ── POST — manual adjustment ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const { studentId, amount, reason } = body;

  if (!studentId || amount === undefined || amount === 0 || !reason) {
    return NextResponse.json({ error: 'studentId, non-zero amount, and reason are required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const type = amount > 0 ? 'manual_credit' : 'manual_deduction';

  // Fetch current balance
  const { data: profile, error: profErr } = await supabase
    .from('profiles')
    .select('credit_balance, lifetime_points')
    .eq('id', studentId)
    .single();

  if (profErr || !profile) return NextResponse.json({ error: 'Student not found' }, { status: 404 });

  const newBalance  = Math.max(0, (profile.credit_balance  ?? 0) + amount);
  const newLifetime = amount > 0
    ? (profile.lifetime_points ?? 0) + amount
    : profile.lifetime_points ?? 0;

  // Update profile balances
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ credit_balance: newBalance, lifetime_points: newLifetime })
    .eq('id', studentId);

  if (updateErr) return NextResponse.json({ error: updateErr.message }, { status: 500 });

  // Log the transaction
  const { data: txn, error: txnErr } = await supabase
    .from('point_transactions')
    .insert({
      user_id:     studentId,
      type,
      points:      amount,
      description: reason,
      reference_id: null,
    })
    .select()
    .single();

  if (txnErr) return NextResponse.json({ error: txnErr.message }, { status: 500 });

  return NextResponse.json({
    success: true,
    newBalance,
    transaction: {
      id:            txn.id,
      student_id:    studentId,
      type,
      amount,
      balance_after: newBalance,
      description:   reason,
      reference_id:  null,
      created_at:    txn.created_at,
      created_by:    'Admin',
    },
  });
}
