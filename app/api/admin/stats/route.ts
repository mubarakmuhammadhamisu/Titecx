import { NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  const [
    { data: payments },
    { count: totalStudents },
    { count: activeEnrollments },
    { count: completedEnrollments },
  ] = await Promise.all([
    supabase
      .from('payments')
      .select('id, user_id, course_slug, paystack_reference, amount_kobo, status, paid_at, points_applied')
      .eq('status', 'success')
      .order('paid_at', { ascending: false }),
    supabase.from('profiles').select('*', { count: 'exact', head: true }),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).lt('progress', 100),
    supabase.from('enrollments').select('*', { count: 'exact', head: true }).eq('progress', 100),
  ]);

  // Revenue by day (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const recentPayments = (payments ?? []).filter(
    (p) => new Date(p.paid_at) >= thirtyDaysAgo
  );

  // Group by date
  const revenueMap: Record<string, number> = {};
  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    revenueMap[d.toISOString().slice(0, 10)] = 0;
  }
  for (const p of recentPayments) {
    const day = p.paid_at.slice(0, 10);
    if (revenueMap[day] !== undefined) revenueMap[day] += p.amount_kobo;
  }
  const revenue_by_day = Object.entries(revenueMap).map(([date, revenue_kobo]) => ({ date, revenue_kobo }));

  // Enrich recent 10 payments with names
  const last10 = (payments ?? []).slice(0, 10);
  let enrichedPayments: any[] = last10;
  if (last10.length > 0) {
    const userIds  = [...new Set(last10.map((p) => p.user_id))];
    const slugs    = [...new Set(last10.map((p) => p.course_slug))];
    const [{ data: profiles }, { data: courses }] = await Promise.all([
      supabase.from('profiles').select('id, name, email').in('id', userIds),
      supabase.from('courses').select('slug, title').in('slug', slugs),
    ]);
    const pm: Record<string, any> = {};
    for (const p of profiles ?? []) pm[p.id] = p;
    const cm: Record<string, string> = {};
    for (const c of courses ?? []) cm[c.slug] = c.title;
    enrichedPayments = last10.map((p) => ({
      ...p,
      student_name:  pm[p.user_id]?.name  ?? 'Unknown',
      student_email: pm[p.user_id]?.email ?? '',
      course_title:  cm[p.course_slug]    ?? p.course_slug,
    }));
  }

  return NextResponse.json({
    total_revenue_kobo:    (payments ?? []).reduce((s, p) => s + p.amount_kobo, 0),
    total_students:        totalStudents ?? 0,
    active_enrollments:    activeEnrollments ?? 0,
    completed_enrollments: completedEnrollments ?? 0,
    revenue_by_day,
    recent_payments: enrichedPayments,
  });
}
