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
  //
  // We create it here so the Supabase cookie callbacks below can write
  // refreshed session cookies into it. If we created the response AFTER
  // calling Supabase, the fresh cookies would have nowhere to go.
  // ---------------------------------------------------------------------------
  let res = NextResponse.next({ request: req });

  // ---------------------------------------------------------------------------
  // STEP 2 — Create a Supabase client that works in the Edge Runtime.
  //
  // createServerClient needs two cookie callbacks:
  //
  //   getAll — called by Supabase to READ the current session from cookies.
  //            We just return every cookie from the incoming request.
  //
  //   setAll — called by Supabase when it needs to WRITE cookies back
  //            (e.g. when it silently refreshes an expiring access token).
  //            We write them into both the request (so the rest of this
  //            handler can see them) and the response (so the browser gets them).
  //
  // This two-way cookie adapter is exactly what was missing before.
  // Both the browser (createBrowserClient in lib/supabase.ts) and this
  // middleware (createServerClient) now use the SAME cookie format from
  // @supabase/ssr, so they can always read each other's sessions.
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
  //
  // IMPORTANT: We use getUser() NOT getSession().
  //
  //   getSession() only reads the local cookie and trusts whatever is in it.
  //   If someone manually forged a cookie, getSession() would believe them.
  //
  //   getUser() sends the token to Supabase's servers to verify it is real
  //   and has not been tampered with. It also silently refreshes the access
  //   token if it is about to expire (using the refresh token), then calls
  //   setAll above to save the new token. This is why users no longer get
  //   kicked out after 1 hour even though their session is still valid.
  // ---------------------------------------------------------------------------
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // ---------------------------------------------------------------------------
  // STEP 4 — Protect routes.
  //
  // If the user is not logged in and tries to reach /dashboard or /admin,
  // redirect them to /login and remember where they were going (?redirect=...)
  // so they land in the right place after logging in.
  // ---------------------------------------------------------------------------
  const isDashboard = pathname.startsWith('/dashboard');
  const isAdmin     = pathname.startsWith('/admin');

  if ((isDashboard || isAdmin) && !user) {
    const loginUrl = req.nextUrl.clone();
    loginUrl.pathname = '/login';
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // ---------------------------------------------------------------------------
  // STEP 5 — Return the response.
  //
  // Always return `res` (not NextResponse.next()) so that any refreshed
  // session cookies that Supabase wrote in setAll() above are actually
  // sent back to the browser. If you returned NextResponse.next() here
  // instead of `res`, the refreshed cookies would be lost.
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
