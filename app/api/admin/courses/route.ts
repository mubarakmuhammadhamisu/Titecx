// GET /api/admin/courses
//
// Returns all courses enriched with enrollment counts, total revenue,
// and completion rates. Shape matches the Course interface in mock-data.ts.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  // ── 1. All courses ───────────────────────────────────────────────────────
  const { data: courses, error } = await supabase
    .from('courses')
    .select('id, slug, title, description, price, is_published, modules')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!courses || courses.length === 0) return NextResponse.json({ courses: [] });

  const slugs = courses.map((c) => c.slug);

  // ── 2. Enrollment counts + completion rates per course ───────────────────
  const { data: enrollments } = await supabase
    .from('enrollments')
    .select('course_slug, progress')
    .in('course_slug', slugs);

  const enrollCountMap:  Record<string, number> = {};
  const completedMap:    Record<string, number> = {};
  for (const e of enrollments ?? []) {
    enrollCountMap[e.course_slug]  = (enrollCountMap[e.course_slug]  ?? 0) + 1;
    if (e.progress === 100) completedMap[e.course_slug] = (completedMap[e.course_slug] ?? 0) + 1;
  }

  // ── 3. Total revenue per course ──────────────────────────────────────────
  const { data: payments } = await supabase
    .from('payments')
    .select('course_slug, amount_kobo')
    .eq('status', 'success')
    .in('course_slug', slugs);

  const revenueMap: Record<string, number> = {};
  for (const p of payments ?? []) {
    revenueMap[p.course_slug] = (revenueMap[p.course_slug] ?? 0) + Math.round(p.amount_kobo / 100);
  }

  // ── 4. Count lessons from modules JSONB ─────────────────────────────────
  function countLessons(modules: unknown): number {
    if (!Array.isArray(modules)) return 0;
    return modules.reduce((sum: number, m: any) => sum + (Array.isArray(m?.lessons) ? m.lessons.length : 0), 0);
  }

  // ── 5. Assemble ──────────────────────────────────────────────────────────
  const result = courses.map((c) => {
    const enrolled  = enrollCountMap[c.slug] ?? 0;
    const completed = completedMap[c.slug]    ?? 0;
    return {
      id:             c.id,
      title:          c.title,
      description:    c.description ?? '',
      price:          c.price ? Math.round(Number(c.price)) : 0,
      enrolledCount:  enrolled,
      totalRevenue:   revenueMap[c.slug] ?? 0,
      published:      c.is_published ?? false,
      lessonsCount:   countLessons(c.modules),
      completionRate: enrolled > 0 ? Math.round((completed / enrolled) * 100) : 0,
    };
  });

  return NextResponse.json({ courses: result });
}

// ── POST — create new course ──────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { title, description, instructor, level, price, published, modules } = body;

  if (!title || !description || !instructor || price === undefined) {
    return NextResponse.json({ error: 'title, description, instructor, price are required' }, { status: 400 });
  }

  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    + '-' + Date.now();

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('courses')
    .insert({
      slug,
      title,
      description,
      instructor: instructor ?? '',
      level:      level ?? 'Beginner',
      price:      String(price),
      is_published: published ?? false,
      modules:    modules ?? [],
      features:   [],
      curriculum: [],
    })
    .select('id, slug, title, description, price, is_published, modules')
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({
    course: {
      id:             data.id,
      title:          data.title,
      description:    data.description ?? '',
      price:          data.price ? Math.round(Number(data.price)) : 0,
      enrolledCount:  0,
      totalRevenue:   0,
      published:      data.is_published ?? false,
      lessonsCount:   0,
      completionRate: 0,
    },
  }, { status: 201 });
}

// ── PATCH — toggle is_published for a course ──────────────────────────────────
// Body: { courseId: string; published: boolean }
export async function PATCH(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { courseId, published } = await req.json();
  if (!courseId || typeof published !== 'boolean') {
    return NextResponse.json({ error: 'courseId and published (boolean) are required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('courses')
    .update({ is_published: published })
    .eq('id', courseId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

// ── DELETE — remove a course ──────────────────────────────────────────────────
// Body: { courseId: string }
export async function DELETE(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { courseId } = await req.json();
  if (!courseId) return NextResponse.json({ error: 'courseId is required' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('courses')
    .delete()
    .eq('id', courseId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
