'use client';

import Link from 'next/link';
import Image from 'next/image';
// Image is used for course thumbnails and optionally for the user avatar
import GlowCard from '@/components/AppShell/GlowCard';
import { BookOpen, Award, Clock, TrendingUp, ChevronRight, Play, RefreshCw, WifiOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function DashboardPage() {
  const { user, enrolledCourses, loadError } = useAuth();
  if (!user) return null;

  // ── Data load failed — show a friendly error instead of misleading zeros ──
  if (loadError) {
    return (
      <div className="w-full flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <WifiOff size={28} className="text-red-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Could not load your dashboard</h2>
          <p className="text-gray-400 text-sm max-w-xs mx-auto leading-relaxed">
            There was a problem connecting to the server. Your data is safe — this is usually a temporary issue.
          </p>
        </div>
        <button
          onClick={() => window.location.reload()}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
        >
          <RefreshCw size={16} />
          Reload Page
        </button>
      </div>
    );
  }

  const activeCourses = enrolledCourses.filter((c) => c.progress < 100).slice(0, 4);
  const completedCourses = enrolledCourses.filter((c) => c.progress === 100).slice(0, 3);

  const totalHours = enrolledCourses.reduce((acc, c) => {
    // Robust parser: handles "6h", "6.5h", "6 hours", "1 hour", etc.
    // Extracts the first numeric value from the string — returns 0 on no match.
    const match = c.duration.match(/(\d+(?:\.\d+)?)/);
    const h = match ? parseFloat(match[1]) : 0;
    return acc + Math.round((c.progress / 100) * h * 10) / 10;
  }, 0);

  const completed = enrolledCourses.filter((c) => c.progress === 100).length;
  const completionRate = enrolledCourses.length
    ? Math.round(enrolledCourses.reduce((a, c) => a + c.progress, 0) / enrolledCourses.length)
    : 0;

  return (
    <div className="w-full space-y-8">
      {/* Hero */}
      <GlowCard hero>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/50 shrink-0">
            {user.avatarUrl ? (
              <Image
                src={user.avatarUrl}
                alt={user.name}
                width={64}
                height={64}
                className="w-full h-full object-cover"
              />
            ) : (
              user.avatar
            )}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Welcome back, {user.name.split(' ')[0]} 👋</h1>
            <p className="text-gray-300 text-sm mt-0.5">{user.role} · Ready to continue learning?</p>
          </div>
        </div>
      </GlowCard>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Enrolled', value: enrolledCourses.length, Icon: BookOpen, color: 'text-indigo-400' },
          { label: 'Hours Learned', value: `${totalHours}h`, Icon: Clock, color: 'text-purple-400' },
          { label: 'Completed', value: completed, Icon: Award, color: 'text-indigo-400' },
          { label: 'Avg Progress', value: `${completionRate}%`, Icon: TrendingUp, color: 'text-purple-400' },
        ].map(({ label, value, Icon, color }) => (
          <GlowCard key={label} className="group">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-400 text-xs font-medium">{label}</p>
                <p className="text-3xl font-bold text-white mt-1">{value}</p>
              </div>
              <Icon className={`${color}/50 group-hover:${color} transition`} size={28} />
            </div>
          </GlowCard>
        ))}
      </div>

      {/* Active Courses */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-white">Active Courses</h2>
          <Link href="/dashboard/my-courses" className="text-sm text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
            View all <ChevronRight size={16} />
          </Link>
        </div>

        {activeCourses.length === 0 ? (
          <GlowCard className="text-center py-12">
            <BookOpen className="mx-auto mb-4 text-gray-600" size={48} />
            <h3 className="text-lg font-semibold text-gray-300 mb-2">No active courses yet</h3>
            <p className="text-gray-500 text-sm mb-6">Browse our catalogue and start learning today.</p>
            <Link
              href="/dashboard/my-courses"
              className="inline-flex items-center gap-2 px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold rounded-xl transition"
            >
              Browse Courses
            </Link>
          </GlowCard>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {activeCourses.map((course) => (
              <Link
                key={course.id}
                href={
                  course.nextLessonId
                    ? `/dashboard/courses/${course.slug}/view/${course.nextLessonId}`
                    : `/dashboard/courses/${course.slug}`
                }
              >
                <GlowCard className="group cursor-pointer hover:border-indigo-500/50 transition h-full">
                  <div className={`h-28 rounded-xl overflow-hidden mb-4 bg-linear-to-br ${course.gradientFrom} ${course.gradientTo} relative`}>
                    <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 768px) calc(100vw - 3rem), 50vw" className="object-cover opacity-80" />
                    <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition bg-black/20">
                      <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur flex items-center justify-center">
                        <Play size={18} className="text-white ml-0.5" />
                      </div>
                    </div>
                  </div>
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="text-base font-bold text-white group-hover:text-indigo-300 transition leading-tight">{course.title}</h3>
                      <p className="text-gray-400 text-xs mt-0.5">{course.instructor}</p>
                    </div>
                    <ChevronRight className="text-indigo-400/30 group-hover:text-indigo-400 group-hover:translate-x-1 transition shrink-0" size={18} />
                  </div>
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-400">Progress</span>
                      <span className="text-indigo-400 font-semibold">{course.progress}%</span>
                    </div>
                    <div className="h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div className="h-full bg-linear-to-r from-indigo-500 to-purple-500" style={{ width: `${course.progress}%` }} />
                    </div>
                  </div>
                </GlowCard>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Completed */}
      {completedCourses.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-white">Completed Courses</h2>
            <Link href="/dashboard/my-courses" className="text-sm text-indigo-400 hover:text-indigo-300 transition flex items-center gap-1">
              View all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {completedCourses.map((course) => (
              <Link key={course.id} href={`/dashboard/courses/${course.slug}`}>
                <GlowCard className="group cursor-pointer hover:border-emerald-500/40 transition">
                  <div className={`h-24 rounded-xl overflow-hidden mb-3 bg-linear-to-br ${course.gradientFrom} ${course.gradientTo} relative`}>
                    <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 768px) calc(100vw - 3rem), 33vw" className="object-cover opacity-70" />
                    <div className="absolute top-2 right-2 bg-emerald-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">✓ Done</div>
                  </div>
                  <h3 className="text-sm font-bold text-white group-hover:text-emerald-300 transition">{course.title}</h3>
                  <div className="mt-2 h-1.5 bg-emerald-500/30 rounded-full overflow-hidden">
                    <div className="h-full w-full bg-emerald-500" />
                  </div>
                </GlowCard>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
