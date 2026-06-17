import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  const { data: courses, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Enrich with enrollment count + revenue
  const slugs = (courses ?? []).map((c) => c.slug);
  if (slugs.length === 0) return NextResponse.json({ courses: [] });

  const [{ data: enrollments }, { data: payments }] = await Promise.all([
    supabase.from('enrollments').select('course_slug').in('course_slug', slugs),
    supabase.from('payments').select('course_slug, amount_kobo').eq('status', 'success').in('course_slug', slugs),
  ]);

  const enrollMap: Record<string, number> = {};
  for (const e of enrollments ?? []) enrollMap[e.course_slug] = (enrollMap[e.course_slug] ?? 0) + 1;

  const revenueMap: Record<string, number> = {};
  for (const p of payments ?? []) revenueMap[p.course_slug] = (revenueMap[p.course_slug] ?? 0) + p.amount_kobo;

  const enriched = (courses ?? []).map((c) => ({
    ...c,
    enrolled_count:     enrollMap[c.slug]   ?? 0,
    total_revenue_kobo: revenueMap[c.slug]  ?? 0,
  }));

  return NextResponse.json({ courses: enriched });
}

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const body = await req.json();
  const { title, slug, short_description, description, level, duration, price,
          instructor, thumbnail, gradient_from, gradient_to, features,
          curriculum, modules, is_published, premium_price, premium_deadline_days } = body;

  if (!title?.trim() || !slug?.trim()) {
    return NextResponse.json({ error: 'title and slug are required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase.from('courses').insert({
    title, slug, short_description: short_description ?? '',
    description: description ?? '', level: level ?? 'Beginner',
    duration: duration ?? '', price: price ?? '0',
    instructor: instructor ?? '', thumbnail: thumbnail ?? '',
    gradient_from: gradient_from ?? '#6366f1', gradient_to: gradient_to ?? '#8b5cf6',
    features: features ?? [], curriculum: curriculum ?? [],
    modules: modules ?? [], is_published: is_published ?? false,
    premium_price: premium_price ?? null,
    premium_deadline_days: premium_deadline_days ?? 60,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ course: data }, { status: 201 });
}
