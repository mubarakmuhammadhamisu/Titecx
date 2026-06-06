// GET /api/admin/leaderboard?page=1&limit=50
//
// Admin-only route — requires role = 'Admin' in the profiles table.
// Previously allowed any authenticated user (logged as a security issue).
// The user-facing leaderboard is served by /api/leaderboard/learning instead.

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

async function getAuthenticatedAdmin() {
  const cookieStore = await cookies();
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return null;

  const supabase = getAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'Admin') return null;
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { allowed } = checkRateLimit(`leaderboard:${admin.id}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  const supabase = getAdminClient();

  // 1. Profiles — now includes credit_balance
  const { data: profiles, error, count } = await supabase
    .from('profiles')
    .select('id, name, avatar, avatar_url, lifetime_points, credit_balance', { count: 'exact' })
    .gt('lifetime_points', 0)
    .order('lifetime_points', { ascending: false })
    .order('id', { ascending: true })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const profileIds = (profiles ?? []).map((p: any) => p.id);
  const completionMap: Record<string, number> = {};
  const inProgressMap: Record<string, number> = {};

  if (profileIds.length > 0) {
    // 2. Completed enrollments
    const { data: completed } = await supabase
      .from('enrollments')
      .select('user_id')
      .in('user_id', profileIds)
      .eq('progress', 100);

    for (const row of completed ?? []) {
      completionMap[row.user_id] = (completionMap[row.user_id] ?? 0) + 1;
    }

    // 3. In-progress enrollments (progress > 0 and < 100)
    const { data: inProgress } = await supabase
      .from('enrollments')
      .select('user_id')
      .in('user_id', profileIds)
      .gt('progress', 0)
      .lt('progress', 100);

    for (const row of inProgress ?? []) {
      inProgressMap[row.user_id] = (inProgressMap[row.user_id] ?? 0) + 1;
    }
  }

  // 4. Assemble response
  const leaderboard = (profiles ?? []).map((p: any, i: number) => ({
    id:                  p.id,
    position:            from + i + 1,
    studentName:         p.name,
    name:                p.name,
    avatar:              p.avatar,
    avatar_url:          p.avatar_url,
    points:              p.lifetime_points ?? 0,
    lifetime_points:     p.lifetime_points ?? 0,
    credit_balance:      p.credit_balance  ?? 0,
    coursesCompleted:    completionMap[p.id] ?? 0,
    courses_completed:   completionMap[p.id] ?? 0,
    courses_in_progress: inProgressMap[p.id] ?? 0,
    learning_points:
      ((completionMap[p.id]  ?? 0) * 800) +
      ((inProgressMap[p.id]  ?? 0) * 200),
    rank: from + i + 1,
  }));

  return NextResponse.json({
    leaderboard,
    total: count ?? 0,
    page,
    limit,
  });
}
