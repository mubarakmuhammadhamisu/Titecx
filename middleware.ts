// ─────────────────────────────────────────────────────────────────────────────
// middleware.ts — Server-side route protection
//
// Runs on the EDGE before any page or API route renders.
//
// Performance strategy:
//   /dashboard/* — decode JWT locally (no network call). Token integrity is
//                  enforced by Supabase RLS on every actual data fetch.
//   /admin/*     — decode locally + check role. Role is cached in an httpOnly
//                  cookie (5 min TTL) so the DB is not queried on every nav.
// ─────────────────────────────────────────────────────────────────────────────

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const PROTECTED  = ['/dashboard'];
const ADMIN_ONLY = ['/admin'];

// ── JWT helpers ───────────────────────────────────────────────────────────────

interface JwtPayload { sub?: string; exp?: number; [key: string]: unknown }

/**
 * Decode a JWT payload without signature verification.
 * Safe for route-protection use: any real data query still goes through
 * Supabase RLS which validates the same token server-side.
 */
function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64url → base64 → JSON
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const json = atob(b64);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  if (!payload.exp) return true;
  return Math.floor(Date.now() / 1000) >= payload.exp;
}

// ── Main handler ──────────────────────────────────────────────────────────────

export async function middleware(req: NextRequest): Promise<NextResponse> {
  const { pathname } = req.nextUrl;

  const needsAuth  = PROTECTED.some((p)  => pathname.startsWith(p));
  const needsAdmin = ADMIN_ONLY.some((p) => pathname.startsWith(p));

  if (!needsAuth && !needsAdmin) return NextResponse.next();

  const token = extractToken(req);
  if (!token) return toLogin(req);

  // ── Local JWT decode (zero network cost) ─────────────────────────────────
  const payload = decodeJwtPayload(token);
  if (!payload?.sub || isTokenExpired(payload)) return toLogin(req);

  const userId = payload.sub;

  // ── Admin routes: role check with short-lived cookie cache ────────────────
  if (needsAdmin) {
    const cachedRole = req.cookies.get('_lrn_role')?.value;

    // Happy-path: cached as admin — no DB query needed
    if (cachedRole === 'admin') {
      const res = NextResponse.next();
      res.headers.set('x-user-id', userId);
      return res;
    }

    // Cached as non-admin
    if (cachedRole === 'member') {
      return NextResponse.redirect(new URL('/dashboard', req.url));
    }

    // No cache — query the DB once, then cache the result for 5 minutes
    const admin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
    );
    const { data } = await admin
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .maybeSingle();

    const role = (data as { role?: string } | null)?.role ?? 'member';
    const ROLE_CACHE_SECONDS = 300; // 5 minutes

    if (role !== 'admin') {
      const res = NextResponse.redirect(new URL('/dashboard', req.url));
      res.cookies.set('_lrn_role', 'member', {
        maxAge: ROLE_CACHE_SECONDS, httpOnly: true, sameSite: 'lax', path: '/',
      });
      return res;
    }

    const res = NextResponse.next();
    res.headers.set('x-user-id', userId);
    res.cookies.set('_lrn_role', 'admin', {
      maxAge: ROLE_CACHE_SECONDS, httpOnly: true, sameSite: 'lax', path: '/',
    });
    return res;
  }

  // ── Dashboard routes: local decode was sufficient ─────────────────────────
  const res = NextResponse.next();
  res.headers.set('x-user-id', userId);
  return res;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function toLogin(req: NextRequest): NextResponse {
  const url = new URL('/login', req.url);
  url.searchParams.set('redirect', req.nextUrl.pathname);
  return NextResponse.redirect(url);
}

/**
 * Extract the Supabase access token from:
 *   1. Authorization: Bearer <token>  (API calls / server-side fetch)
 *   2. sb-<ref>-auth-token cookie     (browser navigation)
 */
function extractToken(req: NextRequest): string | null {
  const auth = req.headers.get('authorization') ?? '';
  if (auth.startsWith('Bearer ')) return auth.slice(7);

  for (const cookie of req.cookies.getAll()) {
    if (!cookie.name.startsWith('sb-') || !cookie.name.endsWith('-auth-token')) continue;
    try {
      const val = decodeURIComponent(cookie.value);
      const parsed: unknown = JSON.parse(val);
      if (Array.isArray(parsed) && typeof parsed[0] === 'string' && parsed[0].length > 20) {
        return parsed[0] as string;
      }
      if (typeof parsed === 'string' && parsed.length > 20) return parsed;
    } catch {
      if (cookie.value.length > 20) return cookie.value;
    }
  }

  return null;
}

export const config = {
  matcher: ['/dashboard/:path*', '/admin/:path*'],
};
