'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import GlowCard from '@/components/AppShell/GlowCard';
import { BookOpen, Play, ArrowRight, Lock } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default function CourseOverviewPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const { slug } = unwrappedParams;

  // completedLessonIds is required here — the old code used l.status === 'completed'
  // which read from the static DB field. That field is seeded as 'locked' for most
  // lessons and never updates. Real completion state lives in completedLessonIds.
  const { courses, completedLessonIds } = useAuth();

  const course = useMemo(() => {
    return courses.find((c) => c.slug === slug);
  }, [courses, slug]);

  if (!course) {
    return (
      <div className="w-full flex items-center justify-center py-12">
        <p className="text-gray-400">Course not found</p>
      </div>
    );
  }

  const totalLessons = course.modules.reduce(
    (sum, mod) => sum + mod.lessons.length,
    0
  );
  const firstLesson = course.modules[0]?.lessons[0];

  return (
    <div className="w-full space-y-8">
      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-4"
      >
        <h1 className="text-4xl font-bold text-white">{course.title}</h1>
        <p className="text-gray-300 text-lg">{course.description}</p>

        <div className="flex flex-wrap gap-4 pt-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
            <BookOpen size={18} className="text-indigo-400" />
            <span className="text-sm text-gray-200">{totalLessons} Lessons</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-purple-500/10 rounded-lg border border-purple-500/20">
            <span className="text-sm text-gray-200">Level: {course.level}</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-pink-500/10 rounded-lg border border-pink-500/20">
            <span className="text-sm text-gray-200">Duration: {course.duration}</span>
          </div>
        </div>
      </motion.div>

      {/* Modules — or Coming Soon */}
      {course.modules.length === 0 ? (
        <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <BookOpen size={28} className="text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Content Coming Soon</h2>
          <p className="text-gray-400 text-sm max-w-sm mx-auto leading-relaxed">
            We&apos;re preparing the lessons for this course. You&apos;re enrolled and will get
            instant access as soon as they&apos;re published.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-medium">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            In preparation
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {course.modules.map((mod, moduleIdx) => {
            // Use completedLessonIds (live DB state) — NOT mod.lessons[n].status
            // (which is a static field seeded once and never updated).
            const completedInModule = mod.lessons.filter(
              (l) => completedLessonIds.has(l.id)
            ).length;
            const progressPercent =
              mod.lessons.length > 0
                ? Math.round((completedInModule / mod.lessons.length) * 100)
                : 0;

            return (
              <motion.div
                key={mod.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: moduleIdx * 0.1 }}
              >
                <GlowCard className="space-y-4">
                  {/* Module header */}
                  <div className="flex items-center justify-between pb-4 border-b border-indigo-500/20">
                    <div>
                      <h2 className="text-2xl font-bold text-white">{mod.title}</h2>
                      <p className="text-gray-400 text-sm mt-1">{mod.lessons.length} lessons</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-indigo-400">{progressPercent}%</div>
                      <p className="text-xs text-gray-400">Complete</p>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-linear-to-r from-indigo-500 to-purple-500 transition-all duration-300"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>

                  {/* Lessons */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                    {mod.lessons.map((lesson, lessonIdx) => {
                      const isCompleted = completedLessonIds.has(lesson.id);
                      // A lesson is "current" if it's the first one not yet completed.
                      // We determine this from the first unfinished lesson in the module.
                      const firstUnfinishedIdx = mod.lessons.findIndex(
                        (l) => !completedLessonIds.has(l.id)
                      );
                      const isCurrent =
                        !isCompleted && lessonIdx === firstUnfinishedIdx;
                      const isLocked =
                        !isCompleted && !isCurrent && lessonIdx > firstUnfinishedIdx;

                      return (
                        <motion.div
                          key={lesson.id}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{
                            duration: 0.2,
                            delay: moduleIdx * 0.1 + lessonIdx * 0.05,
                          }}
                        >
                          {isLocked ? (
                            <div className="flex items-center gap-3 p-3 bg-gray-800/50 border border-gray-700/50 rounded-lg opacity-50 cursor-not-allowed">
                              <Lock size={16} className="text-gray-500" />
                              <p className="text-gray-400 text-sm truncate">{lesson.title}</p>
                            </div>
                          ) : (
                            <Link
                              href={`/dashboard/courses/${slug}/view/${lesson.id}`}
                              className={`flex items-center gap-3 p-3 rounded-lg border transition group cursor-pointer ${
                                isCurrent
                                  ? 'bg-indigo-500/20 border-indigo-500/50 hover:border-indigo-500/70'
                                  : isCompleted
                                  ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50'
                                  : 'bg-gray-800/50 border-gray-700/50 hover:border-indigo-500/30'
                              }`}
                            >
                              <div className="shrink-0">
                                {lesson.type === 'video' ? (
                                  <Play
                                    size={16}
                                    className={
                                      isCurrent
                                        ? 'text-indigo-400'
                                        : isCompleted
                                        ? 'text-green-400'
                                        : 'text-gray-500 group-hover:text-indigo-400'
                                    }
                                  />
                                ) : (
                                  <BookOpen
                                    size={16}
                                    className={
                                      isCurrent
                                        ? 'text-indigo-400'
                                        : isCompleted
                                        ? 'text-green-400'
                                        : 'text-gray-500 group-hover:text-indigo-400'
                                    }
                                  />
                                )}
                              </div>
                              <p
                                className={`text-sm truncate flex-1 min-w-0 ${
                                  isCurrent
                                    ? 'text-indigo-200 font-medium'
                                    : isCompleted
                                    ? 'text-green-200'
                                    : 'text-gray-300 group-hover:text-gray-100'
                                }`}
                              >
                                {lesson.title}
                              </p>
                              <ArrowRight
                                size={16}
                                className="shrink-0 text-gray-600 group-hover:text-indigo-400 transition opacity-0 group-hover:opacity-100"
                              />
                            </Link>
                          )}
                        </motion.div>
                      );
                    })}
                  </div>
                </GlowCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* CTA */}
      {firstLesson && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.3 }}
          className="pt-4"
        >
          <Link
            href={`/dashboard/courses/${slug}/view/${firstLesson.id}`}
            className="inline-flex items-center gap-2 px-8 py-3 bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold rounded-lg transition shadow-lg shadow-indigo-500/20"
          >
            <Play size={18} />
            Start Learning
          </Link>
        </motion.div>
      )}
    </div>
  );
}
