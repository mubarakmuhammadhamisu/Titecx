import Link from "next/link";
import { currentUser, enrolledCourses } from "@/lib/data";
import { courses } from "@/lib/Course";
import { Award, BookOpen, Clock, TrendingUp } from "lucide-react";

export default function DashboardPage() {
  return <DashboardContent />;
}

function DashboardContent() {
  return (
    <div className="max-w-6xl mx-auto">
      {/* Welcome Section */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Welcome back, {currentUser.name}!</h1>
            <p className="text-gray-400">
              {currentUser.role} • Continue your learning journey
            </p>
          </div>
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-2xl font-bold">
            {currentUser.avatar}
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid md:grid-cols-4 gap-4 mb-12">
        {currentUser.stats.map((stat) => (
          <div
            key={stat.label}
            className="p-6 rounded-2xl bg-gray-900 border border-white/10 hover:border-indigo-500/40 transition"
          >
            <p className="text-gray-400 text-sm mb-2">{stat.label}</p>
            <p className="text-3xl font-bold text-indigo-400">{stat.val}</p>
          </div>
        ))}
      </div>

      {/* Active Courses & Recommendations */}
      <div className="grid lg:grid-cols-3 gap-8 mb-12">
        {/* Active Courses Section */}
        <div className="lg:col-span-2">
          <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BookOpen size={28} className="text-indigo-400" />
              Your Active Courses
            </h2>
          </div>
          <div className="space-y-4">
            {enrolledCourses.map((course) => (
              <div
                key={course.id}
                className="p-6 rounded-2xl bg-gray-900 border border-white/10 hover:border-indigo-500/40 transition group cursor-pointer"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold group-hover:text-indigo-400 transition mb-1">
                      {course.title}
                    </h3>
                    <p className="text-sm text-gray-400 mb-3">{course.description}</p>
                    <div className="flex items-center gap-2 text-sm text-gray-300 mb-4">
                      <Clock size={16} />
                      <span>Next lesson: {course.nextLesson}</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-indigo-400">{course.progress}%</p>
                    <p className="text-xs text-gray-400">Complete</p>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>

                {/* Continue Button */}
                <Link
                  href={`/courses/advanced-react-patterns`}
                  className="inline-block mt-4 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
                >
                  Continue Learning
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Recommended Courses Sidebar */}
        <div>
          <div className="mb-6">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <TrendingUp size={28} className="text-purple-400" />
              Recommended for You
            </h2>
          </div>
          <div className="space-y-4">
            {courses.slice(0, 3).map((course) => (
              <Link
                key={course.id}
                href={`/courses/${course.slug}`}
                className="p-4 rounded-xl bg-gray-900 border border-white/10 hover:border-purple-500/40 transition group block"
              >
                <h3 className="font-semibold text-sm group-hover:text-purple-400 transition line-clamp-2">
                  {course.title}
                </h3>
                <p className="text-xs text-gray-500 mt-1">{course.level}</p>
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-gray-400">{course.duration}</span>
                  <span className="text-indigo-400 font-medium">{course.price}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="p-8 rounded-2xl bg-gradient-to-r from-indigo-600/20 to-purple-600/20 border border-indigo-500/20">
        <h2 className="text-xl font-bold mb-4">Quick Navigation</h2>
        <div className="grid sm:grid-cols-2 gap-4">
          <Link
            href="/dashboard/my-courses"
            className="p-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/10 transition text-center font-medium"
          >
            View My Courses
          </Link>
          <Link
            href="/dashboard/achievements"
            className="p-4 rounded-xl bg-gray-900 hover:bg-gray-800 border border-white/10 transition text-center font-medium flex items-center justify-center gap-2"
          >
            <Award size={18} />
            Achievements
          </Link>
        </div>
      </div>
    </div>
  );
}
