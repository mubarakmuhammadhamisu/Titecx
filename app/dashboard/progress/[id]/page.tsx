'use client';

import GlowCard from '@/components/AppShell/GlowCard';
import { CheckCircle2, Circle, BookOpen, Quiz, Award } from 'lucide-react';
import Link from 'next/link';

export default function ProgressTrackerPage({ params }: { params: { id: string } }) {
  const course = {
    id: params.id,
    title: 'Advanced Python Programming',
    instructor: 'John Doe',
    progress: 75,
    duration: '24h / 32h completed',
  };

  const modules = [
    {
      id: 1,
      name: 'Python Basics & Setup',
      lessons: [
        { name: 'Introduction', completed: true },
        { name: 'Environment Setup', completed: true },
        { name: 'Variables & Data Types', completed: true },
      ],
      completed: true,
    },
    {
      id: 2,
      name: 'Control Flow & Functions',
      lessons: [
        { name: 'If-Else Statements', completed: true },
        { name: 'Loops', completed: true },
        { name: 'Functions & Scope', completed: false },
        { name: 'Decorators', completed: false },
      ],
      completed: false,
    },
    {
      id: 3,
      name: 'Object-Oriented Programming',
      lessons: [
        { name: 'Classes & Objects', completed: false },
        { name: 'Inheritance', completed: false },
        { name: 'Polymorphism', completed: false },
      ],
      completed: false,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Hero Card */}
      <GlowCard hero>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/50">
              M
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">{course.title}</h1>
              <p className="text-gray-300 text-sm">by {course.instructor}</p>
            </div>
          </div>
          <Link href="/dashboard/my-courses">
            <button className="px-4 py-2 rounded-lg bg-gray-900 border border-indigo-500/30 hover:border-indigo-500/60 text-white transition">
              ← Back
            </button>
          </Link>
        </div>
      </GlowCard>

      {/* Progress Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Overall Progress</p>
              <p className="text-3xl font-bold text-white mt-2">{course.progress}%</p>
            </div>
            <div className="relative w-20 h-20">
              <svg className="w-full h-full transform -rotate-90" viewBox="0 0 80 80">
                <circle cx="40" cy="40" r="35" fill="none" stroke="currentColor" strokeWidth="4" className="text-gray-800" />
                <circle
                  cx="40"
                  cy="40"
                  r="35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="4"
                  strokeDasharray={`${220 * (course.progress / 100)} 220`}
                  className="text-indigo-500"
                />
              </svg>
            </div>
          </div>
        </GlowCard>

        <GlowCard>
          <p className="text-gray-400 text-sm mb-2">Time Spent</p>
          <p className="text-3xl font-bold text-white">{course.duration}</p>
          <p className="text-gray-500 text-xs mt-2">Keep up the great work!</p>
        </GlowCard>

        <GlowCard>
          <p className="text-gray-400 text-sm mb-2">Modules Completed</p>
          <p className="text-3xl font-bold text-white">1 / 3</p>
          <div className="mt-3 h-2 bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full w-1/3 bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/50" />
          </div>
        </GlowCard>
      </div>

      {/* Course Curriculum */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Course Curriculum</h2>
        <div className="space-y-3">
          {modules.map((module) => (
            <GlowCard key={module.id}>
              <div className="flex items-center gap-4">
                {module.completed ? (
                  <CheckCircle2 className="text-green-500 flex-shrink-0" size={28} />
                ) : (
                  <Circle className="text-gray-600 flex-shrink-0" size={28} />
                )}
                <div className="flex-1">
                  <h3 className="font-bold text-white">{module.name}</h3>
                  <div className="mt-3 space-y-2">
                    {module.lessons.map((lesson, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-sm">
                        {lesson.completed ? (
                          <CheckCircle2 className="text-green-500/60" size={16} />
                        ) : (
                          <Circle className="text-gray-600" size={16} />
                        )}
                        <span className={lesson.completed ? 'text-gray-400 line-through' : 'text-gray-300'}>
                          {lesson.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                {!module.completed && (
                  <button className="px-3 py-1 rounded-lg text-xs font-medium bg-indigo-500/20 text-indigo-400 hover:bg-indigo-500/30 transition">
                    Resume
                  </button>
                )}
              </div>
            </GlowCard>
          ))}
        </div>
      </div>

      {/* Resources */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Resources & Support</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <GlowCard className="group cursor-pointer hover:border-indigo-500/50 transition">
            <div className="flex items-center gap-3">
              <BookOpen className="text-indigo-400/60 group-hover:text-indigo-400 transition" size={24} />
              <div>
                <h3 className="font-bold text-white text-sm">Study Materials</h3>
                <p className="text-gray-400 text-xs">12 resources</p>
              </div>
            </div>
          </GlowCard>

          <GlowCard className="group cursor-pointer hover:border-purple-500/50 transition">
            <div className="flex items-center gap-3">
              <Quiz className="text-purple-400/60 group-hover:text-purple-400 transition" size={24} />
              <div>
                <h3 className="font-bold text-white text-sm">Practice Quizzes</h3>
                <p className="text-gray-400 text-xs">8 quizzes</p>
              </div>
            </div>
          </GlowCard>

          <GlowCard className="group cursor-pointer hover:border-indigo-500/50 transition">
            <div className="flex items-center gap-3">
              <Award className="text-indigo-400/60 group-hover:text-indigo-400 transition" size={24} />
              <div>
                <h3 className="font-bold text-white text-sm">Certificate</h3>
                <p className="text-gray-400 text-xs">Earn on completion</p>
              </div>
            </div>
          </GlowCard>
        </div>
      </div>
    </div>
  );
}
