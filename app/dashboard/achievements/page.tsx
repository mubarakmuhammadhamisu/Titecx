'use client';

import Image from 'next/image';

import { useState } from 'react';
import GlowCard from '@/components/AppShell/GlowCard';
import { Award, Share2, Download, Star, Trophy, Zap, CheckCircle2 } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export default function AchievementsPage() {
  const { user, enrolledCourses } = useAuth();
  // Track which cert's share button was just clicked so we can show a tick
  const [copiedId, setCopiedId] = useState<number | null>(null);
  if (!user) return null;

  const completed = enrolledCourses.filter((c) => c.progress === 100);

  // Certificates = one per completed course
  const certificates = completed.map((c, idx) => ({
    id: idx + 1,
    slug: c.slug,
    title: c.title,
    issuer: 'TITECX Academy',
    date: (c.completedAt ?? c.enrolledAt)
      ? new Date((c.completedAt ?? c.enrolledAt)!).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })
      : 'Recent',
  }));

  // Share: copy certificate URL to clipboard, show tick for 2s
  const handleShare = async (cert: typeof certificates[0]) => {
    const url = `${window.location.origin}/certificate/${cert.slug}`;
    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = url;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }
    setCopiedId(cert.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Download: open a minimal printable certificate in a new window and trigger print
  const handleDownload = (cert: typeof certificates[0]) => {
    const html = `<!DOCTYPE html>
<html>
<head>
  <title>Certificate — ${cert.title}</title>
  <style>
    @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;700;900&display=swap');
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', sans-serif;
      background: #fff;
      display: flex; align-items: center; justify-content: center;
      min-height: 100vh; padding: 40px;
    }
    .cert {
      border: 4px solid #6366f1;
      border-radius: 16px;
      padding: 60px 80px;
      max-width: 800px;
      width: 100%;
      text-align: center;
    }
    .brand { font-size: 14px; font-weight: 700; color: #6366f1; letter-spacing: 4px; text-transform: uppercase; }
    .heading { font-size: 13px; color: #888; margin: 24px 0 12px; text-transform: uppercase; letter-spacing: 2px; }
    .name { font-size: 36px; font-weight: 900; color: #111; margin-bottom: 12px; }
    .completed { font-size: 14px; color: #555; margin-bottom: 8px; }
    .course { font-size: 24px; font-weight: 700; color: #4f46e5; margin: 8px 0 32px; }
    .issuer { font-size: 13px; color: #888; }
    .date { font-size: 13px; color: #888; margin-top: 4px; }
    .divider { width: 80px; height: 3px; background: #6366f1; margin: 32px auto; border-radius: 2px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="cert">
    <div class="brand">TITECX Academy</div>
    <div class="divider"></div>
    <div class="heading">Certificate of Completion</div>
    <div class="heading" style="font-size:11px">This certifies that</div>
    <div class="name">${user.name}</div>
    <div class="completed">has successfully completed</div>
    <div class="course">${cert.title}</div>
    <div class="issuer">${cert.issuer}</div>
    <div class="date">${cert.date}</div>
  </div>
  <script>window.onload = () => { window.print(); }</script>
</body>
</html>`;
    const win = window.open('', '_blank');
    if (win) {
      win.document.write(html);
      win.document.close();
    }
  };

  const totalPoints = completed.length * 800 + enrolledCourses.filter((c) => c.progress > 0 && c.progress < 100).length * 200;

  // ── Badge logic ──────────────────────────────────────────────────────────────

  // Fast Learner: 3+ courses completed where all completedAt timestamps fall
  // within any rolling 30-day window. Uses the earliest completion as the anchor.
  const fastLearnerEarned = (() => {
    const dates = completed
      .map((c) => c.completedAt ? new Date(c.completedAt).getTime() : null)
      .filter((d): d is number => d !== null)
      .sort((a, b) => a - b);
    if (dates.length < 3) return false;
    // Slide a 30-day window: if the 3rd-earliest completion is within 30 days
    // of the earliest, all 3 fall inside that window.
    const MS_30_DAYS = 30 * 24 * 60 * 60 * 1000;
    for (let i = 0; i <= dates.length - 3; i++) {
      if (dates[i + 2] - dates[i] <= MS_30_DAYS) return true;
    }
    return false;
  })();

  // Consistent: activity (enrollments + completions) recorded across 7 or more
  // distinct calendar days. This is the best proxy available without a DB-tracked
  // last_login field — a true login-streak badge would need server-side tracking.
  const consistentEarned = (() => {
    const activityDates = new Set<string>();
    enrolledCourses.forEach((c) => {
      if (c.enrolledAt) activityDates.add(c.enrolledAt.slice(0, 10));
      if (c.completedAt) activityDates.add(c.completedAt.slice(0, 10));
    });
    return activityDates.size >= 7;
  })();

  const badges = [
    {
      id: 1,
      name: 'Fast Learner',
      description: 'Complete 3 courses within the same 30-day window',
      icon: Zap,
      earned: fastLearnerEarned,
    },
    {
      id: 2,
      name: 'Consistent',
      description: 'Show learning activity across 7 or more days',
      icon: Trophy,
      earned: consistentEarned,
    },
    {
      id: 3,
      name: 'Expert',
      description: 'Achieve 90%+ progress in all enrolled courses',
      icon: Star,
      earned: enrolledCourses.length > 0 && enrolledCourses.every((c) => c.progress >= 90),
    },
    {
      id: 4,
      name: 'Perfect Score',
      description: 'Get 100% in a quiz',
      icon: Award,
      earned: false,
    },
  ];

  return (
    <div className="space-y-6">
      <GlowCard hero>
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-full overflow-hidden bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-indigo-500/50 shrink-0">
            {user.avatarUrl ? (
              <Image src={user.avatarUrl} alt={user.name} width={64} height={64} className="w-full h-full object-cover" />
            ) : user.avatar}
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
                    <div className="w-12 h-12 rounded-xl bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/50">
                      <Award className="text-white" size={22} />
                    </div>
                    <div>
                      <h3 className="font-bold text-white text-sm">{cert.title}</h3>
                      <p className="text-gray-400 text-xs">{cert.issuer} · {cert.date}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <div className="relative">
                      <button
                        onClick={() => handleShare(cert)}
                        title="Copy certificate link"
                        className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-indigo-500/20 hover:border-indigo-500/60 transition"
                      >
                        {copiedId === cert.id
                          ? <CheckCircle2 size={16} className="text-emerald-400" />
                          : <Share2 size={16} className="text-indigo-400" />}
                      </button>
                      {copiedId === cert.id && (
                        <span className="absolute -top-8 left-1/2 -translate-x-1/2 whitespace-nowrap text-xs bg-gray-700 text-emerald-300 px-2 py-1 rounded-lg">
                          Link copied!
                        </span>
                      )}
                    </div>
                    <button
                      onClick={() => handleDownload(cert)}
                      title="Download certificate as PDF"
                      className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700 border border-purple-500/20 hover:border-purple-500/60 transition"
                    >
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
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${badge.earned ? 'bg-linear-to-br from-indigo-500 to-purple-500 shadow-indigo-500/50' : 'bg-gray-800'}`}>
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
        {totalPoints === 0 ? (
          <div className="py-6 text-center">
            <Trophy className="mx-auto mb-3 text-gray-600" size={36} />
            <p className="text-gray-400 text-sm">Complete lessons to climb the leaderboard!</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="font-bold w-6 text-center text-yellow-400">#1</span>
                <span className="text-indigo-400 font-semibold">
                  {user.name.split(' ')[0]} <span className="text-gray-500 font-normal">(you)</span>
                </span>
              </div>
              <span className="text-purple-400 font-bold">{totalPoints.toLocaleString()} pts</span>
            </div>
            <div className="pt-3 border-t border-white/5">
              <p className="text-gray-500 text-xs text-center">Invite friends to see how you compare!</p>
            </div>
          </div>
        )}
      </GlowCard>
    </div>
  );
}
