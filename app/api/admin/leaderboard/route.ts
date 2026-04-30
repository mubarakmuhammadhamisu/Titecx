// GET /api/admin/leaderboard?page=1&limit=50
// Returns paginated leaderboard data from real profiles table.

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

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
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single();
  if (!profile || profile.role !== 'Admin') return null;
  return user;
}

export async function GET(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '50', 10)));
  const from  = (page - 1) * limit;
  const to    = from + limit - 1;

  const supabase = getAdminClient();

  // Fetch profiles ordered by lifetime_points DESC
  const { data: profiles, error, count } = await supabase
    .from('profiles')
    .select('id, name, avatar, avatar_url, lifetime_points, credit_balance', { count: 'exact' })
    .order('lifetime_points', { ascending: false })
    .range(from, to);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // For each profile, count completed courses
  // We do this in JS rather than a complex SQL join to keep the query simple.
  // For admin use (≤100 rows), this is fine.
  const profileIds = (profiles ?? []).map((p) => p.id);
  let completionMap: Record<string, number> = {};

  if (profileIds.length > 0) {
    const { data: enrollments } = await supabase
      .from('enrollments')
      .select('user_id')
      .in('user_id', profileIds)
      .eq('progress', 100);

    if (enrollments) {
      for (const row of enrollments) {
        completionMap[row.user_id] = (completionMap[row.user_id] ?? 0) + 1;
      }
    }
  }

  const leaderboard = (profiles ?? []).map((p, i) => ({
    id:               p.id,
    position:         from + i + 1,
    studentName:      p.name,
    points:           p.lifetime_points ?? 0,
    coursesCompleted: completionMap[p.id] ?? 0,
  }));

  return NextResponse.json({
    leaderboard,
    total: count ?? 0,
    page,
    limit,
  });
}
