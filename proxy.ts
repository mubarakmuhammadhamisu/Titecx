// =============================================================================
// proxy.ts — FULLY REWRITTEN using @supabase/ssr
//
// WHY THIS FILE WAS REWRITTEN:
//   The old version tried to manually find and parse the Supabase session
//   cookie by looking for a cookie ending in "-auth-token". This broke because
//   newer versions of @supabase/supabase-js store the session split across
//   multiple cookies named "-auth-token.0", "-auth-token.1" etc. The old
//   check never matched those, so the proxy always thought the user was
//   logged out, causing an infinite 307 redirect loop between /login and
//   /dashboard.
//
//   This version uses @supabase/ssr's createServerClient which handles ALL
//   cookie reading/writing internally — no manual parsing needed. It also
//   automatically refreshes expired tokens so users are never incorrectly
//   kicked out.
// =============================================================================

import { createServerClient } from '@supabase/ssr';
import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit } from '@/lib/rateLimit';

export async function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ---------------------------------------------------------------------------
  // STEP 0 — Rate limit auth pages before any other work.
  //
  // login/register auth calls go directly to Supabase from the client, so
  // this limits page-load rate from a single IP. Supabase enforces its own
  // limits on the actual auth API calls.
  //   /login    — 10 requests per minute per IP
  //   /register — 5 requests per minute per IP
  // ---------------------------------------------------------------------------
  if (pathname === '/login' || pathname === '/register') {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim()
      ?? req.headers.get('x-real-ip')
      ?? 'unknown';
    const limit = pathname === '/register' ? 5 : 10;
    // Skip rate limiting when IP cannot be determined (local dev, stripped headers).
    // A shared 'unknown' bucket would incorrectly throttle unrelated clients.
    if (ip !== 'unknown') {
      const { allowed } = checkRateLimit(`${pathname}:${ip}`, limit, 60_000);
      if (!allowed) {
        return new NextResponse('Too many requests', {
          status: 429,
          headers: { 'Retry-After': '60' },
        });
      }
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 1 — Capture referral code from ?ref= query param and persist it as
  // a cookie for the duration of the session (7 days).
  //
  // WHY HERE: The landing page is a Server Component — it cannot set cookies
  // directly. Capturing in the proxy means any page (?ref= on /, /about,
  // /courses, etc.) correctly stores the code before the page even renders.
  //
  // Rules:
  //   - Only set when the param exists and passes the format check.
  //   - Redirect to the same URL without ?ref= so the code is not visible
  //     in the address bar after the first load (cleaner UX, prevents replay).
  //   - Cookie is NOT HttpOnly so the register page can read it client-side.
  //   - If the user logs in successfully, AuthContext clears this cookie.
  //   - If the user registers, AuthContext reads + clears this cookie.
  // ---------------------------------------------------------------------------
  const REF_CODE_RE = /^[A-Z]{4}-[A-Z0-9]{4}$/i;
  const refParam = req.nextUrl.searchParams.get('ref');

  if (refParam) {
    const cleanRef = refParam.trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
    if (REF_CODE_RE.test(cleanRef)) {
      const redirectUrl = req.nextUrl.clone();
      redirectUrl.searchParams.delete('ref');
      const refResponse = NextResponse.redirect(redirectUrl);
      refResponse.cookies.set('titecx_ref', cleanRef, {
        httpOnly: false,      // must be readable by register page JS
        sameSite: 'lax',
        maxAge:   60 * 60 * 24 * 7, // 7 days
        path:     '/',
      });
      return refResponse;
    }
  }

  // ---------------------------------------------------------------------------
  // STEP 1 — Create a response object FIRST, before anything else.  
  // ---------------------------------------------------------------------------
  let res = NextResponse.next({ request: req });

  // ---------------------------------------------------------------------------
  // STEP 2 — Create a Supabase client that works in the Edge Runtime.
  //
  
  // ---------------------------------------------------------------------------
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_Publishable_KEY!,
    {
      cookies: {
        // Read all cookies from the incoming request
        getAll() {
          return req.cookies.getAll();
        },

        // Write updated/refreshed cookies back out
        setAll(cookiesToSet) {
          // Write into the request first (current handler sees them)
          cookiesToSet.forEach(({ name, value }) =>
            req.cookies.set(name, value)
          );
          // Recreate the response with the updated request
          res = NextResponse.next({ request: req });
          // Write into the response (browser receives them)
          cookiesToSet.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // ---------------------------------------------------------------------------
  // STEP 3 — Verify the user's session with Supabase's servers.
  // ---------------------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---------------------------------------------------------------------------
  // STEP 4 — Protect routes and redirect logged-in users away from root.
  // ---------------------------------------------------------------------------
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin     = pathname.startsWith('/admin');
  const isRoot      = pathname === '/';
  // Auth pages — redirect logged-in users to dashboard so they can't
  // accidentally submit a second login or see the register form while signed in.
  const isAuthPage  = pathname === '/login' || pathname === '/register';

  // Logged-in user visiting the homepage — send them straight to the dashboard
  // before the page renders. This eliminates the flicker where the marketing
  // page briefly appears before a client-side redirect kicks in.
  if (isRoot && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  // Logged-in user visiting /login or /register — redirect to dashboard
  if (isAuthPage && user) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if ((isDashboard || isAdmin) && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ---------------------------------------------------------------------------
  // STEP 5 — Return the response.
  //
  // ---------------------------------------------------------------------------
  return res;
}

// -----------------------------------------------------------------------------
// Matcher — which routes this proxy runs on.
//
// The old matcher only ran on /dashboard and /admin. That was wrong.
// @supabase/ssr needs the proxy to run on EVERY route (except static
// files) so it can refresh the session token on every request. If the token
// only refreshes when you visit /dashboard, it can go stale on other pages.
//
// The pattern below means: run on everything EXCEPT:
//   - _next/static  (Next.js compiled JS/CSS files)
//   - _next/image   (Next.js image optimisation)
//   - favicon.ico
//   - any file with an image extension (svg, png, jpg, etc.)
// -----------------------------------------------------------------------------
export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
