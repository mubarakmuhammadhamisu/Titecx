'use client';

import React, { useState, useEffect } from 'react';
import type { LeaderboardEntry } from '@/components/admin/adminTypes';
import { Trophy, Medal } from 'lucide-react';

export default function LeaderboardPage() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab]         = useState<'points' | 'credits'>('points');

  useEffect(() => {
    fetch('/api/admin/leaderboard')
      .then((r) => r.json())
      .then((d) => { setEntries(d.leaderboard ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const sorted = [...entries].sort((a, b) =>
    tab === 'points' ? b.lifetime_points - a.lifetime_points : b.credit_balance - a.credit_balance
  ).map((e, i) => ({ ...e, rank: i + 1 }));

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Trophy size={18} className="text-yellow-400" />;
    if (rank === 2) return <Medal  size={18} className="text-gray-300"  />;
    if (rank === 3) return <Medal  size={18} className="text-amber-600" />;
    return <span className="text-gray-500 text-sm font-bold w-4 text-center">{rank}</span>;
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading leaderboard…</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
        <p className="mt-2 text-gray-400">Top {sorted.length} students by performance</p>
      </div>

      {/* Top 3 Podium */}
      {sorted.length >= 3 && (
        <div className="flex items-end justify-center gap-4 py-6">
          {[sorted[1], sorted[0], sorted[2]].map((e, i) => {
            const heights = ['h-24', 'h-32', 'h-20'];
            const colors  = ['bg-gray-500/20 border-gray-500/30', 'bg-yellow-500/20 border-yellow-500/30', 'bg-amber-700/20 border-amber-700/30'];
            const textColors = ['text-gray-300', 'text-yellow-400', 'text-amber-600'];
            return (
              <div key={e.id} className="flex flex-col items-center gap-2">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/30 flex items-center justify-center text-white font-bold text-sm">
                  {e.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-xs text-white font-medium text-center max-w-[80px] truncate">{e.name.split(' ')[0]}</p>
                <p className={`text-xs font-bold ${textColors[i]}`}>
                  {tab === 'points' ? `${e.lifetime_points.toLocaleString()} pts` : `₦${e.credit_balance.toLocaleString()}`}
                </p>
                <div className={`w-20 ${heights[i]} rounded-t-lg border flex items-center justify-center ${colors[i]}`}>
                  <span className={`text-2xl font-black ${textColors[i]}`}>{[2,1,3][i]}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab toggle */}
      <div className="flex gap-2 p-1 bg-gray-900/50 rounded-xl border border-gray-800 w-fit">
        {(['points', 'credits'] as const).map((t) => (
          <button key={t} onClick={() => setTab(t)}
            className={`px-5 py-2 rounded-lg text-sm font-medium transition ${tab === t ? 'bg-indigo-600 text-white shadow' : 'text-gray-400 hover:text-gray-200'}`}>
            {t === 'points' ? '🏆 Lifetime Points' : '💰 Credits'}
          </button>
        ))}
      </div>

      {/* Full list */}
      <div className="space-y-2">
        {sorted.map((e) => (
          <div key={e.id} className={`flex items-center gap-4 rounded-xl border p-4 transition
            ${e.rank <= 3 ? 'border-indigo-500/25 bg-gradient-to-r from-indigo-500/5 to-transparent' : 'border-gray-800 bg-gray-900/30 hover:border-gray-700'}`}>
            <div className="w-8 flex items-center justify-center shrink-0">{rankIcon(e.rank)}</div>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/30 to-purple-500/30 border border-indigo-500/30 flex items-center justify-center text-white font-bold text-sm shrink-0">
              {e.name.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-white font-medium text-sm truncate">{e.name}</p>
              <p className="text-gray-500 text-xs">{e.courses_completed} course{e.courses_completed !== 1 ? 's' : ''} completed</p>
            </div>
            <div className="text-right shrink-0">
              <p className="text-indigo-300 font-bold text-sm">
                {tab === 'points' ? `${e.lifetime_points.toLocaleString()} pts` : `₦${e.credit_balance.toLocaleString()}`}
              </p>
              <p className="text-gray-600 text-xs">
                {tab === 'points' ? `₦${e.credit_balance.toLocaleString()} credits` : `${e.lifetime_points.toLocaleString()} lifetime pts`}
              </p>
            </div>
          </div>
        ))}
        {sorted.length === 0 && <p className="text-gray-500 text-sm text-center py-8">No leaderboard data yet.</p>}
      </div>
    </div>
  );
}
