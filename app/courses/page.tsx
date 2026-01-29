import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { courses } from "@/lib/Course";

export default function CoursesPage() {
  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />

      {/* Header */}
      <section className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-4xl md:text-5xl font-extrabold">
          Explore Our <span className="text-indigo-400">Courses</span>
        </h1>
        <p className="mt-4 max-w-2xl mx-auto text-gray-400">
          Learn real-world skills with structured, high-quality courses.
        </p>
      </section>

      {/* Courses Grid */}
      <section className="max-w-7xl mx-auto px-4 pb-32">
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link
              key={course.slug}
              href={`/courses/${course.slug}`}
              className="group rounded-2xl bg-gray-900 border border-white/10 overflow-hidden hover:border-indigo-500/40 transition"
            >
              {/* Thumbnail */}
              <div className="h-44 bg-gradient-to-br from-indigo-500/20 to-purple-500/20" />

              {/* Content */}
              <div className="p-5">
                <h3 className="font-semibold text-lg group-hover:text-indigo-400 transition">
                  {course.title}
                </h3>

                <p className="mt-2 text-sm text-gray-400 line-clamp-2">
                  {course.shortDescription}
                </p>

                <div className="mt-4 flex items-center justify-between text-xs text-gray-400">
                  <span>{course.level}</span>
                  <span>{course.duration}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <Footer />
    </main>
  );
}
