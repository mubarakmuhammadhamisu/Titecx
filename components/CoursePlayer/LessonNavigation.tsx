'use client';

import React from 'react';
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
  modules, currentLessonId, courseSlug, lessonType, onMarkComplete, isCompleted = false,
}: LessonNavigationProps) {
  const lessons: Lesson[] = modules.flatMap((m) => m.lessons);
  const idx = lessons.findIndex((l) => l.id === currentLessonId);
  const prev = idx > 0 ? lessons[idx - 1] : null;
  const next = idx < lessons.length - 1 ? lessons[idx + 1] : null;

  // Video → auto-completes on end, allow Next immediately.
  // Reading + Quiz → must be completed before Next is enabled.
  const requiresCompletion = lessonType === 'reading' || lessonType === 'quiz';
  const canGoNext = requiresCompletion ? isCompleted : true;

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 mt-8 pt-6 border-t border-indigo-500/20">
      {prev ? (
        <Link href={`/dashboard/courses/${courseSlug}/view/${prev.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-gray-100 rounded-lg transition">
          <ChevronLeft size={18} /><span className="text-sm font-medium">Previous</span>
        </Link>
      ) : (
        <div className="flex items-center gap-2 px-4 py-2 bg-gray-900 text-gray-600 rounded-lg opacity-50 cursor-not-allowed">
          <ChevronLeft size={18} /><span className="text-sm font-medium">Previous</span>
        </div>
      )}

      {/* Reading lessons only: show "Mark as Complete" button.
          Quiz lessons complete themselves via QuizPlayer's onQuizComplete callback.
          Video lessons complete on video end. */}
      {lessonType === 'reading' && (
        <button onClick={onMarkComplete} disabled={isCompleted}
          className={`flex items-center gap-2 px-6 py-2 rounded-lg transition font-medium text-sm ${
            isCompleted
              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/50 cursor-default'
              : 'bg-purple-600 hover:bg-purple-700 text-white'
          }`}>
          <CheckCircle2 size={18} />
          <span>{isCompleted ? 'Completed ✓' : 'Mark as Complete'}</span>
        </button>
      )}

      {next && canGoNext ? (
        <Link href={`/dashboard/courses/${courseSlug}/view/${next.id}`}
          className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition">
          <span className="text-sm font-medium">Next</span><ChevronRight size={18} />
        </Link>
      ) : (
        <div className={`flex items-center gap-2 px-4 py-2 rounded-lg cursor-not-allowed ${
          canGoNext ? 'bg-gray-900 text-gray-600 opacity-50' : 'bg-indigo-600/30 text-indigo-400/60 border border-indigo-500/30'
        }`}>
          <span className="text-sm font-medium">
            {requiresCompletion && !isCompleted
              ? lessonType === 'quiz'
                ? 'Complete quiz to continue'
                : 'Complete to Continue'
              : next ? 'Next' : 'Course Complete 🎉'}
          </span>
          <ChevronRight size={18} />
        </div>
      )}
    </div>
  );
}
