'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import DashboardError from '@/components/ui/DashboardError';
import GlowCard from '@/components/AppShell/GlowCard';
import { BookOpen, Clock, Users, ChevronRight, Play, Search, AlertCircle, Award, Package, Trophy } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

type Filter = 'all' | 'in-progress' | 'completed';
const ITEMS_PER_PAGE = 6;

// Human-readable messages for each paystack_error code set by /api/paystack/callback
const PAYSTACK_ERROR_MESSAGES: Record<string, string> = {
  no_reference:          'Payment reference was missing. Please try again.',
  server_error:          'A server error occurred during payment processing. Please contact support.',
  verify_failed:         'We could not verify your payment with Paystack. If money was deducted, contact support.',
  payment_not_successful:'Your payment did not complete successfully. No money was charged.',
  missing_data:          'Payment data was incomplete. Please try enrolling again.',
  enrollment_failed:     'Your payment was received but enrollment failed. Please contact support with your payment reference.',
};

// Returns days remaining until a deadline ISO string, or null if no deadline
function daysRemaining(deadline: string | null | undefined): number | null {
  if (!deadline) return null;
  const diff = new Date(deadline).getTime() - Date.now();
  if (diff <= 0) return 0;
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export default function MyCoursesPage() {
  const { user, enrolledCourses, courses, loadError, isLoading } = useAuth();
  const [filter, setFilter] = useState<Filter>('all');
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  // Read paystack_error from URL without useSearchParams (avoids Suspense requirement)
  const [paystackError, setPaystackError] = useState<string | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('paystack_error');
    if (code) {
      setPaystackError(PAYSTACK_ERROR_MESSAGES[code] ?? 'A payment error occurred. Please contact support.');
      // Remove the query param from the URL so it doesn't persist on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('paystack_error');
      window.history.replaceState({}, '', url.toString());
    }
  }, []);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  if (!user) return null;
  if (loadError) return <DashboardError />;

  // Enrolled courses filtered
  const filteredEnrolled = enrolledCourses.filter((c) => {
    const matchFilter =
      filter === 'all' ||
      (filter === 'in-progress' && c.progress < 100) ||
      (filter === 'completed' && c.progress === 100);
    const matchSearch = c.title.toLowerCase().includes(search.toLowerCase());
    return matchFilter && matchSearch;
  });

  const paginated = filteredEnrolled.slice(0, page * ITEMS_PER_PAGE);
  const hasMore = paginated.length < filteredEnrolled.length;

  // Available courses = full catalogue minus what user is enrolled in
  const enrolledSlugs = new Set(enrolledCourses.map((c) => c.slug));
  const availableCourses = courses.filter((c) => !enrolledSlugs.has(c.slug));

  const filters: { label: string; value: Filter }[] = [
    { label: 'All', value: 'all' },
    { label: 'In Progress', value: 'in-progress' },
    { label: 'Completed', value: 'completed' },
  ];

  return (
    <div className="space-y-10">
      {/* Paystack error banner — shown when callback route redirects with an error code */}
      {paystackError && (
        <div className="flex items-start gap-3 px-4 py-3 rounded-xl bg-red-500/10
                        border border-red-500/30 text-red-300 text-sm">
          <AlertCircle size={16} className="text-red-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-red-200 mb-0.5">Payment issue</p>
            <p>{paystackError}</p>
          </div>
          <button
            onClick={() => setPaystackError(null)}
            className="text-red-400/60 hover:text-red-300 transition text-lg leading-none shrink-0"
            aria-label="Dismiss"
          >
            ×
          </button>
        </div>
      )}
      {/* Hero */}
      <GlowCard hero>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/50 shrink-0">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.name} width={56} height={56} className="w-full h-full object-cover" />
            ) : user.avatar}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">My Courses</h1>
            <p className="text-gray-300 text-sm mt-0.5">
              {enrolledCourses.length} enrolled · {enrolledCourses.filter((c) => c.progress === 100).length} completed
            </p>
          </div>
        </div>
      </GlowCard>

      {/* ── SECTION 1: Enrolled ── */}
      <section>
        <h2 className="text-xl font-bold text-white mb-4">My Enrolled Courses</h2>
        <div className="flex flex-col sm:flex-row gap-3 mb-5">
          <div className="relative flex-1">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search your courses..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2.5 rounded-lg bg-gray-900 border border-indigo-500/20 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/50 transition"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {filters.map(({ label, value }) => (
              <button
                key={value}
                onClick={() => { setFilter(value); setPage(1); }}
                className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition border ${
                  filter === value
                    ? 'bg-indigo-600 border-indigo-500 text-white'
                    : 'bg-gray-900 border-indigo-500/20 text-gray-400 hover:text-white hover:border-indigo-500/40'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {filteredEnrolled.length === 0 ? (
          <GlowCard className="text-center py-14">
            <BookOpen className="mx-auto mb-4 text-gray-600" size={44} />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No courses found</h3>
            <p className="text-gray-500 text-sm">
              {search ? 'Try a different search term.' : 'Browse the catalogue below to enroll.'}
            </p>
          </GlowCard>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginated.map((course) => (
                <Link
                  key={course.slug}
                  href={
                    course.nextLessonId
                      ? `/dashboard/courses/${course.slug}/view/${course.nextLessonId}`
                      : `/dashboard/courses/${course.slug}`
                  }
                >
                  <GlowCard className="h-full group cursor-pointer hover:border-purple-500/50 transition">
                    <div className={`h-36 rounded-xl overflow-hidden mb-4 bg-linear-to-br ${course.gradientFrom} ${course.gradientTo} relative`}>
                      <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 768px) calc(100vw - 3rem), (max-width: 1280px) calc(50vw - 3rem), 33vw" className="object-cover" />
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
                        <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                          <Play size={18} className="text-white ml-0.5" />
                        </div>
                      </div>
                      {course.progress === 100 && (
                        <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">✓ Completed</div>
                      )}
                      {/* Premium badge on thumbnail */}
                      {course.purchaseType === 'premium' && course.progress < 100 && (
                        <div className="absolute top-2 left-2 bg-gradient-to-r from-pink-500 to-fuchsia-500 text-white text-xs font-bold px-2 py-0.5 rounded-full shadow-md">
                          🎁 Premium
                        </div>
                      )}
                    </div>
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-2">
                        <h3 className="font-bold text-white group-hover:text-indigo-300 transition text-sm leading-snug">{course.title}</h3>
                        <p className="text-gray-400 text-xs mt-0.5">{course.instructor}</p>
                      </div>
                      <ChevronRight className="text-indigo-400/30 group-hover:text-indigo-400 group-hover:translate-x-1 transition shrink-0" size={18} />
                    </div>
                    <div className="flex gap-3 mb-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1"><Clock size={12} className="text-indigo-400/60" />{course.duration}</span>
                      {course.students > 0 ? (
                        <span className="flex items-center gap-1"><Users size={12} className="text-purple-400/60" />{course.students.toLocaleString()} students</span>
                      ) : (
                        <span className="px-1.5 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400 text-xs font-medium">Early Access</span>
                      )}
                    </div>

                    {/* Premium countdown timer */}
                    {course.purchaseType === 'premium' && course.progress < 100 && course.mysteryBoxStatus === 'pending' && (() => {
                      const days = daysRemaining(course.premiumDeadline);
                      if (days === null) return null;
                      const urgent = days <= 7;
                      return (
                        <div className={`flex items-center gap-2 px-3 py-2 rounded-lg mb-3 text-xs font-medium ${
                          urgent
                            ? 'bg-red-500/10 border border-red-500/20 text-red-300'
                            : 'bg-pink-500/10 border border-pink-500/20 text-pink-300'
                        }`}>
                          <Clock size={12} className={urgent ? 'text-red-400' : 'text-pink-400'} />
                          {days === 0
                            ? '⚠️ Deadline passed — mystery box forfeited'
                            : `${days} day${days === 1 ? '' : 's'} left to earn mystery box`}
                        </div>
                      );
                    })()}

                    {/* Mystery box status banners */}
                    {course.mysteryBoxStatus === 'earned' && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-medium">
                        <Package size={12} className="text-emerald-400" />
                        🎉 Mystery box earned! Check your email.
                      </div>
                    )}
                    {course.mysteryBoxStatus === 'forfeited' && (
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg mb-3 bg-gray-700/40 border border-gray-600/40 text-gray-400 text-xs">
                        <Package size={12} />
                        Mystery box deadline passed
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-gray-400">Progress</span>
                        <span className={`font-semibold ${course.progress === 100 ? 'text-emerald-400' : course.purchaseType === 'premium' ? 'text-pink-400' : 'text-indigo-400'}`}>{course.progress}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            course.progress === 100
                              ? 'bg-emerald-500'
                              : course.purchaseType === 'premium'
                              ? 'bg-gradient-to-r from-pink-500 to-fuchsia-500'
                              : 'bg-linear-to-r from-indigo-500 to-purple-500'
                          }`}
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>
                  </GlowCard>
                </Link>
              ))}
            </div>
            {hasMore && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => setPage((p) => p + 1)}
                  className="px-8 py-2.5 rounded-xl bg-gray-900 border border-indigo-500/30 hover:border-indigo-500/60 text-white text-sm font-medium transition"
                >
                  Load More ({filteredEnrolled.length - paginated.length} remaining)
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ── SECTION 2: Available to Enroll ── */}
      {availableCourses.length > 0 && (
        <section>
          <div className="mb-4">
            <h2 className="text-xl font-bold text-white">Available Courses</h2>
            <p className="text-gray-400 text-sm mt-0.5">Courses you haven&apos;t enrolled in yet</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableCourses.map((course) => (
              <Link key={course.slug} href={`/courses/${course.slug}`}>
                <GlowCard className="h-full group cursor-pointer hover:border-indigo-500/40 transition">
                  <div className={`h-36 rounded-xl overflow-hidden mb-4 bg-linear-to-br ${course.gradientFrom} ${course.gradientTo} relative`}>
                    <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 768px) calc(100vw - 3rem), (max-width: 1280px) calc(50vw - 3rem), 33vw" className="object-cover" />
                    <div className="absolute top-2 left-2 bg-gray-900/70 backdrop-blur text-xs text-gray-200 px-2 py-0.5 rounded-full border border-white/10">{course.level}</div>
                  </div>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex-1 min-w-0 pr-2">
                      <h3 className="font-bold text-white group-hover:text-indigo-300 transition text-sm leading-snug">{course.title}</h3>
                      <p className="text-gray-400 text-xs mt-0.5 line-clamp-2">{course.shortDescription}</p>
                    </div>
                    <ChevronRight className="text-indigo-400/30 group-hover:text-indigo-400 group-hover:translate-x-1 transition shrink-0 mt-0.5" size={18} />
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-indigo-500/10">
                    <span className="text-xs text-gray-400 flex items-center gap-1"><Clock size={12} />{course.duration}</span>
                    <span className="text-sm font-bold text-indigo-400">{course.price}</span>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
