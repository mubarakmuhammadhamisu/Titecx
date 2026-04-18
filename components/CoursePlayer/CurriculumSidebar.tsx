'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Module } from '@/lib/Course';
import { ChevronDown, CheckCircle2, Circle, Video, BookOpen, Brain, Lock } from 'lucide-react';

interface CurriculumSidebarProps {
  modules: Module[];
  currentLessonId: string;
  courseSlug: string;
  completedLessonIds: Set<string>;
}

export default function CurriculumSidebar({
  modules, currentLessonId, courseSlug, completedLessonIds,
}: CurriculumSidebarProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set(modules.map((m) => m.id)));

  const toggle = (id: string) => {
    const s = new Set(expanded);
    s.has(id) ? s.delete(id) : s.add(id);
    setExpanded(s);
  };

  const allLessonIdsInCourse = new Set(
    modules.flatMap((m) => m.lessons.map((l) => l.id))
  );

  const completedInThisCourse = [...completedLessonIds].filter((id) =>
    allLessonIdsInCourse.has(id)
  ).length;
  const totalInThisCourse = allLessonIdsInCourse.size;

  const completedInModule = (lessons: { id: string }[]) =>
    lessons.filter((l) => completedLessonIds.has(l.id)).length;

  // ── Locking rules ────────────────────────────────────────────────────────
  // Module gate: a module (index > 0) is entirely locked until the final
  // lesson (the quiz) of the preceding module has been completed.
  const isModuleLocked = (moduleIdx: number): boolean => {
    if (moduleIdx === 0) return false;
    const prev = modules[moduleIdx - 1];
    if (!prev || prev.lessons.length === 0) return false;
    const lastLesson = prev.lessons[prev.lessons.length - 1];
    return !completedLessonIds.has(lastLesson.id);
  };

  // Lesson gate: once a module is unlocked, lessons inside it are sequentially
  // locked — each requires the lesson immediately before it to be completed.
  // Task 2: the currently active lesson is NEVER locked even if its predecessor
  // is not yet marked complete (handles optimistic UI lag).
  const isLocked = (lessonId: string, isActive: boolean): boolean => {
    if (isActive) return false; // active lesson is always accessible
    for (let mi = 0; mi < modules.length; mi++) {
      const li = modules[mi].lessons.findIndex((l) => l.id === lessonId);
      if (li === -1) continue;
      if (isModuleLocked(mi)) return true;   // entire module is gated
      if (li === 0) return false;             // first lesson of unlocked module
      return !completedLessonIds.has(modules[mi].lessons[li - 1].id);
    }
    return false;
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-indigo-500/20 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-indigo-500/20 bg-gray-950">
        <h3 className="text-sm font-semibold text-white">Curriculum</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {completedInThisCourse} of {totalInThisCourse} lessons done
        </p>
      </div>

      <div className="overflow-y-auto flex-1 space-y-1 p-2">
        {modules.map((module, moduleIdx) => {
          const done  = completedInModule(module.lessons);
          const total = module.lessons.length;
          const moduleLocked = isModuleLocked(moduleIdx);
          return (
            <div key={module.id}>
              <button
                onClick={() => toggle(module.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg transition text-left group"
              >
                <ChevronDown
                  size={16}
                  className={`transition-transform ${moduleLocked ? 'text-gray-600' : 'text-indigo-400'} ${expanded.has(module.id) ? '' : '-rotate-90'}`}
                />
                <span className={`text-sm font-medium transition flex-1 ${moduleLocked ? 'text-gray-600' : 'text-gray-200 group-hover:text-white'}`}>
                  {module.title}
                </span>
                {moduleLocked
                  ? <Lock size={12} className="text-gray-600 shrink-0" />
                  : <span className="text-xs text-gray-500">{done}/{total}</span>
                }
              </button>

      {expanded.has(module.id) && (
                <div className="ml-6 space-y-1">
                  {module.lessons.map((lesson) => {
                    const isActive = lesson.id === currentLessonId;
                    const isDone   = completedLessonIds.has(lesson.id);
                    const locked   = isLocked(lesson.id, isActive);

                    const sharedInner = (
                      <>
                        {isDone
                          ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                          : locked
                          ? <Lock size={15} className="text-gray-600 shrink-0" />
                          : <Circle size={15} className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-600'}`} />
                        }
                        {lesson.type === 'video'   && <Video    size={13} className={`shrink-0 ${locked ? 'text-gray-600' : 'text-indigo-400'}`} />}
                        {lesson.type === 'reading' && <BookOpen size={13} className={`shrink-0 ${locked ? 'text-gray-600' : 'text-purple-400'}`} />}
                        {lesson.type === 'quiz'    && <Brain    size={13} className={`shrink-0 ${locked ? 'text-gray-600' : 'text-pink-400'}`}   />}
                        <span className="flex-1 truncate">{lesson.title}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
                      </>
                    );

                    if (locked) {
                      return (
                        <div
                          key={lesson.id}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm text-gray-600 cursor-not-allowed opacity-60"
                        >
                          {sharedInner}
                        </div>
                      );
                    }

                    return (
                      <Link
                        key={lesson.id}
                        href={`/dashboard/courses/${courseSlug}/view/${lesson.id}`}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg transition text-sm group ${
                          isActive
                            ? 'bg-indigo-500/20 border border-indigo-500/50 text-indigo-200'
                            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
                        }`}
                      >
                        {sharedInner}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
