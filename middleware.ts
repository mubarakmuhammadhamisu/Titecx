// =============================================================================
// middleware.ts — FULLY REWRITTEN using @supabase/ssr
//
// WHY THIS FILE WAS REWRITTEN:
//   The old version tried to manually find and parse the Supabase session
//   cookie by looking for a cookie ending in "-auth-token". This broke because
//   newer versions of @supabase/supabase-js store the session split across
//   multiple cookies named "-auth-token.0", "-auth-token.1" etc. The old
//   check never matched those, so the middleware always thought the user was
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

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

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

  // Logged-in user visiting the homepage — send them straight to the dashboard
  // before the page renders. This eliminates the flicker where the marketing
  // page briefly appears before a client-side redirect kicks in.
  if (isRoot && user) {
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
// Matcher — which routes this middleware runs on.
//
// The old matcher only ran on /dashboard and /admin. That was wrong.
// @supabase/ssr needs the middleware to run on EVERY route (except static
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
