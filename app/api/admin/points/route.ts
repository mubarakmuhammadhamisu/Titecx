import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();
  const { data: transactions, error } = await supabase
    .from('point_transactions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!transactions?.length) return NextResponse.json({ transactions: [] });

  const ids = [...new Set(transactions.map((t) => t.user_id))];
  const { data: profiles } = await supabase.from('profiles').select('id, name, email, credit_balance').in('id', ids);
  const pm: Record<string, any> = {};
  for (const p of profiles ?? []) pm[p.id] = p;

  const enriched = transactions.map((t) => ({
    ...t,
    student_name:   pm[t.user_id]?.name           ?? 'Unknown',
    student_email:  pm[t.user_id]?.email          ?? '',
    credit_balance: pm[t.user_id]?.credit_balance ?? 0,
  }));

  return NextResponse.json({ transactions: enriched });
}

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const { user_id, type, points, description } = await req.json();
  if (!user_id || !type || !points) return NextResponse.json({ error: 'user_id, type, points required' }, { status: 400 });

  const supabase = getAdminClient();
  const delta = type === 'manual_deduction' ? -Math.abs(points) : Math.abs(points);

  const [txnResult, profileResult] = await Promise.all([
    supabase.from('point_transactions').insert({ user_id, type, points: Math.abs(points), description: description ?? null }),
    supabase.from('profiles').select('credit_balance, lifetime_points').eq('id', user_id).single(),
  ]);

  if (txnResult.error) return NextResponse.json({ error: txnResult.error.message }, { status: 500 });

  const current = profileResult.data;
  if (current) {
    const newBalance = Math.max(0, (current.credit_balance ?? 0) + delta);
    const newLifetime = type !== 'manual_deduction'
      ? (current.lifetime_points ?? 0) + Math.abs(points)
      : current.lifetime_points;
    await supabase.from('profiles').update({ credit_balance: newBalance, lifetime_points: newLifetime }).eq('id', user_id);
  }

  return NextResponse.json({ success: true }, { status: 201 });
}
