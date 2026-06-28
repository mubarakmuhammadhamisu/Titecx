'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

interface ErrorPageProps {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function GlobalError({ error, reset }: ErrorPageProps) {
  useEffect(() => {
    console.error('[GlobalError]', error);
  }, [error]);

  // If the error happened inside /admin, the Home button returns to the
  // admin dashboard — not the public homepage.
  const isAdminRoute =
    typeof window !== 'undefined' &&
    window.location.pathname.startsWith('/admin');

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
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
          {process.env.NODE_ENV === 'development' && error.message && (
            <p className="mt-3 text-xs text-red-400/70 font-mono bg-red-500/5 border border-red-500/10 rounded-lg px-3 py-2 text-left">
              {error.message}
            </p>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
          >
            <RefreshCw size={16} />
            Try Again
          </button>
          <Link
            href={isAdminRoute ? '/admin' : '/'}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-xl border border-indigo-500/30 hover:border-indigo-500/60 text-gray-300 text-sm transition"
          >
            <Home size={16} />
            {isAdminRoute ? 'Admin Dashboard' : 'Go Home'}
          </Link>
        </div>

      </div>
    </div>
  );
}
