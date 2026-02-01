'use client';

import Link from 'next/link';
import GlowCard from '@/components/AppShell/GlowCard';
import { BookOpen, Award, Clock, TrendingUp, ChevronRight } from 'lucide-react';

export default function DashboardPage() {
  return (
    <div className="w-full space-y-6">
      {/* Hero Card */}
      <GlowCard hero className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/50">
              M
            </div>
            <div>
              <h1 className="text-2xl font-bold text-white">Welcome back, Mubarak</h1>
              <p className="text-gray-300 text-sm">Ready to continue learning?</p>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Courses Enrolled</p>
              <p className="text-3xl font-bold text-white mt-2">8</p>
            </div>
            <BookOpen className="text-indigo-400/60 group-hover:text-indigo-400 transition" size={32} />
          </div>
        </GlowCard>

        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Hours Learned</p>
              <p className="text-3xl font-bold text-white mt-2">42.5</p>
            </div>
            <Clock className="text-purple-400/60 group-hover:text-purple-400 transition" size={32} />
          </div>
        </GlowCard>

        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Certificates</p>
              <p className="text-3xl font-bold text-white mt-2">3</p>
            </div>
            <Award className="text-indigo-400/60 group-hover:text-indigo-400 transition" size={32} />
          </div>
        </GlowCard>

        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm font-medium">Completion Rate</p>
              <p className="text-3xl font-bold text-white mt-2">68%</p>
            </div>
            <TrendingUp className="text-purple-400/60 group-hover:text-purple-400 transition" size={32} />
          </div>
        </GlowCard>
      </div>

      {/* Active Courses Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Active Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <GlowCard key={i} className="group cursor-pointer hover:border-purple-500/50 transition">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white">Course Title {i}</h3>
                  <p className="text-gray-400 text-sm mt-1">Instructor Name</p>
                </div>
                <ChevronRight className="text-indigo-400/40 group-hover:text-indigo-400 group-hover:translate-x-1 transition" size={20} />
              </div>

              {/* Progress Bar */}
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-400">Progress</span>
                  <span className="text-indigo-400 font-medium">{25 * i}%</span>
                </div>
                <div className="h-2 bg-gray-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/50"
                    style={{ width: `${25 * i}%` }}
                  />
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </div>

      {/* Recommended Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Recommended for You</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <GlowCard key={`rec-${i}`} className="group cursor-pointer hover:border-indigo-500/50 transition">
              <div className="aspect-video bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-lg mb-4 flex items-center justify-center">
                <BookOpen className="text-indigo-400/40" size={40} />
              </div>
              <h3 className="text-base font-bold text-white">Recommended Course {i}</h3>
              <p className="text-gray-400 text-sm mt-2">Learn new skills</p>
            </GlowCard>
          ))}
        </div>
      </div>
    </div>
  );
}
