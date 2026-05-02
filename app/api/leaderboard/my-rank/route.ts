// GET /api/leaderboard/my-rank?tab=credits|learning
//
// Returns the authenticated user's rank on either leaderboard tab without
// requiring them to be visible on the current page of results.
//
// Credits tab:  Uses a COUNT(*) query — O(1) regardless of leaderboard size.
// Learning tab: Derives score from user's own enrollments first. If score > 0,
//               computes full rank by counting users with a higher derived score.
//               At scale, promote this to a DB view.
//
// Response shape:
//   { rank: number | null, points: number, total: number }
//   rank = null  →  user is unranked (no qualifying points)
//   rank = 1..N  →  user's current position

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkRateLimit } from '@/lib/rateLimit';

const COMPLETED_PTS   = 800;
const IN_PROGRESS_PTS = 200;

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function GET(req: NextRequest) {
  // ── Auth ──────────────────────────────────────────────────────────────────
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

  const { allowed } = checkRateLimit(`leaderboard-myrank:${user.id}`, 60, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const tab = (req.nextUrl.searchParams.get('tab') ?? 'credits') as 'credits' | 'learning';
  const supabase = getAdminClient();

  // ── Credits tab ───────────────────────────────────────────────────────────
  if (tab === 'credits') {
    // Get my own lifetime_points
    const { data: myProfile, error: profileError } = await supabase
      .from('profiles')
      .select('lifetime_points')
      .eq('id', user.id)
      .single();

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    const myPoints = myProfile?.lifetime_points ?? 0;

    if (myPoints === 0) {
      // Get total for context in the CTA
      const { count } = await supabase
        .from('profiles')
        .select('id', { count: 'exact', head: true })
        .gt('lifetime_points', 0);
      return NextResponse.json({ rank: null, points: 0, total: count ?? 0 });
    }

    // Count how many users score strictly higher (gives rank - 1)
    const { count: above, error: countError } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gt('lifetime_points', myPoints);

    if (countError) {
      return NextResponse.json({ error: countError.message }, { status: 500 });
    }

    // Total participants
    const { count: total } = await supabase
      .from('profiles')
      .select('id', { count: 'exact', head: true })
      .gt('lifetime_points', 0);

    return NextResponse.json({
      rank:   (above ?? 0) + 1,
      points: myPoints,
      total:  total ?? 0,
    });
  }

  // ── Learning tab ──────────────────────────────────────────────────────────
  // Step 1: compute my own score from my enrollments
  const { data: myEnrollments, error: myEnrollError } = await supabase
    .from('enrollments')
    .select('progress')
    .eq('user_id', user.id)
    .gt('progress', 0);

  if (myEnrollError) {
    return NextResponse.json({ error: myEnrollError.message }, { status: 500 });
  }

  const myPoints = (myEnrollments ?? []).reduce((sum, row) => {
    return sum + (row.progress === 100 ? COMPLETED_PTS : IN_PROGRESS_PTS);
  }, 0);

  if (myPoints === 0) {
    // Count total ranked users for context
    const { data: allEnrollments } = await supabase
      .from('enrollments')
      .select('user_id')
      .gt('progress', 0);

    const uniqueUsers = new Set((allEnrollments ?? []).map((e) => e.user_id)).size;
    return NextResponse.json({ rank: null, points: 0, total: uniqueUsers });
  }

  // Step 2: compute every user's learning_points to find my rank
  const { data: allEnrollments, error: allEnrollError } = await supabase
    .from('enrollments')
    .select('user_id, progress')
    .gt('progress', 0);

  if (allEnrollError) {
    return NextResponse.json({ error: allEnrollError.message }, { status: 500 });
  }

  // Aggregate per user
  const userScores = new Map<string, number>();
  for (const row of allEnrollments ?? []) {
    const pts = row.progress === 100 ? COMPLETED_PTS : IN_PROGRESS_PTS;
    userScores.set(row.user_id, (userScores.get(row.user_id) ?? 0) + pts);
  }

  const total = userScores.size;
  // Count users who strictly beat me
  let above = 0;
  for (const [, pts] of userScores) {
    if (pts > myPoints) above++;
  }

  return NextResponse.json({
    rank:   above + 1,
    points: myPoints,
    total,
  });
}
