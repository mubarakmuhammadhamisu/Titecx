// GET /api/admin/enrollments
//
// Returns all enrollments joined with student names and course titles.
// Shape matches the Enrollment interface in components/admin/mock-data.ts exactly.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  // ── 1. All enrollments ───────────────────────────────────────────────────
  const { data: enrollments, error } = await supabase
    .from('enrollments')
    .select('id, user_id, course_slug, progress, enrolled_at, completed_at, purchase_type, premium_deadline')
    .order('enrolled_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!enrollments || enrollments.length === 0) return NextResponse.json({ enrollments: [] });

  // ── 2. Enrich with student names + course titles ─────────────────────────
  const userIds = [...new Set(enrollments.map((e) => e.user_id))];
  const slugs   = [...new Set(enrollments.map((e) => e.course_slug))];

  const [{ data: profiles }, { data: courses }] = await Promise.all([
    supabase.from('profiles').select('id, name').in('id', userIds),
    supabase.from('courses').select('slug, title').in('slug', slugs),
  ]);

  const profileMap: Record<string, string> = {};
  for (const p of profiles ?? []) profileMap[p.id] = p.name ?? 'Unknown';

  const courseMap: Record<string, string> = {};
  for (const c of courses ?? []) courseMap[c.slug] = c.title;

  // ── 3. Referral info — who referred whom ────────────────────────────────
  const { data: referrals } = await supabase
    .from('referrals')
    .select('referee_id, referrer_id, status')
    .in('referee_id', userIds);

  // Map refereeId → referrerId for converted referrals
  const referrerMap: Record<string, string> = {};
  for (const r of referrals ?? []) {
    if (r.status === 'converted') referrerMap[r.referee_id] = r.referrer_id;
  }
  const referrerIds = [...new Set(Object.values(referrerMap))];
  const referrerNames: Record<string, string> = {};
  if (referrerIds.length > 0) {
    const { data: referrerProfiles } = await supabase
      .from('profiles')
      .select('id, name')
      .in('id', referrerIds);
    for (const p of referrerProfiles ?? []) referrerNames[p.id] = p.name ?? 'Unknown';
  }

  // ── 4. Derive status + payment type ─────────────────────────────────────
  const result = enrollments.map((e) => {
    const status: 'in-progress' | 'completed' | 'dropped' =
      e.progress === 100 ? 'completed' : e.progress > 0 ? 'in-progress' : 'in-progress';
    const paymentType: 'free' | 'paid' =
      e.purchase_type === 'free' ? 'free' : 'paid';
    const learningPoints = e.progress === 100 ? 800 : e.progress > 0 ? 200 : 0;
    const referrerId = referrerMap[e.user_id];

    return {
      id:                 e.id,
      studentId:          e.user_id,
      studentName:        profileMap[e.user_id]    ?? 'Unknown',
      courseId:           e.course_slug,
      courseName:         courseMap[e.course_slug] ?? e.course_slug,
      dateEnrolled:       e.enrolled_at,
      progress:           e.progress,
      completionDate:     e.completed_at ?? undefined,
      couponUsed:         undefined,
      paymentType,
      status,
      learning_points:    learningPoints,
      referral_triggered: !!referrerId,
      referrer_name:      referrerId ? (referrerNames[referrerId] ?? null) : null,
    };
  });

  return NextResponse.json({ enrollments: result });
}

// ── POST — manual enroll ──────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { studentId, courseId } = body;
  if (!studentId || !courseId) return NextResponse.json({ error: 'studentId and courseId required' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('enrollments').insert({
    user_id:      studentId,
    course_slug:  courseId,   // courseId is the slug in this context
    progress:     0,
    enrolled_at:  new Date().toISOString(),
    purchase_type: 'free',
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true }, { status: 201 });
}
