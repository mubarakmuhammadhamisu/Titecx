// GET /api/referral/dashboard
// Returns the authenticated user's referrals and point_transactions.
// Referees' full names are trimmed to first name only for privacy.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimit';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  const cookieStore = await cookies();
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user }, error: authError } = await sessionClient.auth.getUser();
  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { allowed } = checkRateLimit(`referral-dashboard:${user.id}`, 20, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const supabase = getAdminClient();

  // Fetch referrals with referee's name (via join on profiles)
  // RLS would only show referrer_id = user.id anyway, but we use service role
  // here and add the .eq() explicitly for correctness.
  const [referralsResult, txResult] = await Promise.all([
    supabase
      .from('referrals')
      .select(`
        id,
        referred_at,
        status,
        commission_points,
        converted_at,
        referee:profiles!referrals_referee_id_fkey(name)
      `)
      .eq('referrer_id', user.id)
      .order('referred_at', { ascending: false })
      .limit(50),

    supabase
      .from('point_transactions')
      .select('id, type, points, description, created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(100),
  ]);

  const referrals = (referralsResult.data ?? []).map((r: any) => ({
    id:               r.id,
    // Show first name only for privacy
    referee_name:     (r.referee?.name ?? 'Someone').split(' ')[0],
    referred_at:      r.referred_at,
    status:           r.status,
    commission_points: r.commission_points,
    converted_at:     r.converted_at,
  }));

  const transactions = txResult.data ?? [];

  const totalReferrals    = referrals.length;
  const convertedReferrals = referrals.filter((r) => r.status === 'converted').length;
  const totalEarned       = transactions
    .filter((t) => t.points > 0)
    .reduce((sum, t) => sum + t.points, 0);

  return NextResponse.json({
    referrals,
    transactions,
    totalReferrals,
    convertedReferrals,
    totalEarned,
  });
}
