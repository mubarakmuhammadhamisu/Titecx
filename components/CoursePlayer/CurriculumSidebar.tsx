'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Module } from '@/lib/Course';
import { ChevronDown, CheckCircle2, Circle, Video, BookOpen, Brain } from 'lucide-react';

interface CurriculumSidebarProps {
  modules: Module[];
  currentLessonId: string;
  courseSlug: string;
  completedLessonIds: Set<string>;  // passed from lesson page
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

  const completedInModule = (lessons: { id: string }[]) =>
    lessons.filter((l) => completedLessonIds.has(l.id)).length;

  return (
    <div className="bg-gray-900 rounded-xl border border-indigo-500/20 overflow-hidden flex flex-col h-full">
      <div className="px-4 py-3 border-b border-indigo-500/20 bg-gray-950">
        <h3 className="text-sm font-semibold text-white">Curriculum</h3>
        <p className="text-xs text-gray-500 mt-0.5">
          {completedLessonIds.size} of {modules.flatMap((m) => m.lessons).length} lessons done
        </p>
      </div>

      <div className="overflow-y-auto flex-1 space-y-1 p-2">
        {modules.map((module) => {
          const done = completedInModule(module.lessons);
          const total = module.lessons.length;
          return (
            <div key={module.id}>
              <button
                onClick={() => toggle(module.id)}
                className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg transition text-left group"
              >
                <ChevronDown size={16} className={`text-indigo-400 transition-transform ${expanded.has(module.id) ? '' : '-rotate-90'}`} />
                <span className="text-sm font-medium text-gray-200 group-hover:text-white transition flex-1">
                  {module.title}
                </span>
                <span className="text-xs text-gray-500">{done}/{total}</span>
              </button>

              {expanded.has(module.id) && (
                <div className="ml-6 space-y-1">
                  {module.lessons.map((lesson) => {
                    const isActive = lesson.id === currentLessonId;
                    const isDone = completedLessonIds.has(lesson.id);
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
                        {isDone
                          ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                          : <Circle size={15} className={`shrink-0 ${isActive ? 'text-indigo-400' : 'text-gray-600'}`} />
                        }
                        {lesson.type === 'video' && <Video size={13} className="text-indigo-400 shrink-0" />}
                        {lesson.type === 'reading' && <BookOpen size={13} className="text-purple-400 shrink-0" />}
                        {lesson.type === 'quiz' && <Brain size={13} className="text-pink-400 shrink-0" />}
                        <span className="flex-1 truncate">{lesson.title}</span>
                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 shrink-0" />}
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
