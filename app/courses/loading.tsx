// app/courses/loading.tsx
//
// Next.js renders this automatically while courses/page.tsx is fetching.
// Without it, the page shows a blank white screen for the full duration
// of the Supabase query (typically 200–600 ms, longer on cold starts).
//
// Skeleton structure mirrors the real page layout so the transition
// from loading → content feels smooth rather than jarring.

export default function CoursesLoading() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">

      {/* Header skeleton — mirrors the hero section */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="animate-pulse space-y-4 flex flex-col items-center">
          <div className="h-12 bg-gray-800 rounded-xl w-72" />
          <div className="h-4 bg-gray-800 rounded-lg w-96 max-w-full" />
        </div>
      </section>

      {/* Card grid skeleton — 6 cards matching the real grid */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 animate-pulse">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="rounded-2xl bg-gray-900 border border-white/10 overflow-hidden"
            >
              {/* Thumbnail placeholder */}
              <div className="h-44 bg-gray-800" />
              {/* Text placeholders */}
              <div className="p-5 space-y-3">
                <div className="h-5 bg-gray-800 rounded-lg w-3/4" />
                <div className="h-3 bg-gray-800 rounded w-full" />
                <div className="h-3 bg-gray-800 rounded w-2/3" />
                <div className="flex justify-between pt-1">
                  <div className="h-3 bg-gray-800 rounded w-20" />
                  <div className="h-3 bg-gray-800 rounded w-12" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
