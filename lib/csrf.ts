// -----------------------------------------------------------------------------
// lib/csrf.ts
//
// Custom-header CSRF protection for sensitive POST endpoints.
//
// Strategy: require a non-standard header on every mutating request.
//   - Cross-site HTML form POSTs cannot include custom headers → blocked.
//   - Cross-site fetch/XHR with a custom header triggers a CORS preflight.
//     The server does not return Access-Control-Allow-Origin, so the browser
//     aborts the request before the actual POST is ever sent → blocked.
//   - Same-origin requests from our own client trivially include the header.
//
// Usage (server):
//   const csrfError = checkCsrfHeader(req);
//   if (csrfError) return csrfError;
//
// Usage (client):
//   fetch('/api/...', { headers: { ...CSRF_HEADER } })
// -----------------------------------------------------------------------------

import { NextRequest, NextResponse } from 'next/server';

export const CSRF_HEADER_NAME  = 'x-csrf-protection';
export const CSRF_HEADER_VALUE = '1';

/**
 * Validates the CSRF custom header on an incoming request.
 * Returns a 403 NextResponse if the header is absent or wrong,
 * or null if the request is allowed to continue.
 */
export function checkCsrfHeader(req: NextRequest): NextResponse | null {
  const value = req.headers.get(CSRF_HEADER_NAME);
  if (value !== CSRF_HEADER_VALUE) {
    console.warn(`[csrf] Missing or invalid header on ${req.nextUrl.pathname}`);
    return NextResponse.json(
      { error: 'Forbidden — missing CSRF header' },
      { status: 403 },
    );
  }
  return null;
}
