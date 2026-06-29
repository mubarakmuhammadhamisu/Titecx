// GET /api/points/balance
// Returns the authenticated user's current credit_balance and lifetime_points.
// Used by checkout page to get a fresh balance before displaying the points input.

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

  const { allowed } = checkRateLimit(`points-balance:${user.id}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  // Also read points_enabled from platform_settings so checkout knows
  // whether to show the points input at all.
  const supabase = getAdminClient();

  const [profileResult, settingResult] = await Promise.all([
    supabase
      .from('profiles')
      .select('credit_balance, lifetime_points')
      .eq('id', user.id)
      .single(),
    supabase
      .from('platform_settings')
      .select('value')
      .eq('key', 'points_enabled')
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    return NextResponse.json({ error: 'Could not fetch balance' }, { status: 500 });
  }

  return NextResponse.json({
    creditBalance:  profileResult.data.credit_balance  ?? 0,
    lifetimePoints: profileResult.data.lifetime_points ?? 0,
    pointsEnabled:  settingResult.data?.value === 'true',
  });
}
