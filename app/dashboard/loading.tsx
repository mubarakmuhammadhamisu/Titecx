// app/dashboard/loading.tsx
// Next.js renders this automatically while any /dashboard page is loading.
// Matches the real dashboard layout: hero card → 4 stat cards → course cards.
// Uses animate-pulse so it feels alive rather than frozen.

export default function DashboardLoading() {
  return (
    <div className="w-full space-y-8 animate-pulse">

      {/* Hero card — mirrors the GlowCard hero with avatar + name */}
      <div className="rounded-2xl bg-gray-900 border border-indigo-500/10 p-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gray-800 shrink-0" />
          <div className="space-y-2 flex-1">
            <div className="h-5 bg-gray-800 rounded-lg w-48" />
            <div className="h-3 bg-gray-800 rounded-lg w-32" />
          </div>
        </div>
      </div>

      {/* 4 stat cards — matches the Courses / Hours / Completed / Rate grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900 border border-indigo-500/10 p-5 space-y-3">
            <div className="h-3 bg-gray-800 rounded w-20" />
            <div className="h-8 bg-gray-800 rounded w-10" />
          </div>
        ))}
      </div>

      {/* Section heading — "Continue Learning" */}
      <div className="h-5 bg-gray-800 rounded w-44" />

      {/* Active course cards — matches the md:grid-cols-2 layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900 border border-indigo-500/10 p-5 space-y-4">
            {/* Thumbnail placeholder */}
            <div className="h-28 rounded-xl bg-gray-800" />
            {/* Title + instructor */}
            <div className="space-y-2">
              <div className="h-4 bg-gray-800 rounded w-3/4" />
              <div className="h-3 bg-gray-800 rounded w-1/2" />
            </div>
            {/* Progress bar */}
            <div className="h-2 bg-gray-800 rounded-full" />
            {/* Button */}
            <div className="h-9 bg-gray-800 rounded-xl w-36" />
          </div>
        ))}
      </div>

      {/* Section heading — "Completed" */}
      <div className="h-5 bg-gray-800 rounded w-32" />

      {/* Completed course rows — compact list style */}
      <div className="space-y-3">
        {[1, 2].map((i) => (
          <div key={i} className="rounded-2xl bg-gray-900 border border-indigo-500/10 p-4 flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-gray-800 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-800 rounded w-2/3" />
              <div className="h-3 bg-gray-800 rounded w-1/3" />
            </div>
            <div className="h-7 bg-gray-800 rounded-lg w-24 shrink-0" />
          </div>
        ))}
      </div>

    </div>
  );
}
