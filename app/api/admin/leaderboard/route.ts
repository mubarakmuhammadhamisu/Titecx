import { NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('leaderboard_view')
    .select('*')
    .order('lifetime_points', { ascending: false })
    .limit(100);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const entries = (data ?? []).map((row, i) => ({ ...row, rank: i + 1 }));
  return NextResponse.json({ leaderboard: entries });
}
