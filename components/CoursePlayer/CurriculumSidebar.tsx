'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Module, Lesson } from '@/lib/Course';
import { ChevronDown, CheckCircle2, Circle, Video, BookOpen, Brain } from 'lucide-react';

interface CurriculumSidebarProps {
  modules: Module[];
  currentLessonId: string;
  courseSlug: string;
}

export default function CurriculumSidebar({
  modules,
  currentLessonId,
  courseSlug,
}: CurriculumSidebarProps) {
  const [expandedModules, setExpandedModules] = useState<Set<string>>(
    new Set(modules.map(m => m.id))
  );

  const toggleModule = (moduleId: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleId)) {
      newExpanded.delete(moduleId);
    } else {
      newExpanded.add(moduleId);
    }
    setExpandedModules(newExpanded);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'video':
        return <Video size={16} className="text-indigo-400" />;
      case 'reading':
        return <BookOpen size={16} className="text-purple-400" />;
      case 'quiz':
        return <Brain size={16} className="text-pink-400" />;
      default:
        return null;
    }
  };

  const getStatusIcon = (status: string) => {
    if (status === 'completed') {
      return <CheckCircle2 size={16} className="text-green-400" />;
    }
    return <Circle size={16} className="text-gray-500" />;
  };

  return (
    <div className="bg-gray-900 rounded-xl border border-indigo-500/20 overflow-hidden flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-indigo-500/20 bg-gray-950">
        <h3 className="text-sm font-semibold text-white">Curriculum</h3>
      </div>

      {/* Scrollable Content */}
      <div className="overflow-y-auto flex-1 space-y-1 p-2">
        {modules.map((module) => (
          <div key={module.id}>
            {/* Module Header */}
            <button
              onClick={() => toggleModule(module.id)}
              className="w-full flex items-center gap-2 px-3 py-2 hover:bg-gray-800 rounded-lg transition text-left group"
            >
              <ChevronDown
                size={16}
                className={`text-indigo-400 transition-transform ${
                  expandedModules.has(module.id) ? 'rotate-0' : '-rotate-90'
                }`}
              />
              <span className="text-sm font-medium text-gray-200 group-hover:text-white transition">
                {module.title}
              </span>
            </button>

            {/* Lessons */}
            {expandedModules.has(module.id) && (
              <div className="ml-6 space-y-1">
                {module.lessons.map((lesson) => {
                  const isActive = lesson.id === currentLessonId;
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
                      {getStatusIcon(lesson.status)}
                      {getTypeIcon(lesson.type)}
                      <span className="flex-1 truncate">{lesson.title}</span>
                      {isActive && (
                        <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      )}
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
