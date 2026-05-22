// GET  /api/admin/coupons        — list all coupons
// POST /api/admin/coupons        — create a new coupon
// PATCH /api/admin/coupons       — update or toggle a coupon (body: { id, ...fields })
// DELETE /api/admin/coupons?id=  — delete a coupon by id
//
// Coupons live in their own table in Supabase (columns: id, code,
// discount_percent, max_usage, used_count, is_active, expires_at, created_at).
// Shape returned matches the Coupon interface in mock-data.ts.

import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';

function mapRow(row: Record<string, unknown>): Record<string, unknown> {
  return {
    id:                 row.id,
    code:               row.code,
    discountPercentage: row.discount_percent,
    timesUsed:          row.used_count      ?? 0,
    maxUses:            row.max_usage       ?? 0,
    expiryDate:         row.expires_at      ? (row.expires_at as string).split('T')[0] : '2099-12-31',
    active:             row.is_active       ?? true,
    createdDate:        row.created_at      ? (row.created_at as string).split('T')[0] : '',
  };
}

// ── GET ───────────────────────────────────────────────────────────────────────
export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('coupons')
    .select('id, code, discount_percent, max_usage, used_count, is_active, expires_at, created_at')
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: (data ?? []).map(mapRow) });
}

// ── POST — create ─────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { code, discountPercentage, maxUses, expiryDate } = body;

  if (!code || !discountPercentage || !maxUses) {
    return NextResponse.json({ error: 'code, discountPercentage, maxUses are required' }, { status: 400 });
  }

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('coupons')
    .insert({
      code:             String(code).toUpperCase(),
      discount_percent: Number(discountPercentage),
      max_usage:        Number(maxUses),
      used_count:       0,
      is_active:        true,
      expires_at:       expiryDate ? new Date(expiryDate).toISOString() : null,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: mapRow(data) }, { status: 201 });
}

// ── PATCH — update / toggle ───────────────────────────────────────────────────
export async function PATCH(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const body = await req.json();
  const { id, ...fields } = body;
  if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

  // Map interface field names → DB column names
  const dbFields: Record<string, unknown> = {};
  if ('active'             in fields) dbFields.is_active        = fields.active;
  if ('discountPercentage' in fields) dbFields.discount_percent = fields.discountPercentage;
  if ('maxUses'            in fields) dbFields.max_usage        = fields.maxUses;
  if ('code'               in fields) dbFields.code             = String(fields.code).toUpperCase();
  if ('expiryDate'         in fields) dbFields.expires_at       = fields.expiryDate ? new Date(fields.expiryDate as string).toISOString() : null;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('coupons')
    .update(dbFields)
    .eq('id', id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: mapRow(data) });
}

// ── DELETE ────────────────────────────────────────────────────────────────────
export async function DELETE(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'id query param is required' }, { status: 400 });

  const supabase = getAdminClient();
  const { error } = await supabase.from('coupons').delete().eq('id', id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}
