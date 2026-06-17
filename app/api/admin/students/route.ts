import { NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();
  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!profiles?.length) return NextResponse.json({ students: [] });

  const ids = profiles.map((p) => p.id);
  const [{ data: enrollments }, { data: payments }] = await Promise.all([
    supabase.from('enrollments').select('user_id').in('user_id', ids),
    supabase.from('payments').select('user_id, amount_kobo').eq('status', 'success').in('user_id', ids),
  ]);

  const enrollMap: Record<string, number> = {};
  for (const e of enrollments ?? []) enrollMap[e.user_id] = (enrollMap[e.user_id] ?? 0) + 1;
  const paidMap: Record<string, number> = {};
  for (const p of payments ?? []) paidMap[p.user_id] = (paidMap[p.user_id] ?? 0) + p.amount_kobo;

  const students = profiles.map((p) => ({
    ...p,
    enrollment_count:  enrollMap[p.id] ?? 0,
    total_paid_kobo:   paidMap[p.id]   ?? 0,
  }));

  return NextResponse.json({ students });
}
