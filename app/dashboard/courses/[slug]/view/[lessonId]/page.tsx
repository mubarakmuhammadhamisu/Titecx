'use client';

import React, { useMemo, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import VideoPlayer from '@/components/CoursePlayer/VideoPlayer';
import Reader from '@/components/CoursePlayer/Reader';
import QuizPlayer from '@/components/CoursePlayer/QuizPlayer';
import CurriculumSidebar from '@/components/CoursePlayer/CurriculumSidebar';
import LessonNavigation from '@/components/CoursePlayer/LessonNavigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';
import type { Module } from '@/lib/Course';

interface PageProps { params: Promise<{ slug: string; lessonId: string }> }

// ── Locking helpers — identical logic to CurriculumSidebar and CourseOverview ─
// Defined at module level (outside the component) so they are pure functions
// with no hook dependencies and can be called anywhere during render.

function isModuleLocked(
  modules: Module[],
  moduleIdx: number,
  completedLessonIds: Set<string>,
): boolean {
  if (moduleIdx === 0) return false;
  const prev = modules[moduleIdx - 1];
  if (!prev || prev.lessons.length === 0) return false;
  return !completedLessonIds.has(prev.lessons[prev.lessons.length - 1].id);
}

function isLessonLocked(
  modules: Module[],
  moduleIdx: number,
  lessonIdx: number,
  completedLessonIds: Set<string>,
): boolean {
  if (isModuleLocked(modules, moduleIdx, completedLessonIds)) return true;
  if (lessonIdx === 0) return false;
  return !completedLessonIds.has(modules[moduleIdx].lessons[lessonIdx - 1].id);
}

export default function CourseLessonPage({ params }: PageProps) {
  const { slug, lessonId } = React.use(params);
  const router = useRouter();
  const {
    completedLessonIds,
    markLessonComplete,
    courses,
    enrolledCourses,
    isEnrolled,
    isLoading,
  } = useAuth();

  const course = useMemo(() => courses.find((c) => c.slug === slug), [courses, slug]);

  const lesson = useMemo(() => {
    if (!course) return null;
    for (const mod of course.modules) {
      const found = mod.lessons.find((l) => l.id === lessonId);
      if (found) return found;
    }
    return null;
  }, [course, lessonId]);

  const isCompleted = completedLessonIds.has(lessonId);

  const handleComplete = useCallback(() => {
    if (!isCompleted && course) markLessonComplete(course.slug, lessonId);
  }, [isCompleted, course, lessonId, markLessonComplete]);

  // ── Quiz-gate: find module + lesson indices for the requested lesson ────────
  const { reqModuleIdx, reqLessonIdx } = useMemo(() => {
    if (!course) return { reqModuleIdx: -1, reqLessonIdx: -1 };
    for (let mi = 0; mi < course.modules.length; mi++) {
      const li = course.modules[mi].lessons.findIndex((l) => l.id === lessonId);
      if (li !== -1) return { reqModuleIdx: mi, reqLessonIdx: li };
    }
    return { reqModuleIdx: -1, reqLessonIdx: -1 };
  }, [course, lessonId]);

  // Is the requested lesson locked according to the quiz-gate rules?
  const requestedLessonIsLocked = useMemo(() => {
    if (!course || reqModuleIdx < 0) return false;
    return isLessonLocked(course.modules, reqModuleIdx, reqLessonIdx, completedLessonIds);
  }, [course, reqModuleIdx, reqLessonIdx, completedLessonIds]);

  // Safe redirect target when the requested lesson is locked:
  // Use enrolledCourse.nextLessonId (the first uncompleted unlocked lesson as
  // tracked by the server) and fall back to lesson 1 for brand-new enrollees.
  const enrolledCourse = useMemo(
    () => enrolledCourses.find((c) => c.slug === slug),
    [enrolledCourses, slug],
  );
  const safeRedirectId = useMemo(
    () => enrolledCourse?.nextLessonId ?? course?.modules[0]?.lessons[0]?.id,
    [enrolledCourse, course],
  );

  // ── Security redirect — must be declared unconditionally (hooks rules) ──────
  // Fires when auth has loaded, the lesson is locked, and the redirect target
  // is a different lesson from the one being requested.
  useEffect(() => {
    if (
      !isLoading &&
      requestedLessonIsLocked &&
      safeRedirectId &&
      safeRedirectId !== lessonId
    ) {
      router.replace(`/dashboard/courses/${slug}/view/${safeRedirectId}`);
    }
  }, [isLoading, requestedLessonIsLocked, safeRedirectId, lessonId, router, slug]);

  // ── Guards — in correct order after all hooks ─────────────────────────────

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
    </div>
  );

  if (!course) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-400">Course not found</p>
    </div>
  );

  if (!lesson) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-gray-400">Lesson not found</p>
    </div>
  );

  // Enrollment gate — courses[] contains ALL published courses, so we must
  // verify the user is actually enrolled before serving content.
  if (!isEnrolled(slug)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-2">
          <Lock size={28} className="text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white">You are not enrolled in this course</h2>
        <p className="text-gray-400 text-sm max-w-xs">
          Purchase or enrol to unlock all lessons and track your progress.
        </p>
        <Link
          href={`/dashboard/checkout/${slug}`}
          className="mt-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
        >
          Enrol Now
        </Link>
      </div>
    );
  }

  // Lock gate — show spinner while the useEffect redirect fires.
  // This prevents locked content from briefly flashing before the navigation.
  if (requestedLessonIsLocked) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 rounded-full border-2 border-indigo-500 border-t-transparent animate-spin" />
      </div>
    );
  }

  // ── Normal render ─────────────────────────────────────────────────────────
  return (
    <div className="w-full space-y-6">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="space-y-1">
        <h1 className="text-2xl font-bold text-white">{course.title}</h1>
        <p className="text-gray-400 text-sm">{lesson.title}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <motion.div key={lessonId} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            {lesson.type === 'video' && (
              <VideoPlayer
                content={lesson.content as any}
                title={lesson.title}
                isCompleted={isCompleted}
                onVideoEnd={handleComplete}
              />
            )}
            {lesson.type === 'reading' && (
              <Reader content={lesson.content as any} title={lesson.title} />
            )}
            {lesson.type === 'quiz' && (
              <QuizPlayer
                content={lesson.content as any}
                title={lesson.title}
                isCompleted={isCompleted}
                onQuizComplete={handleComplete}
              />
            )}
          </motion.div>

          <LessonNavigation
            modules={course.modules}
            currentLessonId={lessonId}
            courseSlug={slug}
            lessonType={lesson.type}
            onMarkComplete={handleComplete}
            isCompleted={isCompleted}
          />
        </div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}>
          <CurriculumSidebar
            modules={course.modules}
            currentLessonId={lessonId}
            courseSlug={slug}
            completedLessonIds={completedLessonIds}
          />
        </motion.div>
      </div>
    </div>
  );
}
