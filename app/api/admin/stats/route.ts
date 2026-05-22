// GET /api/admin/stats
//
// Returns aggregated numbers for the admin dashboard overview:
// totalRevenue, totalStudents, activeEnrollments, completedEnrollments,
// creditsIssuedThisMonth, pendingReferrals, revenueData (last 15 days),
// referralConversions (last 7 days), recentPayments (last 5).

import { NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  // ── 1. Total students ────────────────────────────────────────────────────
  const { count: totalStudents } = await supabase
    .from('profiles')
    .select('id', { count: 'exact', head: true })
    .neq('role', 'Admin');

  // ── 2. Enrollments — active + completed ─────────────────────────────────
  const { data: enrollmentStats } = await supabase
    .from('enrollments')
    .select('progress');

  const activeEnrollments    = (enrollmentStats ?? []).filter((e) => e.progress > 0 && e.progress < 100).length;
  const completedEnrollments = (enrollmentStats ?? []).filter((e) => e.progress === 100).length;

  // ── 3. Total revenue + recent payments ──────────────────────────────────
  const { data: payments } = await supabase
    .from('payments')
    .select('id, user_id, course_slug, amount_kobo, status, paid_at, paystack_reference, points_applied')
    .eq('status', 'success')
    .order('paid_at', { ascending: false });

  const totalRevenue = (payments ?? []).reduce((sum, p) => sum + Math.round(p.amount_kobo / 100), 0);

  // Enrich recent 5 payments with profile + course name
  const recent5 = (payments ?? []).slice(0, 5);
  const recentUserIds   = [...new Set(recent5.map((p) => p.user_id))];
  const recentSlugs     = [...new Set(recent5.map((p) => p.course_slug))];

  const [{ data: recentProfiles }, { data: recentCourses }] = await Promise.all([
    supabase.from('profiles').select('id, name, email').in('id', recentUserIds),
    supabase.from('courses').select('slug, title').in('slug', recentSlugs),
  ]);

  const profileMap: Record<string, { name: string; email: string }> = {};
  for (const p of recentProfiles ?? []) profileMap[p.id] = { name: p.name, email: p.email };
  const courseMap: Record<string, string> = {};
  for (const c of recentCourses ?? []) courseMap[c.slug] = c.title;

  const recentPayments = recent5.map((p) => ({
    id:             p.id,
    studentId:      p.user_id,
    studentName:    profileMap[p.user_id]?.name  ?? 'Unknown',
    courseId:       p.course_slug,
    courseName:     courseMap[p.course_slug]     ?? p.course_slug,
    amount:         Math.round(p.amount_kobo / 100),
    currency:       'NGN',
    reference:      p.paystack_reference,
    date:           p.paid_at,
    status:         p.status as 'success' | 'failed' | 'pending',
    credits_applied:    p.points_applied ?? 0,
    credits_value_ngn:  p.points_applied ?? 0,
    net_amount:         Math.round(p.amount_kobo / 100) - (p.points_applied ?? 0),
    referral_id:        null,
  }));

  // ── 4. Revenue last 15 days ──────────────────────────────────────────────
  const fifteenDaysAgo = new Date();
  fifteenDaysAgo.setDate(fifteenDaysAgo.getDate() - 14);

  const { data: recentPaid } = await supabase
    .from('payments')
    .select('amount_kobo, paid_at')
    .eq('status', 'success')
    .gte('paid_at', fifteenDaysAgo.toISOString());

  // Bucket by day
  const revenueByDay: Record<string, number> = {};
  for (let i = 14; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    revenueByDay[key] = 0;
  }
  for (const p of recentPaid ?? []) {
    const key = new Date(p.paid_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    if (key in revenueByDay) revenueByDay[key] += Math.round(p.amount_kobo / 100);
  }
  const revenueData = Object.entries(revenueByDay).map(([date, revenue]) => ({ date, revenue }));

  // ── 5. Referrals — credits issued this month + pending + last-7-day conversions ──
  const startOfMonth = new Date();
  startOfMonth.setDate(1);
  startOfMonth.setHours(0, 0, 0, 0);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

  const { data: referrals } = await supabase
    .from('referrals')
    .select('status, commission_points, converted_at')
    .gte('created_at', sevenDaysAgo.toISOString());

  const { data: allReferrals } = await supabase
    .from('referrals')
    .select('status, commission_points, converted_at');

  const creditsIssuedThisMonth = (allReferrals ?? [])
    .filter((r) => r.status === 'converted' && r.converted_at && new Date(r.converted_at) >= startOfMonth)
    .reduce((sum, r) => sum + (r.commission_points ?? 0), 0);

  const pendingReferrals = (allReferrals ?? []).filter((r) => r.status === 'pending').length;

  // Last 7 days conversions bucketed by day
  const convByDay: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
    convByDay[key] = 0;
  }
  for (const r of referrals ?? []) {
    if (r.status === 'converted' && r.converted_at) {
      const key = new Date(r.converted_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
      if (key in convByDay) convByDay[key] += 1;
    }
  }
  const referralConversions = Object.entries(convByDay).map(([date, conversions]) => ({ date, conversions }));

  return NextResponse.json({
    totalRevenue,
    totalStudents:          totalStudents ?? 0,
    activeEnrollments,
    completedEnrollments,
    creditsIssuedThisMonth,
    pendingReferrals,
    revenueData,
    referralConversions,
    recentPayments,
  });
}
