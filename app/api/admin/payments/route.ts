import { NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();
  const { data: payments, error } = await supabase
    .from('payments')
    .select('*')
    .order('paid_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!payments?.length) return NextResponse.json({ payments: [] });

  const userIds = [...new Set(payments.map((p) => p.user_id))];
  const slugs   = [...new Set(payments.map((p) => p.course_slug))];

  const [{ data: profiles }, { data: courses }] = await Promise.all([
    supabase.from('profiles').select('id, name, email').in('id', userIds),
    supabase.from('courses').select('slug, title').in('slug', slugs),
  ]);

  const pm: Record<string, any> = {};
  for (const p of profiles ?? []) pm[p.id] = p;
  const cm: Record<string, string> = {};
  for (const c of courses ?? []) cm[c.slug] = c.title;

  const enriched = payments.map((p) => ({
    ...p,
    student_name:  pm[p.user_id]?.name  ?? 'Unknown',
    student_email: pm[p.user_id]?.email ?? '',
    course_title:  cm[p.course_slug]    ?? p.course_slug,
  }));

  return NextResponse.json({ payments: enriched });
}
