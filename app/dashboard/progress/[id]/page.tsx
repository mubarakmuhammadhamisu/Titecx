import Link from "next/link";
import Navbar from "@/components/ui/Navbar";
import Footer from "@/components/ui/Footer";
import { enrolledCourses } from "@/lib/data";
import { 
  CheckCircle2, 
  Circle, 
  Clock, 
  Award, 
  BookOpen,
  ChevronRight 
} from "lucide-react";

export default function ProgressTrackerPage({ 
  params 
}: { 
  params: { id: number } 
}) {
  const course = enrolledCourses[0]; // Default to first course for demo

  return (
    <main className="min-h-screen bg-gray-950 text-gray-100">
      <Navbar />
      <ProgressTrackerContent course={course} />
      <Footer />
    </main>
  );
}

function ProgressTrackerContent({ course }: { course: any }) {
  const lessons = [
    {
      id: 1,
      title: "Getting Started",
      duration: "25 min",
      completed: true,
      quiz: { completed: true, score: 95 },
    },
    {
      id: 2,
      title: "Core Concepts",
      duration: "45 min",
      completed: true,
      quiz: { completed: true, score: 88 },
    },
    {
      id: 3,
      title: "Advanced Patterns",
      duration: "60 min",
      completed: true,
      quiz: { completed: false, score: 0 },
    },
    {
      id: 4,
      title: "State Management",
      duration: "50 min",
      completed: false,
      quiz: { completed: false, score: 0 },
    },
    {
      id: 5,
      title: "Performance Tips",
      duration: "40 min",
      completed: false,
      quiz: { completed: false, score: 0 },
    },
    {
      id: 6,
      title: "Final Project",
      duration: "90 min",
      completed: false,
      quiz: { completed: false, score: 0 },
    },
  ];

  const completedLessons = lessons.filter((l) => l.completed).length;
  const completedQuizzes = lessons.filter((l) => l.quiz.completed).length;
  const averageScore =
    completedQuizzes > 0
      ? Math.round(
          lessons.reduce((sum, l) => sum + l.quiz.score, 0) / completedQuizzes
        )
      : 0;

  return (
    <div className="max-w-6xl mx-auto px-4 py-16">
      {/* Page Header */}
      <div className="mb-12">
        <h1 className="text-4xl font-bold mb-2">{course.title}</h1>
        <p className="text-gray-400">Track your progress through the course</p>
      </div>

      {/* Progress Overview */}
      <div className="grid md:grid-cols-4 gap-4 mb-12">
        <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
          <p className="text-gray-400 text-sm mb-2">Course Progress</p>
          <p className="text-3xl font-bold text-indigo-400">{course.progress}%</p>
        </div>
        <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
          <p className="text-gray-400 text-sm mb-2">Lessons Complete</p>
          <p className="text-3xl font-bold text-purple-400">
            {completedLessons}/{lessons.length}
          </p>
        </div>
        <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
          <p className="text-gray-400 text-sm mb-2">Quizzes Completed</p>
          <p className="text-3xl font-bold text-blue-400">{completedQuizzes}</p>
        </div>
        <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
          <p className="text-gray-400 text-sm mb-2">Average Score</p>
          <p className="text-3xl font-bold text-green-400">{averageScore}%</p>
        </div>
      </div>

      {/* Overall Progress Bar */}
      <div className="mb-12 p-6 rounded-2xl bg-gray-900 border border-white/10">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">Overall Progress</h2>
          <span className="text-2xl font-bold text-indigo-400">{course.progress}%</span>
        </div>
        <div className="w-full h-4 bg-gray-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-700"
            style={{ width: `${course.progress}%` }}
          />
        </div>
      </div>

      {/* Lessons Timeline */}
      <div className="mb-12">
        <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
          <BookOpen size={28} className="text-indigo-400" />
          Course Curriculum
        </h2>

        <div className="space-y-3">
          {lessons.map((lesson, index) => (
            <div
              key={lesson.id}
              className={`p-6 rounded-xl border transition group cursor-pointer ${
                lesson.completed
                  ? "bg-gray-900 border-green-500/20 hover:border-green-500/40"
                  : index === completedLessons
                  ? "bg-gray-900 border-indigo-500/40 hover:border-indigo-500/60"
                  : "bg-gray-900 border-white/5 hover:border-white/10"
              }`}
            >
              <div className="flex items-start gap-4">
                {/* Lesson Status Icon */}
                <div className="mt-1">
                  {lesson.completed ? (
                    <CheckCircle2 size={24} className="text-green-400" />
                  ) : index === completedLessons ? (
                    <div className="w-6 h-6 rounded-full border-2 border-indigo-400 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-indigo-400" />
                    </div>
                  ) : (
                    <Circle size={24} className="text-gray-600" />
                  )}
                </div>

                {/* Lesson Info */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div>
                      <h3 className="font-semibold text-lg group-hover:text-indigo-400 transition">
                        Lesson {index + 1}: {lesson.title}
                      </h3>
                      <p className="text-sm text-gray-400 mt-1 flex items-center gap-1">
                        <Clock size={14} />
                        {lesson.duration}
                      </p>
                    </div>
                    <ChevronRight
                      size={20}
                      className="text-gray-600 group-hover:text-gray-400 transition"
                    />
                  </div>

                  {/* Quiz Info */}
                  {lesson.completed && (
                    <div className="mt-3 p-3 rounded-lg bg-gray-800 border border-white/5">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400 flex items-center gap-2">
                          <Award size={14} className="text-yellow-400" />
                          Quiz Score
                        </span>
                        {lesson.quiz.completed ? (
                          <span className="font-bold text-green-400">
                            {lesson.quiz.score}%
                          </span>
                        ) : (
                          <span className="text-gray-500">Not attempted</span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid md:grid-cols-2 gap-8 mb-12">
        {/* Performance */}
        <div className="p-6 rounded-2xl bg-gray-900 border border-white/10">
          <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
            <Award size={24} className="text-yellow-400" />
            Your Performance
          </h3>
          <div className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Completion Rate</span>
                <span className="font-bold">{completedLessons} of {lessons.length}</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-green-500"
                  style={{ width: `${(completedLessons / lessons.length) * 100}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-gray-400">Average Quiz Score</span>
                <span className="font-bold text-blue-400">{averageScore}%</span>
              </div>
              <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500"
                  style={{ width: `${averageScore}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Next Steps */}
        <div className="p-6 rounded-2xl bg-gray-900 border border-indigo-500/20">
          <h3 className="text-xl font-bold mb-6">What's Next?</h3>
          {completedLessons < lessons.length ? (
            <div>
              <p className="text-gray-400 mb-4">
                Continue with the next lesson to maintain your progress
              </p>
              <button className="w-full px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition">
                Continue Learning →
              </button>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-gray-300 mb-4 font-semibold">
                Congratulations! You've completed all lessons.
              </p>
              <p className="text-gray-400 mb-4">
                Take the final assessment to earn your certificate
              </p>
              <button className="w-full px-6 py-3 rounded-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-medium transition">
                Take Final Assessment
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/my-courses"
          className="inline-flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition"
        >
          ← Back to My Courses
        </Link>
      </div>
    </div>
  );
}
