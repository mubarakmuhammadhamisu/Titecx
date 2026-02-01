'use client';

import GlowCard from '@/components/AppShell/GlowCard';
import { Award, Share2, Download, Star, Trophy, Zap } from 'lucide-react';

export default function AchievementsPage() {
  const certificates = [
    { id: 1, title: 'Python Mastery', issuer: 'Learnify Academy', date: 'Dec 2024', status: 'Completed' },
    { id: 2, title: 'Web Development Pro', issuer: 'Learnify Academy', date: 'Nov 2024', status: 'Completed' },
    { id: 3, title: 'Data Science Expert', issuer: 'Learnify Academy', date: 'Oct 2024', status: 'Completed' },
  ];

  const badges = [
    { id: 1, name: 'Fast Learner', description: 'Completed 3 courses in a month', icon: Zap, earned: true },
    { id: 2, name: 'Consistent', description: 'Logged in 30 days straight', icon: Trophy, earned: true },
    { id: 3, name: 'Expert', description: 'Achieved 90%+ in all courses', icon: Star, earned: false },
    { id: 4, name: 'Perfect Score', description: 'Got 100% in a quiz', icon: Award, earned: false },
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
              <h1 className="text-2xl font-bold text-white">Achievements</h1>
              <p className="text-gray-300 text-sm">Celebrate your learning milestones</p>
            </div>
          </div>
        </div>
      </GlowCard>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Certificates Earned</p>
              <p className="text-3xl font-bold text-white mt-2">3</p>
            </div>
            <Award className="text-indigo-400/60 group-hover:text-indigo-400 transition" size={32} />
          </div>
        </GlowCard>

        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Badges Earned</p>
              <p className="text-3xl font-bold text-white mt-2">2 / 4</p>
            </div>
            <Star className="text-purple-400/60 group-hover:text-purple-400 transition" size={32} />
          </div>
        </GlowCard>

        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-gray-400 text-sm">Total Points</p>
              <p className="text-3xl font-bold text-white mt-2">2,450</p>
            </div>
            <Trophy className="text-indigo-400/60 group-hover:text-indigo-400 transition" size={32} />
          </div>
        </GlowCard>
      </div>

      {/* Certificates Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Your Certificates</h2>
        <div className="space-y-3">
          {certificates.map((cert) => (
            <GlowCard key={cert.id} className="group">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                    <Award className="text-white" size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-white">{cert.title}</h3>
                    <p className="text-gray-400 text-sm">{cert.issuer} • {cert.date}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-indigo-500/20 hover:border-indigo-500/60 transition">
                    <Share2 size={18} className="text-indigo-400" />
                  </button>
                  <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-purple-500/20 hover:border-purple-500/60 transition">
                    <Download size={18} className="text-purple-400" />
                  </button>
                </div>
              </div>
            </GlowCard>
          ))}
        </div>
      </div>

      {/* Badges Section */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Achievement Badges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((badge) => {
            const IconComponent = badge.icon;
            return (
              <GlowCard
                key={badge.id}
                className={`group ${
                  badge.earned
                    ? 'border-indigo-500/30 hover:border-indigo-500/50'
                    : 'border-gray-700/50 hover:border-gray-600/50 opacity-50'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div
                    className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg
                      ${
                        badge.earned
                          ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-500/50'
                          : 'bg-gray-800 shadow-none'
                      }`}
                  >
                    <IconComponent
                      size={28}
                      className={badge.earned ? 'text-white' : 'text-gray-500'}
                    />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{badge.name}</h3>
                    <p className="text-gray-400 text-sm">{badge.description}</p>
                    {badge.earned && (
                      <div className="mt-2">
                        <span className="text-xs font-medium px-2 py-1 rounded-full bg-green-500/20 text-green-400">
                          Earned
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>

      {/* Leaderboard Teaser */}
      <GlowCard>
        <h2 className="text-lg font-bold text-white mb-4">Leaderboard</h2>
        <div className="space-y-3">
          {[
            { rank: 1, name: 'Alex Chen', points: 3200 },
            { rank: 2, name: 'You', points: 2450 },
            { rank: 3, name: 'Maria Garcia', points: 2180 },
          ].map((entry) => (
            <div key={entry.rank} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-400 font-bold">#{entry.rank}</span>
                <span className={entry.rank === 2 ? 'text-indigo-400 font-medium' : 'text-gray-300'}>
                  {entry.name}
                </span>
              </div>
              <span className="text-purple-400 font-bold">{entry.points} pts</span>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}
