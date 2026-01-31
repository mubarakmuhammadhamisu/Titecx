import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { enrolledCourses } from "@/lib/data";
import { BookOpen, Clock, Star, Filter } from "lucide-react";

export default function MyCoursesPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <MyCoursesContent />
      <Footer />
    </main>
  );
}

function MyCoursesContent() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-16">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">My Courses</h1>
        <p className="text-gray-400">
          {enrolledCourses.length} course{enrolledCourses.length !== 1 ? "s" : ""} in progress
        </p>
      </div>

      {/* Filter & Sort Bar */}
      <div className="mb-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-2 text-gray-400">
          <Filter size={20} />
          <span className="text-sm">Sort by:</span>
          <select className="bg-gray-900 border border-white/10 rounded-lg px-4 py-2 text-white text-sm hover:border-indigo-500/40 transition">
            <option>Latest</option>
            <option>Progress</option>
            <option>Title</option>
            <option>Duration</option>
          </select>
        </div>
        <div className="text-sm text-gray-400">
          Showing {enrolledCourses.length} of {enrolledCourses.length} courses
        </div>
      </div>

      {/* Courses Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {enrolledCourses.map((course) => (
          <div
            key={course.id}
            className="group rounded-2xl bg-gray-900 border border-white/10 overflow-hidden hover:border-indigo-500/40 transition flex flex-col h-full"
          >
            {/* Course Image Placeholder */}
            <div className={`h-40 ${course.imageColor} relative flex items-center justify-center`}>
              <BookOpen size={48} className="text-white/20" />
            </div>

            {/* Course Content */}
            <div className="p-6 flex flex-col flex-1">
              <h3 className="text-lg font-semibold group-hover:text-indigo-400 transition mb-2 line-clamp-2">
                {course.title}
              </h3>

              <p className="text-sm text-gray-400 mb-4 flex-1">{course.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 text-xs text-gray-400 mb-4 pb-4 border-b border-white/5">
                <span className="flex items-center gap-1">
                  <Clock size={14} />
                  Next: {course.nextLesson}
                </span>
              </div>

              {/* Progress Section */}
              <div className="mb-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Progress</span>
                  <span className="text-sm font-bold text-indigo-400">{course.progress}%</span>
                </div>
                <div className="w-full bg-gray-800 rounded-full h-2 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 transition-all duration-500"
                    style={{ width: `${course.progress}%` }}
                  />
                </div>
              </div>

              {/* Buttons */}
              <div className="flex gap-2">
                <Link
                  href={`/courses/advanced-react-patterns`}
                  className="flex-1 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition text-center"
                >
                  Continue
                </Link>
                <Link
                  href={`/dashboard/progress/${course.id}`}
                  className="flex-1 px-4 py-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-white/10 text-white text-sm font-medium transition text-center"
                >
                  Details
                </Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State Example */}
      <div className="p-12 rounded-2xl bg-gray-900 border border-white/10 border-dashed text-center">
        <BookOpen size={48} className="mx-auto mb-4 text-gray-600" />
        <h3 className="text-xl font-bold mb-2">Want to explore more courses?</h3>
        <p className="text-gray-400 mb-6">
          Discover new courses and expand your skills
        </p>
        <Link
          href="/courses"
          className="inline-block px-8 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
        >
          Browse All Courses
        </Link>
      </div>

      {/* Navigation Back */}
      <div className="mt-8">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition"
        >
          ← Back to Dashboard
        </Link>
      </div>
    </div>
  );
}
