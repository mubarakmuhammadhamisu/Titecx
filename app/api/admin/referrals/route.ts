import { NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();
  const { data: referrals, error } = await supabase
    .from('referrals')
    .select('*')
    .order('referred_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!referrals?.length) return NextResponse.json({ referrals: [] });

  const ids = [...new Set([...referrals.map((r) => r.referrer_id), ...referrals.map((r) => r.referee_id)])];
  const { data: profiles } = await supabase.from('profiles').select('id, name, email').in('id', ids);
  const pm: Record<string, any> = {};
  for (const p of profiles ?? []) pm[p.id] = p;

  const enriched = referrals.map((r) => ({
    ...r,
    referrer_name:  pm[r.referrer_id]?.name  ?? 'Unknown',
    referrer_email: pm[r.referrer_id]?.email ?? '',
    referee_name:   pm[r.referee_id]?.name   ?? 'Unknown',
    referee_email:  pm[r.referee_id]?.email  ?? '',
  }));

  return NextResponse.json({ referrals: enriched });
}
