// POST /api/admin/payments/verify
// Body: { reference: string }
// Verifies a Paystack transaction by reference. Admin-only.

import { NextRequest, NextResponse } from 'next/server';
import { getAuthenticatedAdmin } from '@/lib/adminSupabase';
import { checkCsrfHeader } from '@/lib/csrf';

export async function POST(req: NextRequest) {
  const admin = await getAuthenticatedAdmin();
  if (!admin) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const csrfError = checkCsrfHeader(req);
  if (csrfError) return csrfError;

  let reference: string;
  try {
    const body = await req.json();
    reference = body.reference;
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  if (!reference || typeof reference !== 'string' || reference.trim() === '') {
    return NextResponse.json({ error: 'reference is required' }, { status: 400 });
  }

  const paystackKey = process.env.PAYSTACK_SECRET_KEY;
  if (!paystackKey) {
    console.error('[verify] PAYSTACK_SECRET_KEY is not set');
    return NextResponse.json({ error: 'Payment verification is not configured' }, { status: 500 });
  }

  let paystackRes: Response;
  try {
    paystackRes = await fetch(
      `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference.trim())}`,
      {
        headers: {
          Authorization: `Bearer ${paystackKey}`,
          'Content-Type': 'application/json',
        },
      },
    );
  } catch (err) {
    console.error('[verify] Network error calling Paystack:', err);
    return NextResponse.json({ error: 'Could not reach Paystack' }, { status: 502 });
  }

  const data = await paystackRes.json();
  return NextResponse.json(data, { status: paystackRes.ok ? 200 : paystackRes.status });
}
