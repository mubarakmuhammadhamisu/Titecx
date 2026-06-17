import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const { id } = await params;
  const supabase = getAdminClient();

  const [{ data: profile }, { data: enrollments }, { data: payments }, { data: points }] = await Promise.all([
    supabase.from('profiles').select('*').eq('id', id).single(),
    supabase.from('enrollments').select('*').eq('user_id', id).order('enrolled_at', { ascending: false }),
    supabase.from('payments').select('*').eq('user_id', id).order('paid_at', { ascending: false }),
    supabase.from('point_transactions').select('*').eq('user_id', id).order('created_at', { ascending: false }),
  ]);

  if (!profile) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Enrich enrollments with course titles
  const slugs = (enrollments ?? []).map((e) => e.course_slug);
  const { data: courses } = slugs.length
    ? await supabase.from('courses').select('slug, title').in('slug', slugs)
    : { data: [] };
  const cm: Record<string, string> = {};
  for (const c of courses ?? []) cm[c.slug] = c.title;

  return NextResponse.json({
    profile,
    enrollments: (enrollments ?? []).map((e) => ({ ...e, course_title: cm[e.course_slug] ?? e.course_slug })),
    payments: payments ?? [],
    point_transactions: points ?? [],
  });
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;
  const { id } = await params;
  const body = await req.json();
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('profiles').update(body).eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ profile: data });
}
