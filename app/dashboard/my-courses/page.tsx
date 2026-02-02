'use client';

import GlowCard from '@/components/AppShell/GlowCard';
import { BookOpen, Clock, Users, ChevronRight } from 'lucide-react';
import Link from 'next/link';

export default function MyCoursesPage() {
  const courses = [
    { id: 1, title: 'Advanced Python Programming', instructor: 'John Doe', progress: 75, duration: '24h', students: 1250 },
    { id: 2, title: 'Machine Learning Fundamentals', instructor: 'Jane Smith', progress: 45, duration: '32h', students: 890 },
    { id: 3, title: 'Web Development with React', instructor: 'Mike Johnson', progress: 60, duration: '28h', students: 2100 },
    { id: 4, title: 'Data Science Masterclass', instructor: 'Sarah Lee', progress: 30, duration: '40h', students: 650 },
    { id: 5, title: 'Cloud Computing with AWS', instructor: 'David Brown', progress: 85, duration: '20h', students: 1450 },
    { id: 6, title: 'Mobile App Development', instructor: 'Lisa Wong', progress: 55, duration: '36h', students: 920 },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <GlowCard hero>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/50">
              M
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">My Courses</h1>
              <p className="text-gray-300 text-sm">You are enrolled in {courses.length} courses</p>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Filter Bar */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {['All', 'In Progress', 'Completed', 'Archived'].map((filter) => (
          <button
            key={filter}
            className="px-4 py-2 rounded-lg whitespace-nowrap bg-gray-900 border border-indigo-500/30 hover:border-indigo-500/60 text-gray-300 hover:text-white transition text-sm font-medium"
          >
            {filter}
          </button>
        ))}
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {courses.map((course) => (
          <Link key={course.id} href={`/dashboard/progress/${course.id}`}>
            <GlowCard className="h-full group cursor-pointer hover:border-purple-500/50 transition">
              {/* Course Header */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-white group-hover:text-indigo-300 transition">{course.title}</h3>
                  <p className="text-gray-400 text-sm mt-1">{course.instructor}</p>
                </div>
                <ChevronRight className="text-indigo-400/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition mt-1 flex-shrink-0" size={20} />
              </div>

              {/* Course Meta */}
              <div className="flex gap-4 mb-4 text-xs text-gray-400">
                <div className="flex items-center gap-1">
                  <Clock size={14} className="text-indigo-400/60" />
                  {course.duration}
                </div>
                <div className="flex items-center gap-1">
                  <Users size={14} className="text-purple-400/60" />
                  {course.students}
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-indigo-400 font-medium">{course.progress}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/50 transition-all duration-300"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Status Badge */}
              <div className="mt-4 pt-4 border-t border-indigo-500/10">
                <span className={`text-xs font-medium px-2 py-1 rounded-full ${
                  course.progress === 100
                    ? 'bg-green-500/20 text-green-400'
                    : course.progress >= 50
                    ? 'bg-indigo-500/20 text-indigo-400'
                    : 'bg-purple-500/20 text-purple-400'
                }`}>
                  {course.progress === 100 ? 'Completed' : 'In Progress'}
                </span>
              </div>
            </GlowCard>
          </Link>
        ))}
      </div>
    </div>
  );
}
