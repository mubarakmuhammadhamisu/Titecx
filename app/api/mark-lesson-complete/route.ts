// -----------------------------------------------------------------------------
// POST /api/mark-lesson-complete
//
// Moves the lesson_completions write server-side so enrollment is verified
// before any DB write. Previously the client called supabase directly, which
// relied purely on RLS and could be bypassed via the browser console.
//
// Flow:
//   1. CSRF check
//   2. Verify authenticated session via JWT cookie
//   3. Verify user is enrolled in the course — reject 403 if not
//   4. Upsert into lesson_completions (Write 1)
//   5. Recompute progress from DB and update enrollments row (Write 2)
//
// Response shape (always JSON):
//   { success: true }                — both writes OK
//   { error: 'progress_failed' }     — Write 1 OK, Write 2 failed (200)
//   { error: 'completion_failed' }   — Write 1 failed (500)
//   { error: 'not_enrolled' }        — not enrolled (403)
//   { error: 'Unauthorized' }        — no session (401)
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { checkCsrfHeader } from '@/lib/csrf';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

export async function POST(req: NextRequest) {
  // ── CSRF ──────────────────────────────────────────────────────────────────
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  // ── Session ───────────────────────────────────────────────────────────────
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

  // ── Body ──────────────────────────────────────────────────────────────────
  let body: { courseSlug?: string; lessonId?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { courseSlug, lessonId } = body;
  if (!courseSlug || !lessonId || typeof courseSlug !== 'string' || typeof lessonId !== 'string') {
    return NextResponse.json({ error: 'Missing or invalid courseSlug or lessonId' }, { status: 400 });
  }

  const supabase = getAdminClient();

  // ── Enrollment gate ───────────────────────────────────────────────────────
  // This is the critical check that was missing when the client called Supabase
  // directly. An unauthenticated or unenrolled user cannot reach the writes below.
  const { data: enrollment } = await supabase
    .from('enrollments')
    .select('id')
    .eq('user_id', user.id)
    .eq('course_slug', courseSlug)
    .maybeSingle();

  if (!enrollment) {
    console.warn('[mark-lesson-complete] User not enrolled:', user.id, courseSlug);
    return NextResponse.json({ error: 'not_enrolled' }, { status: 403 });
  }

  // ── Write 1: record lesson completion ─────────────────────────────────────
  const { error: completionError } = await supabase.from('lesson_completions').upsert(
    { user_id: user.id, course_slug: courseSlug, lesson_id: lessonId },
    { onConflict: 'user_id,course_slug,lesson_id' },
  );

  if (completionError) {
    console.error('[mark-lesson-complete] lesson_completions write failed:', completionError.message);
    return NextResponse.json({ error: 'completion_failed' }, { status: 500 });
  }

  // ── Write 2: recompute progress and update enrollment row ─────────────────
  // Fetch all completed lessons for this user+course (post-upsert, so includes
  // the lesson just marked complete). Then fetch course modules to get total
  // lesson count and compute the accurate progress percentage.
  const [{ data: completions }, { data: courseData }] = await Promise.all([
    supabase
      .from('lesson_completions')
      .select('lesson_id')
      .eq('user_id', user.id)
      .eq('course_slug', courseSlug),
    supabase
      .from('courses')
      .select('modules')
      .eq('slug', courseSlug)
      .maybeSingle(),
  ]);

  if (courseData?.modules && Array.isArray(courseData.modules) && courseData.modules.length > 0) {
    const modules = courseData.modules as Array<{ lessons: Array<{ id: string }> }>;
    const totalLessons = modules.flatMap((m) => m.lessons).length;

    if (totalLessons > 0) {
      const completedIds = new Set((completions ?? []).map((c) => c.lesson_id));
      const completedCount = modules.flatMap((m) => m.lessons).filter((l) => completedIds.has(l.id)).length;
      const progress = Math.round((completedCount / totalLessons) * 100);

      const { error: progressError } = await supabase
        .from('enrollments')
        .update({
          progress,
          completed_at: progress === 100 ? new Date().toISOString() : null,
        })
        .eq('user_id', user.id)
        .eq('course_slug', courseSlug);

      if (progressError) {
        // Write 1 succeeded — lesson IS saved. Signal partial failure so the
        // client keeps the checkmark but rolls back the progress bar.
        console.error('[mark-lesson-complete] enrollments update failed:', progressError.message);
        return NextResponse.json({ error: 'progress_failed' });
      }
    }
  }

  return NextResponse.json({ success: true });
}
