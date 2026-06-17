import { NextRequest, NextResponse } from 'next/server';
import { getAdminClient, getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('coupons').select('*').order('created_at', { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupons: data ?? [] });
}

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;
  const body = await req.json();
  const { code, discount_percent, max_usage, expires_at } = body;
  if (!code?.trim() || !discount_percent) return NextResponse.json({ error: 'code and discount_percent required' }, { status: 400 });
  const supabase = getAdminClient();
  const { data, error } = await supabase.from('coupons').insert({
    code: code.trim().toUpperCase(), discount_percent, max_usage: max_usage ?? 100,
    used_count: 0, is_active: true, expires_at: expires_at ?? null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ coupon: data }, { status: 201 });
}
