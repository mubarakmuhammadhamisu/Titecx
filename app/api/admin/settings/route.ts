// ─────────────────────────────────────────────────────────────────────────────
// GET  /api/admin/settings  — fetch all platform_settings rows
// POST /api/admin/settings  — upsert settings (admin only)
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { checkCsrfHeader } from '@/lib/csrf';

function getAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

async function getAuthenticatedAdmin(req?: NextRequest) {
  const cookieStore = await cookies();
  const sessionClient = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
    { cookies: { getAll: () => cookieStore.getAll(), setAll: () => {} } },
  );
  const { data: { user }, error } = await sessionClient.auth.getUser();
  if (error || !user) return null;

  // Verify admin role via profiles table
  const supabase = getAdminClient();
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'Admin') return null;
  return user;
}

// ── Allowed setting keys — whitelist to prevent arbitrary key injection ────
const ALLOWED_KEYS = new Set([
  'referral_commission_percent',
  'referral_window_days',
  'points_enabled',
]);

export async function GET() {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from('platform_settings')
    .select('key, value, description, updated_at');

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ settings: data });
}

export async function POST(req: NextRequest) {
  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  const admin = await getAuthenticatedAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: Record<string, string>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  // Validate each key is whitelisted and value is a non-empty string
  const entries = Object.entries(body).filter(([k]) => ALLOWED_KEYS.has(k));
  if (entries.length === 0) {
    return NextResponse.json({ error: 'No valid settings keys provided' }, { status: 400 });
  }

  for (const [key, value] of entries) {
    if (typeof value !== 'string' || value.trim() === '') {
      return NextResponse.json({ error: `Invalid value for key: ${key}` }, { status: 400 });
    }
  }

  // Extra validation: commission percent must be 0–100
  if (body.referral_commission_percent !== undefined) {
    const pct = Number(body.referral_commission_percent);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      return NextResponse.json({ error: 'Commission percent must be between 0 and 100' }, { status: 400 });
    }
  }

  // Extra validation: window days must be 1–365
  if (body.referral_window_days !== undefined) {
    const days = Number(body.referral_window_days);
    if (isNaN(days) || days < 1 || days > 365) {
      return NextResponse.json({ error: 'Referral window must be between 1 and 365 days' }, { status: 400 });
    }
  }

  const supabase = getAdminClient();
  const rows = entries.map(([key, value]) => ({
    key,
    value: value.trim(),
    updated_at: new Date().toISOString(),
  }));

  const { error } = await supabase
    .from('platform_settings')
    .upsert(rows, { onConflict: 'key' });

  if (error) {
    console.error('[admin/settings] upsert error:', error.message);
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 });
  }

  return NextResponse.json({ saved: true });
}
