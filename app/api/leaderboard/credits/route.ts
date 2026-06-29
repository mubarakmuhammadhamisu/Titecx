// GET /api/leaderboard/credits?page=1&limit=20
//
// Track A — Credits (lifetime_points stored in profiles table).
//
// Auth: any authenticated user. Rate limited.
//
// Response shape matches what the dashboard leaderboard page's
// normaliseEntry() function expects for the 'credits' tab:
//   { id, name, avatar, avatar_url, lifetime_points, courses_completed, rank }
//
// Previously the dashboard pointed at /api/admin/leaderboard which requires
// role = 'Admin', so non-admin users always received a 403 on this tab.

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
  // ── Auth — any logged-in user, not admin-only ─────────────────────────────
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

  const { allowed } = checkRateLimit(`leaderboard-credits:${user.id}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

  const supabase = getAdminClient();
  const from = (page - 1) * limit;

  // ── Fetch profiles ranked by lifetime_points, paginated ──────────────────
  const { data: profiles, error: profileError, count } = await supabase
    .from('profiles')
    .select('id, name, avatar, avatar_url, lifetime_points', { count: 'exact' })
    .gt('lifetime_points', 0)
    .order('lifetime_points', { ascending: false })
    .range(from, from + limit - 1);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  if (!profiles || profiles.length === 0) {
    return NextResponse.json({ leaderboard: [], total: count ?? 0, page, limit });
  }

  // ── Fetch completed course counts for this page's users ──────────────────
  const profileIds = profiles.map((p: any) => p.id);

  const { data: completions } = await supabase
    .from('enrollments')
    .select('user_id')
    .in('user_id', profileIds)
    .eq('progress', 100);

  const completionMap: Record<string, number> = {};
  for (const row of completions ?? []) {
    completionMap[row.user_id] = (completionMap[row.user_id] ?? 0) + 1;
  }

  // ── Build response — shape matches normaliseEntry() for 'credits' tab ─────
  const leaderboard = profiles.map((p: any, i: number) => ({
    id:               p.id,
    name:             p.name ?? 'Unknown',
    avatar:           p.avatar ?? '',
    avatar_url:       p.avatar_url ?? null,
    lifetime_points:  p.lifetime_points ?? 0,
    courses_completed: completionMap[p.id] ?? 0,
    rank:             from + i + 1,
  }));

  return NextResponse.json({ leaderboard, total: count ?? 0, page, limit });
}
