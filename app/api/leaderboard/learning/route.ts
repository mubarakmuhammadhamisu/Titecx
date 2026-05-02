// GET /api/leaderboard/learning?page=1&limit=20
//
// Track B — Learning Points (Derived, never stored in DB).
//
// Scoring formula:
//   Completed course  (progress = 100) → 800 pts
//   In-Progress course (0 < progress < 100) → 200 pts
//
// This is intentionally calculated in application code — no new DB columns,
// no views, no materialised tables. At scale this should become a DB view or
// scheduled summary. For now it's fast enough for the platform's user volume.
//
// Auth: any authenticated user. Rate limited.

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

export interface LearningLeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  avatar_url: string | null;
  learning_points: number;       // derived — not stored
  courses_completed: number;     // progress = 100
  courses_in_progress: number;   // 0 < progress < 100
  rank: number;
}

export interface LearningLeaderboardResponse {
  leaderboard: LearningLeaderboardEntry[];
  total: number;
  page: number;
  limit: number;
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

  const { allowed } = checkRateLimit(`leaderboard-learning:${user.id}`, 30, 60_000);
  if (!allowed) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429 });
  }

  const { searchParams } = req.nextUrl;
  const page  = Math.max(1, parseInt(searchParams.get('page')  ?? '1', 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') ?? '20', 10)));

  const supabase = getAdminClient();

  // ── Step 1: Pull all enrollments with any learning progress ──────────────
  // We only need user_id + progress to compute the score.
  const { data: enrollments, error: enrollError } = await supabase
    .from('enrollments')
    .select('user_id, progress')
    .gt('progress', 0);

  if (enrollError) {
    return NextResponse.json({ error: enrollError.message }, { status: 500 });
  }

  // ── Step 2: Aggregate per user in JS ─────────────────────────────────────
  const userScores = new Map<string, {
    completed: number;
    in_progress: number;
    learning_points: number;
  }>();

  for (const row of enrollments ?? []) {
    const entry = userScores.get(row.user_id) ?? { completed: 0, in_progress: 0, learning_points: 0 };
    if (row.progress === 100) {
      entry.completed     += 1;
      entry.learning_points += COMPLETED_PTS;
    } else {
      entry.in_progress    += 1;
      entry.learning_points += IN_PROGRESS_PTS;
    }
    userScores.set(row.user_id, entry);
  }

  // ── Step 3: Sort by learning_points desc, stable tie-break by user_id ────
  const sorted = [...userScores.entries()]
    .sort(([aId, aVal], [bId, bVal]) => {
      if (bVal.learning_points !== aVal.learning_points) {
        return bVal.learning_points - aVal.learning_points;
      }
      return aId < bId ? -1 : 1; // stable tie-break
    });

  const total = sorted.length;
  const from  = (page - 1) * limit;
  const pageSlice = sorted.slice(from, from + limit);

  if (pageSlice.length === 0) {
    return NextResponse.json({ leaderboard: [], total, page, limit });
  }

  // ── Step 4: Fetch profiles for this page's user IDs only ─────────────────
  const pageUserIds = pageSlice.map(([id]) => id);

  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id, name, avatar, avatar_url')
    .in('id', pageUserIds);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 500 });
  }

  const profileMap = new Map((profiles ?? []).map((p: any) => [p.id, p]));

  // ── Step 5: Build response, preserving sort order ─────────────────────────
  const leaderboard: LearningLeaderboardEntry[] = pageSlice
    .map(([userId, scores], i) => {
      const profile = profileMap.get(userId);
      // If profile is missing (deleted account etc.), skip gracefully
      if (!profile) return null;
      return {
        id:                 userId,
        name:               profile.name ?? 'Unknown',
        avatar:             profile.avatar ?? '',
        avatar_url:         profile.avatar_url ?? null,
        learning_points:    scores.learning_points,
        courses_completed:  scores.completed,
        courses_in_progress: scores.in_progress,
        rank:               from + i + 1,
      };
    })
    .filter((e): e is LearningLeaderboardEntry => e !== null);

  return NextResponse.json({ leaderboard, total, page, limit });
}
