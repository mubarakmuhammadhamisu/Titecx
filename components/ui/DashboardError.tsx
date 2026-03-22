// components/ui/DashboardError.tsx
//
// Shared error UI shown by all dashboard pages when loadError is true.
// Extracted to one place so the message and styling are consistent across
// my-courses, progress, achievements, and progress/[id].
//
// Usage:
//   const { loadError } = useAuth();
//   if (loadError) return <DashboardError />;

import { WifiOff, RefreshCw } from 'lucide-react';

export default function DashboardError() {
  return (
    <div className="w-full flex flex-col items-center justify-center min-h-[60vh]
                    gap-6 text-center px-4">
      <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20
                      flex items-center justify-center">
        <WifiOff size={28} className="text-red-400" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-white mb-2">
          Could not load your data
        </h2>
        <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
          There was a problem connecting to the server. Your data is safe —
          this is usually a temporary issue.
        </p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600
                   hover:bg-indigo-700 text-white font-semibold text-sm transition"
      >
        <RefreshCw size={16} />
        Reload Page
      </button>
    </div>
  );
}
