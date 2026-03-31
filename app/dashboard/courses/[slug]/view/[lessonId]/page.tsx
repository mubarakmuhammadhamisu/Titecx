'use client';

import React, { useMemo } from 'react';
import Link from 'next/link';
import VideoPlayer from '@/components/CoursePlayer/VideoPlayer';
import Reader from '@/components/CoursePlayer/Reader';
import CurriculumSidebar from '@/components/CoursePlayer/CurriculumSidebar';
import LessonNavigation from '@/components/CoursePlayer/LessonNavigation';
import { useAuth } from '@/context/AuthContext';
import { motion } from 'framer-motion';
import { Lock } from 'lucide-react';

interface PageProps { params: Promise<{ slug: string; lessonId: string }> }

export default function CourseLessonPage({ params }: PageProps) {
  const { slug, lessonId } = React.use(params);
  const { completedLessonIds, markLessonComplete, courses, isEnrolled } = useAuth();

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

  const handleComplete = () => {
    if (!isCompleted && course) markLessonComplete(course.slug, lessonId);
  };

  if (!course) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Course not found</p></div>;
  if (!lesson) return <div className="flex items-center justify-center min-h-[60vh]"><p className="text-gray-400">Lesson not found</p></div>;

  // ── Enrollment gate — must come after course/lesson are resolved ──────────
  // courses[] in AuthContext contains ALL published courses, not just enrolled
  // ones. Without this check any logged-in user can watch paid content for free
  // by navigating directly to a lesson URL.
  if (!isEnrolled(slug)) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4 text-center px-4">
        <div className="w-16 h-16 rounded-full bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center mb-2">
          <Lock size={28} className="text-indigo-400" />
        </div>
        <h2 className="text-xl font-bold text-white">You are not enrolled in this course</h2>
        <p className="text-gray-400 text-sm max-w-xs">Purchase or enrol to unlock all lessons and track your progress.</p>
        <Link
          href={`/dashboard/checkout/${slug}`}
          className="mt-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-sm transition"
        >
          Enrol Now
        </Link>
      </div>
    );
  }

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
