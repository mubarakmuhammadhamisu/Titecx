'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Module, Lesson, LessonType } from '@/lib/Course';
import { ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';

interface LessonNavigationProps {
  modules: Module[];
  currentLessonId: string;
  courseSlug: string;
  lessonType: LessonType;
  onMarkComplete?: () => void;
  isCompleted?: boolean;
}

export default function LessonNavigation({
  modules,
  currentLessonId,
  courseSlug,
  lessonType,
  onMarkComplete,
  isCompleted = false,
}: LessonNavigationProps) {
  // Find current lesson and next/previous lessons
  let currentLesson: Lesson | null = null;
  let previousLesson: Lesson | null = null;
  let nextLesson: Lesson | null = null;
  let lessons: Lesson[] = [];

  // Flatten all lessons
  modules.forEach((mod) => {
    lessons = [...lessons, ...mod.lessons];
  });

  const currentIdx = lessons.findIndex((l) => l.id === currentLessonId);
  if (currentIdx !== -1) {
    currentLesson = lessons[currentIdx];
    previousLesson = currentIdx > 0 ? lessons[currentIdx - 1] : null;
    nextLesson = currentIdx < lessons.length - 1 ? lessons[currentIdx + 1] : null;
  }

  const canGoNext = lessonType === 'reading' ? isCompleted : true;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-indigo-500/20">
      {/* Previous Button */}
      {previousLesson ? (
        <Link
          href={`/dashboard/courses/${courseSlug}/view/${previousLesson.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition"
        >
          <ChevronLeft size={18} />
          <span className="text-sm font-medium">Previous</span>
        </Link>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-gray-600 rounded-lg cursor-not-allowed opacity-50">
          <ChevronLeft size={18} />
          <span className="text-sm font-medium">Previous</span>
        </div>
      )}

      {/* Mark as Complete Button (for reading) */}
      {lessonType === 'reading' && (
        <button
          onClick={onMarkComplete}
          disabled={isCompleted}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg transition font-medium text-sm ${
            isCompleted
              ? 'bg-green-500/20 text-green-400 border border-green-500/50 cursor-default'
              : 'bg-purple-600 hover:bg-purple-700 text-white border border-purple-700'
          }`}
        >
          <CheckCircle2 size={18} />
          <span>{isCompleted ? 'Completed' : 'Mark as Complete'}</span>
        </button>
      )}

      {/* Next Button */}
      {nextLesson && canGoNext ? (
        <Link
          href={`/dashboard/courses/${courseSlug}/view/${nextLesson.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition"
        >
          <span className="text-sm font-medium">Next</span>
          <ChevronRight size={18} />
        </Link>
      ) : (
        <div
          className={`flex items-center gap-2 px-4 py-2 rounded-lg transition cursor-not-allowed ${
            canGoNext
              ? 'bg-gray-900 text-gray-600 opacity-50'
              : 'bg-indigo-600/30 text-indigo-400/60 border border-indigo-500/30'
          }`}
        >
          <span className="text-sm font-medium">
            {lessonType === 'reading' && !isCompleted ? 'Complete to Continue' : 'Next'}
          </span>
          <ChevronRight size={18} />
        </div>
      )}
    </div>
  );
}
