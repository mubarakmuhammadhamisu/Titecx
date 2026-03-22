// app/error.tsx
//
// Next.js App Router global error boundary.
// This file MUST be 'use client' — it uses React's error boundary API
// which requires the `reset` function to be callable from the browser.
//
// When to show: any unhandled runtime error in a Server or Client Component
// that is not caught by a more specific error.tsx in a sub-route.
//
// What NOT to do here:
//   - Do NOT use useAuth() — the AuthProvider may itself have thrown.
//   - Do NOT import heavy components — keep this file small and dependency-free.
'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  // Log to console in development so the error is still visible in DevTools.
  // In production, replace this with your error monitoring service (e.g. Sentry).
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20
                          flex items-center justify-center">
            <AlertTriangle size={28} className="text-red-400" />
          </div>
        </div>

        {/* Message */}
        <div>
          <h1 className="text-2xl font-bold text-white mb-2">
            Something went wrong
          </h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            An unexpected error occurred. Your data is safe — this is usually
            a temporary issue.
          </p>
          {/* Show digest in development to help debugging, hide in prod */}
          {process.env.NODE_ENV === 'development' && error.message && (
            <p className="mt-3 text-xs text-red-400/70 font-mono bg-red-500/5
                          border border-red-500/10 rounded-lg px-3 py-2 text-left">
              {error.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          {/* reset() re-renders the segment that errored — no full page reload */}
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                       bg-indigo-600 hover:bg-indigo-700 text-white font-semibold
                       text-sm transition"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                       border border-indigo-500/30 hover:border-indigo-500/60
                       text-gray-300 text-sm transition"
          >
            <Home size={16} />
            Go Home
          </Link>
        </div>

      </div>
    </div>
  );
}
