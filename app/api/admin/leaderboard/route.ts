// GET /api/admin/leaderboard?page=1&limit=50
//
// Dual-access route:
//   - Admin users: unrestricted, any page/limit up to 100
//   - Regular authenticated users: same data, same query (leaderboard is not sensitive)
//
// Auth is still required — unauthenticated requests are rejected.
// This prevents leaking user names/avatars to anonymous scrapers.

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
  // ── Auth: any logged-in user may view the leaderboard ────────────────────
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

  const { allowed } = checkRateLimit(`leaderboard:${user.id}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  const supabase = getAdminClient();

  const { data: profiles, error, count } = await supabase
    .from('profiles')
    .select('id, name, avatar, avatar_url, lifetime_points', { count: 'exact' })
    .gt('lifetime_points', 0)
    .order('lifetime_points', { ascending: false })
    .order('id', { ascending: true }) // stable tie-break
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profileIds = (profiles ?? []).map((p: any) => p.id);
  const completionMap: Record<string, number> = {};

  if (profileIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id')
      .in('user_id', profileIds)
      .eq('progress', 100);

    for (const row of enrollments ?? []) {
      completionMap[row.user_id] = (completionMap[row.user_id] ?? 0) + 1;
    }
  }

  const leaderboard = (profiles ?? []).map((p: any, i: number) => ({
    id:               p.id,
    position:         from + i + 1,
    studentName:      p.name,       // admin page shape
    name:             p.name,       // dashboard page shape
    avatar:           p.avatar,
    avatar_url:       p.avatar_url,
    points:           p.lifetime_points ?? 0,      // admin page shape
    lifetime_points:  p.lifetime_points ?? 0,      // dashboard page shape
    coursesCompleted: completionMap[p.id] ?? 0,    // admin page shape
    courses_completed: completionMap[p.id] ?? 0,   // dashboard page shape
    rank:             from + i + 1,
  }));

  return NextResponse.json({
    leaderboard,
    total: count ?? 0,
    page,
    limit,
  });
}
