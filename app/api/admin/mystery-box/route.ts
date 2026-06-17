import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getAdminClient();
  const { data: requests, error } = await supabase
    .from('mystery_box_requests').select('*').order('earned_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!requests?.length) return NextResponse.json({ requests: [] });

  const userIds = [...new Set(requests.map((r) => r.user_id))];
  const enrollIds = [...new Set(requests.map((r) => r.enrollment_id).filter(Boolean))];

  const [{ data: profiles }, { data: enrollments }] = await Promise.all([
    supabase.from('profiles').select('id, name, email').in('id', userIds),
    enrollIds.length ? supabase.from('enrollments').select('id, course_slug').in('id', enrollIds) : { data: [] },
  ]);

  const pm: Record<string, any> = {};
  for (const p of profiles ?? []) pm[p.id] = p;
  const em: Record<string, string> = {};
  for (const e of enrollments ?? []) em[e.id] = e.course_slug;

  const slugs = [...new Set(Object.values(em))];
  const { data: courses } = slugs.length
    ? await supabase.from('courses').select('slug, title').in('slug', slugs)
    : { data: [] };
  const cm: Record<string, string> = {};
  for (const c of courses ?? []) cm[c.slug] = c.title;

  const enriched = requests.map((r) => ({
    ...r,
    student_name:  pm[r.user_id]?.name  ?? 'Unknown',
    student_email: pm[r.user_id]?.email ?? '',
    course_title:  cm[em[r.enrollment_id]] ?? 'Unknown Course',
  }));

  return NextResponse.json({ requests: enriched });
}

export async function PATCH(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;
  const { id, ...updates } = await req.json();
  if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });
  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('mystery_box_requests')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ request: data });
}
