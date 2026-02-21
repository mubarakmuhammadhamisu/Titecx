'use client';

import React, { useState, useMemo } from 'react';
import { courseSchemas } from '@/lib/Course';
import VideoPlayer from '@/components/CoursePlayer/VideoPlayer';
import Reader from '@/components/CoursePlayer/Reader';
import CurriculumSidebar from '@/components/CoursePlayer/CurriculumSidebar';
import LessonNavigation from '@/components/CoursePlayer/LessonNavigation';
import { motion } from 'framer-motion';

interface PageProps {
  params: Promise<{
    slug: string;
    lessonId: string;
  }>;
}

export default function CourseLessonPage({ params }: PageProps) {
  const unwrappedParams = React.use(params);
  const { slug, lessonId } = unwrappedParams;

  // Find course and lesson
  const course = useMemo(() => {
    return courseSchemas.find((c) => c.slug === slug);
  }, [slug]);

  const lesson = useMemo(() => {
    if (!course) return null;
    for (const module of course.modules) {
      const found = module.lessons.find((l) => l.id === lessonId);
      if (found) return found;
    }
    return null;
  }, [course, lessonId]);

  // Local state for completion (in production, this would sync with backend)
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const isCurrentLessonCompleted = completedLessons.has(lessonId);

  const handleMarkComplete = () => {
    setCompletedLessons((prev) => new Set(prev).add(lessonId));
  };

  if (!course) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-400">Course not found</p>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="w-full h-screen flex items-center justify-center">
        <p className="text-gray-400">Lesson not found</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      {/* Course Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="space-y-2"
      >
        <h1 className="text-3xl font-bold text-white">{course.title}</h1>
        <p className="text-gray-400">{lesson.title}</p>
      </motion.div>

      {/* Main Content - Cinema Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side - Content (2 columns on desktop) */}
        <div className="lg:col-span-2 space-y-6">
          <motion.div
            key={lessonId}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            {/* Render based on lesson type */}
            {lesson.type === 'video' && (
              <VideoPlayer
                content={lesson.content as any}
                title={lesson.title}
              />
            )}

            {lesson.type === 'reading' && (
              <Reader
                content={lesson.content as any}
                title={lesson.title}
              />
            )}
          </motion.div>

          {/* Navigation Buttons */}
          <LessonNavigation
            modules={course.modules}
            currentLessonId={lessonId}
            courseSlug={slug}
            lessonType={lesson.type}
            onMarkComplete={handleMarkComplete}
            isCompleted={isCurrentLessonCompleted}
          />
        </div>

        {/* Right Side - Curriculum Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="lg:col-span-1"
        >
          <CurriculumSidebar
            modules={course.modules}
            currentLessonId={lessonId}
            courseSlug={slug}
          />
        </motion.div>
      </div>
    </div>
  );
}
