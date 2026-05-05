'use client';

import React, { useEffect } from 'react';
import AppShellSidebar from './AppShellSidebar';
import { useAuth } from '@/context/AuthContext';
import { AlertCircle, X } from 'lucide-react';

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export default function AppShellLayout({ children }: AppShellLayoutProps) {
  const { progressSaveError, clearProgressSaveError } = useAuth();

  // Clear the toast when the user navigates away to a new page
  useEffect(() => {
    return () => clearProgressSaveError();
  // clearProgressSaveError is a stable function reference — safe to omit from deps
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    // Outer shell caps width on ultra-wide displays and centers the whole UI
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-[1440px] mx-auto min-h-screen flex gap-4 p-4 md:p-6 lg:gap-6">
        <AppShellSidebar />
        {/* pr-12 on mobile only — clears the fixed hamburger button (top-5 right-5, ~44px wide).
            md:pr-0 resets it on desktop where the sidebar is inline and the button is gone. */}
        <main className="flex-1 overflow-y-auto min-w-0 pb-5 md:pb-0">
          {children}
        </main>
      </div>

      {/* ── Progress save error toast ───────────────────────────────────────
          Shown when markLessonComplete DB writes fail.
          Fixed bottom-right so it never obscures lesson content.
          Auto-dismissed after 5 s (managed by toastTimerRef in AuthContext).
          The timer is a single ref — completing multiple lessons quickly
          resets it each time rather than stacking multiple timers.        */}
      {progressSaveError && (
        <div
          role="alert"
          className="fixed bottom-6 right-6 z-50 flex items-start gap-3
                     px-4 py-3 rounded-xl max-w-sm
                     bg-gray-900 border border-red-500/40
                     shadow-2xl shadow-red-500/10 text-sm text-red-300
                     toast-animate"
        >
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <span className="flex-1 leading-snug">{progressSaveError}</span>
          <button
            onClick={clearProgressSaveError}
            className="text-gray-500 hover:text-gray-300 transition shrink-0 -mr-1"
            aria-label="Dismiss"
          >
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}
