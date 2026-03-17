// app/dashboard/loading.tsx
// Next.js automatically renders this while any dashboard page is loading.
// It matches the AppShell layout so there is no white flash between navigations.

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-6 animate-pulse">

      {/* Hero card skeleton */}
      <div className="rounded-3xl bg-gray-900 border border-indigo-500/10 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-800 rounded-lg w-48" />
            <div className="h-3 bg-gray-800 rounded-lg w-32" />
          </div>
        </div>
      </div>

      {/* Stats row skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-3xl bg-gray-900 border border-indigo-500/10 p-5">
            <div className="h-3 bg-gray-800 rounded w-16 mb-3" />
            <div className="h-8 bg-gray-800 rounded w-12" />
          </div>
        ))}
      </div>

      {/* Section heading */}
      <div className="h-5 bg-gray-800 rounded w-40" />

      {/* Course card grid skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-3xl bg-gray-900 border border-indigo-500/10 p-5 space-y-4">
            <div className="h-28 rounded-xl bg-gray-800" />
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
            <div className="h-2 bg-gray-800 rounded-full" />
          </div>
        ))}
      </div>

    </div>
  );
}
