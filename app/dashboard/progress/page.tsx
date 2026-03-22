'use client';

import Link from 'next/link';
import Image from 'next/image';
import GlowCard from '@/components/AppShell/GlowCard';
import { useAuth } from '@/context/AuthContext';
import { TrendingUp, Clock, ChevronRight } from 'lucide-react';
import DashboardError from '@/components/ui/DashboardError';

export default function ProgressPage() {
  const { user, enrolledCourses, loadError } = useAuth();
  if (!user) return null;
  if (loadError) return <DashboardError />;

  const totalProgress = enrolledCourses.length
    ? Math.round(enrolledCourses.reduce((acc, c) => acc + c.progress, 0) / enrolledCourses.length)
    : 0;

  return (
    <div className="space-y-8">
      <GlowCard hero>
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-indigo-500/50 shrink-0">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.name} width={56} height={56} className="w-full h-full object-cover" />
            ) : user.avatar}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Progress Overview</h1>
            <p className="text-gray-300 text-sm mt-0.5">Track your learning journey across all courses</p>
          </div>
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Overall Progress</p>
              <p className="text-3xl font-bold text-white mt-1">{totalProgress}%</p>
            </div>
            <TrendingUp className="text-indigo-400/50 group-hover:text-indigo-400 transition" size={28} />
          </div>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-linear-to-r from-indigo-500 to-purple-500" style={{ width: `${totalProgress}%` }} />
          </div>
        </GlowCard>
        <GlowCard>
          <p className="text-gray-400 text-sm">In Progress</p>
          <p className="text-3xl font-bold text-white mt-1">
            {enrolledCourses.filter((c) => c.progress > 0 && c.progress < 100).length}
          </p>
        </GlowCard>
        <GlowCard>
          <p className="text-gray-400 text-sm">Completed</p>
          <p className="text-3xl font-bold text-white mt-1">
            {enrolledCourses.filter((c) => c.progress === 100).length}
          </p>
        </GlowCard>
      </div>

      <div>
        <h2 className="text-xl font-bold text-white mb-4">All Courses Progress</h2>
        <div className="space-y-3">
          {enrolledCourses.map((course) => (
            <Link key={course.slug} href={`/dashboard/progress/${course.slug}`}>
              <GlowCard className="group cursor-pointer hover:border-indigo-500/50 transition">
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-xl overflow-hidden shrink-0 bg-linear-to-br ${course.gradientFrom} ${course.gradientTo} relative`}>
                    <Image src={course.thumbnail} alt={course.title} fill sizes="64px" className="object-cover" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1.5">
                      <h3 className="font-bold text-white text-sm group-hover:text-indigo-300 transition truncate pr-2">{course.title}</h3>
                      <span className={`text-sm font-bold shrink-0 ${course.progress === 100 ? 'text-emerald-400' : 'text-indigo-400'}`}>{course.progress}%</span>
                    </div>
                    <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full ${course.progress === 100 ? 'bg-emerald-500' : 'bg-linear-to-r from-indigo-500 to-purple-500'}`}
                        style={{ width: `${course.progress}%` }}
                      />
                    </div>
                    <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1"><Clock size={11} />{course.duration}</span>
                      {course.progress === 100 && <span className="text-emerald-400 font-medium">✓ Completed</span>}
                      {course.progress > 0 && course.progress < 100 && <span className="text-indigo-400">In Progress</span>}
                      {course.progress === 0 && <span>Not started</span>}
                    </div>
                  </div>
                  <ChevronRight className="text-indigo-400/30 group-hover:text-indigo-400 group-hover:translate-x-1 transition shrink-0" size={18} />
                </div>
              </GlowCard>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
