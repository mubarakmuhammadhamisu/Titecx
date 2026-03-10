"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import GlowCard from "@/components/AppShell/GlowCard";
import { useAuth } from "@/context/AuthContext";
import { courseSchemas } from "@/lib/Course";
import {
  CheckCircle2,
  Circle,
  BookOpen,
  Brain,
  Award,
  Clock,
  Play,
} from "lucide-react";

export default function ProgressTrackerPage({
  params,
}: {
  params: { id: string };
}) {
  const unwrapped = React.use(params as any) as { id: string };
  const { user, enrolledCourses } = useAuth();
  if (!user) return null;

  const enrolledCourse = enrolledCourses.find(
    (c) => String(c.id) === unwrapped.id,
  );
  const schema = enrolledCourse
    ? courseSchemas.find((c) => c.slug === enrolledCourse.slug)
    : null;

  if (!enrolledCourse || !schema) {
    return (
      <div className="flex items-center justify-center py-24 flex-col gap-4">
        <p className="text-gray-400 text-lg">Course not found</p>
        <Link
          href="/dashboard/progress"
          className="text-indigo-400 hover:text-indigo-300 text-sm transition"
        >
          ← Back to Progress
        </Link>
      </div>
    );
  }

  const modules = schema.modules.length
    ? schema.modules.map((mod) => ({
        id: mod.id,
        name: mod.title,
        lessons: mod.lessons.map((l) => ({
          name: l.title,
          completed: l.status === "completed",
          id: l.id,
        })),
        completed: mod.lessons.every((l) => l.status === "completed"),
      }))
    : schema.curriculum.map((item, idx) => ({
        id: String(idx),
        name: item,
        lessons: [
          {
            name: item,
            completed: enrolledCourse.progress === 100,
            id: String(idx),
          },
        ],
        completed: enrolledCourse.progress === 100,
      }));

  const completedModules = modules.filter((m) => m.completed).length;

  return (
    <div className="space-y-6">
      <GlowCard hero>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br ${enrolledCourse.gradientFrom} ${enrolledCourse.gradientTo} relative`}
            >
              <Image
                src={enrolledCourse.thumbnail}
                alt={enrolledCourse.title}
                fill
                className="object-cover"
              />
            </div>
            <div>
              <h1 className="text-xl font-bold text-white leading-tight">
                {enrolledCourse.title}
              </h1>
              <p className="text-gray-300 text-sm mt-0.5">
                by {enrolledCourse.instructor}
              </p>
            </div>
          </div>
          <Link href="/dashboard/progress">
            <button className="px-4 py-2 rounded-lg bg-gray-900/60 border border-indigo-500/30 hover:border-indigo-500/60 text-white text-sm transition whitespace-nowrap">
              ← Back
            </button>
          </Link>
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Overall Progress</p>
              <p className="text-3xl font-bold text-white mt-1">
                {enrolledCourse.progress}%
              </p>
            </div>
            <div className="relative w-16 h-16">
              <svg
                className="w-full h-full transform -rotate-90"
                viewBox="0 0 64 64"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="text-gray-800"
                />
                <circle
                  cx="32"
                  cy="32"
                  r="27"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${170 * (enrolledCourse.progress / 100)} 170`}
                  className={
                    enrolledCourse.progress === 100
                      ? "text-emerald-500"
                      : "text-indigo-500"
                  }
                  strokeLinecap="round"
                />
              </svg>
            </div>
          </div>
        </GlowCard>
        <GlowCard>
          <p className="text-gray-400 text-sm mb-1">Duration</p>
          <p className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock size={18} className="text-purple-400" />
            {enrolledCourse.duration}
          </p>
          <p className="text-gray-500 text-xs mt-2">Total course length</p>
        </GlowCard>
        <GlowCard>
          <p className="text-gray-400 text-sm mb-1">Modules</p>
          <p className="text-2xl font-bold text-white">
            {completedModules} / {modules.length}
          </p>
          <div className="mt-2 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-500"
              style={{
                width: modules.length
                  ? `${(completedModules / modules.length) * 100}%`
                  : "0%",
              }}
            />
          </div>
        </GlowCard>
      </div>

      {enrolledCourse.nextLessonId && enrolledCourse.progress < 100 && (
        <Link
          href={`/dashboard/courses/${enrolledCourse.slug}/view/${enrolledCourse.nextLessonId}`}
        >
          <GlowCard className="flex items-center justify-between group cursor-pointer hover:border-indigo-500/50 transition">
            <div>
              <p className="text-xs text-indigo-400 font-medium mb-0.5">
                Continue where you left off
              </p>
              <p className="text-white font-semibold">Resume Course</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center group-hover:bg-indigo-500 transition">
              <Play size={16} className="text-white ml-0.5" />
            </div>
          </GlowCard>
        </Link>
      )}

      {modules.length > 0 && (
        <div>
          <h2 className="text-xl font-bold text-white mb-4">
            Course Curriculum
          </h2>
          <div className="space-y-3">
            {modules.map((module) => (
              <GlowCard key={module.id}>
                <div className="flex items-start gap-4">
                  {module.completed ? (
                    <CheckCircle2
                      className="text-emerald-500 flex-shrink-0 mt-0.5"
                      size={22}
                    />
                  ) : (
                    <Circle
                      className="text-gray-600 flex-shrink-0 mt-0.5"
                      size={22}
                    />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm">
                      {module.name}
                    </h3>
                    {module.lessons.length > 1 && (
                      <div className="mt-3 space-y-2">
                        {module.lessons.map((lesson, idx) => (
                          <div
                            key={idx}
                            className="flex items-center gap-2 text-xs"
                          >
                            {lesson.completed ? (
                              <CheckCircle2
                                className="text-emerald-500/60"
                                size={14}
                              />
                            ) : (
                              <Circle className="text-gray-600" size={14} />
                            )}
                            <span
                              className={
                                lesson.completed
                                  ? "text-gray-400 line-through"
                                  : "text-gray-300"
                              }
                            >
                              {lesson.name}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  {!module.completed && (
                    <Link href={`/dashboard/courses/${enrolledCourse.slug}`}>
                      <button className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition whitespace-nowrap">
                        Resume
                      </button>
                    </Link>
                  )}
                </div>
              </GlowCard>
            ))}
          </div>
        </div>
      )}

      <div>
        <h2 className="text-xl font-bold text-white mb-4">
          Resources & Support
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            {
              Icon: BookOpen,
              label: "Study Materials",
              sub: `${schema.curriculum.length * 2} resources`,
              hover: "hover:border-indigo-500/50",
            },
            {
              Icon: Brain,
              label: "Practice Quizzes",
              sub: `${schema.modules.length || 3} quizzes`,
              hover: "hover:border-purple-500/50",
            },
            {
              Icon: Award,
              label: "Certificate",
              sub:
                enrolledCourse.progress === 100
                  ? "Ready to download"
                  : "Earn on completion",
              hover: "hover:border-indigo-500/50",
            },
          ].map(({ Icon, label, sub, hover }) => (
            <GlowCard
              key={label}
              className={`group cursor-pointer ${hover} transition`}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className="text-indigo-400/60 group-hover:text-indigo-400 transition"
                  size={22}
                />
                <div>
                  <h3 className="font-bold text-white text-sm">{label}</h3>
                  <p className="text-gray-400 text-xs">{sub}</p>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </div>
    </div>
  );
}
