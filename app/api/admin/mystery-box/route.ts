// GET   /api/admin/mystery-box         — list all mystery box requests
// PATCH /api/admin/mystery-box         — update status, tracking number, or notes
//
// Joins mystery_box_requests → enrollments → profiles → courses.
// Shape matches the MysteryBoxRequest interface defined in the page file.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();

  const { data: requests, error } = await supabase
    .from('mystery_box_requests')
    .select(`
      id,
      user_id,
      enrollment_id,
      status,
      tracking_number,
      delivery_name,
      delivery_address,
      delivery_city,
      delivery_state,
      delivery_phone,
      notes,
      earned_at,
      updated_at
    `)
    .order('earned_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!requests || requests.length === 0) return NextResponse.json({ requests: [] });

  // Enrich: pull student profile + enrollment + course in parallel
  const userIds       = [...new Set(requests.map((r) => r.user_id))];
  const enrollmentIds = [...new Set(requests.map((r) => r.enrollment_id).filter(Boolean))];

  const [{ data: profiles }, { data: enrollments }] = await Promise.all([
    supabase.from('profiles').select('id, name, email').in('id', userIds),
    enrollmentIds.length
      ? supabase.from('enrollments').select('id, course_slug, premium_deadline').in('id', enrollmentIds)
      : Promise.resolve({ data: [] }),
  ]);

  const profileMap: Record<string, { name: string; email: string }> = {};
  for (const p of profiles ?? []) profileMap[p.id] = { name: p.name ?? 'Unknown', email: p.email ?? '' };

  const enrollMap: Record<string, { course_slug: string; premium_deadline: string | null }> = {};
  for (const e of enrollments ?? []) enrollMap[e.id] = { course_slug: e.course_slug, premium_deadline: e.premium_deadline };

  const slugs = [...new Set(Object.values(enrollMap).map((e) => e.course_slug))];
  const { data: courses } = slugs.length
    ? await supabase.from('courses').select('slug, title').in('slug', slugs)
    : { data: [] };

  const courseMap: Record<string, string> = {};
  for (const c of courses ?? []) courseMap[c.slug] = c.title;

  const result = requests.map((r) => {
    const enroll  = r.enrollment_id ? enrollMap[r.enrollment_id] : null;
    const slug    = enroll?.course_slug ?? '';
    const hasAddr = !!(r.delivery_name && r.delivery_address && r.delivery_city);

    return {
      id:              r.id,
      studentName:     profileMap[r.user_id]?.name  ?? 'Unknown',
      studentEmail:    profileMap[r.user_id]?.email ?? '',
      courseName:      courseMap[slug]              ?? slug,
      courseSlug:      slug,
      earnedAt:        r.earned_at,
      premiumDeadline: enroll?.premium_deadline     ?? null,
      status:          r.status,
      trackingNumber:  r.tracking_number            ?? null,
      deliveryAddress: hasAddr
        ? {
            name:    r.delivery_name,
            address: r.delivery_address,
            city:    r.delivery_city,
            state:   r.delivery_state ?? '',
            phone:   r.delivery_phone ?? '',
          }
        : null,
      notes: r.notes ?? '',
    };
  });

  return NextResponse.json({ requests: result });
}

// ── PATCH — advance status or save tracking/notes ─────────────────────────────
export async function PATCH(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, status, trackingNumber, notes } = body;

  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status         !== undefined) updates.status          = status;
  if (trackingNumber !== undefined) updates.tracking_number = trackingNumber || null;
  if (notes          !== undefined) updates.notes           = notes;

  const supabase = getAdminClient();
  const { error } = await supabase
    .from('mystery_box_requests')
    .update(updates)
    .eq('id', id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
