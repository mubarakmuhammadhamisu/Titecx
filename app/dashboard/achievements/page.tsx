'use client';

import GlowCard from '@/components/AppShell/GlowCard';
import { Award, Share2, Download, Star, Trophy, Zap } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AchievementsPage() {
  const { user, enrolledCourses } = useAuth();
  if (!user) return null;

  const completed = enrolledCourses.filter((c) => c.progress === 100);

  // Certificates = one per completed course
  const certificates = completed.map((c, idx) => ({
    id: idx + 1,
    title: c.title,
    issuer: 'Learnify Academy',
    date: 'Dec 2024',
  }));

  const totalPoints = completed.length * 800 + enrolledCourses.filter((c) => c.progress > 0 && c.progress < 100).length * 200;

  const badges = [
    { id: 1, name: 'Fast Learner', description: 'Completed 3 courses in a month', icon: Zap, earned: completed.length >= 3 },
    { id: 2, name: 'Consistent', description: 'Logged in 30 days straight', icon: Trophy, earned: enrolledCourses.length >= 2 },
    { id: 3, name: 'Expert', description: 'Achieved 90%+ in all courses', icon: Star, earned: enrolledCourses.length > 0 && enrolledCourses.every((c) => c.progress >= 90) },
    { id: 4, name: 'Perfect Score', description: 'Got 100% in a quiz', icon: Award, earned: false },
  ];

  return (
    <div className="space-y-6">
      <GlowCard hero>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/50">
            {user.avatar}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-white">Achievements</h1>
            <p className="text-gray-300 text-sm mt-0.5">Celebrate your learning milestones</p>
          </div>
        </div>
      </GlowCard>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-400 text-sm">Certificates Earned</p><p className="text-3xl font-bold text-white mt-2">{certificates.length}</p></div>
            <Award className="text-indigo-400/60 group-hover:text-indigo-400 transition" size={32} />
          </div>
        </GlowCard>
        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-400 text-sm">Badges Earned</p><p className="text-3xl font-bold text-white mt-2">{badges.filter((b) => b.earned).length} / {badges.length}</p></div>
            <Star className="text-purple-400/60 group-hover:text-purple-400 transition" size={32} />
          </div>
        </GlowCard>
        <GlowCard className="group">
          <div className="flex items-center justify-between">
            <div><p className="text-gray-400 text-sm">Total Points</p><p className="text-3xl font-bold text-white mt-2">{totalPoints.toLocaleString()}</p></div>
            <Trophy className="text-indigo-400/60 group-hover:text-indigo-400 transition" size={32} />
          </div>
        </GlowCard>
      </div>

      {/* Certificates */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Your Certificates</h2>
        {certificates.length === 0 ? (
          <GlowCard className="text-center py-10">
            <Award className="mx-auto mb-3 text-gray-600" size={40} />
            <p className="text-gray-400 text-sm">Complete a course to earn your first certificate.</p>
          </GlowCard>
        ) : (
          <div className="space-y-3">
            {certificates.map((cert) => (
              <GlowCard key={cert.id} className="group">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                      <Award className="text-white" size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{cert.title}</h3>
                      <p className="text-gray-400 text-xs">{cert.issuer} · {cert.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-indigo-500/20 hover:border-indigo-500/60 transition">
                      <Share2 size={16} className="text-indigo-400" />
                    </button>
                    <button className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-purple-500/20 hover:border-purple-500/60 transition">
                      <Download size={16} className="text-purple-400" />
                    </button>
                  </div>
                </div>
              </GlowCard>
            ))}
          </div>
        )}
      </div>

      {/* Badges */}
      <div>
        <h2 className="text-xl font-bold text-white mb-4">Achievement Badges</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {badges.map((badge) => {
            const Icon = badge.icon;
            return (
              <GlowCard key={badge.id} className={`group ${badge.earned ? 'border-indigo-500/30 hover:border-indigo-500/50' : 'border-gray-700/50 opacity-50'}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${badge.earned ? 'bg-gradient-to-br from-indigo-500 to-purple-500 shadow-indigo-500/50' : 'bg-gray-800'}`}>
                    <Icon size={28} className={badge.earned ? 'text-white' : 'text-gray-500'} />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-white text-sm">{badge.name}</h3>
                    <p className="text-gray-400 text-xs mt-0.5">{badge.description}</p>
                    {badge.earned && (
                      <span className="inline-block mt-2 text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400">Earned</span>
                    )}
                  </div>
                </div>
              </GlowCard>
            );
          })}
        </div>
      </div>

      {/* Leaderboard */}
      <GlowCard>
        <h2 className="text-lg font-bold text-white mb-4">Leaderboard</h2>
        <div className="space-y-3">
          {[
            { rank: 1, name: 'Alex Chen', points: 3200 },
            { rank: 2, name: user.name.split(' ')[0], points: totalPoints },
            { rank: 3, name: 'Maria Garcia', points: 2180 },
          ].sort((a, b) => b.points - a.points).map((entry, idx) => (
            <div key={entry.rank} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className={`font-bold w-6 text-center ${idx === 0 ? 'text-yellow-400' : 'text-gray-400'}`}>#{idx + 1}</span>
                <span className={entry.name === user.name.split(' ')[0] ? 'text-indigo-400 font-semibold' : 'text-gray-300'}>
                  {entry.name} {entry.name === user.name.split(' ')[0] && '(you)'}
                </span>
              </div>
              <span className="text-purple-400 font-bold">{entry.points.toLocaleString()} pts</span>
            </div>
          ))}
        </div>
      </GlowCard>
    </div>
  );
}
