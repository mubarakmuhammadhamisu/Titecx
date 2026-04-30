// app/leaderboard/page.tsx
// Public page — no auth required. Server component for fast initial load + SEO.
// Paginated via ?page= searchParam. Real data from profiles table.

import React from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';
import { Trophy, Medal, Star, ChevronLeft, ChevronRight, Zap, Users } from 'lucide-react';

export const revalidate = 60; // ISR: re-fetch every 60 seconds

const PAGE_SIZE = 20;

interface LeaderboardEntry {
  id: string;
  name: string;
  avatar: string;
  avatar_url: string | null;
  lifetime_points: number;
  courses_completed: number;
  rank: number;
}

async function getLeaderboardData(page: number) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );

  const from = (page - 1) * PAGE_SIZE;
  const to   = from + PAGE_SIZE - 1;

  const { data: profiles, error, count } = await supabase
    .from('profiles')
    .select('id, name, avatar, avatar_url, lifetime_points', { count: 'exact' })
    .gt('lifetime_points', 0)
    .order('lifetime_points', { ascending: false })
    .range(from, to);

  if (error || !profiles) return { entries: [], total: 0 };

  // Count completed courses per user in one query
  const ids = profiles.map((p) => p.id);
  let completionMap: Record<string, number> = {};
  if (ids.length > 0) {
    const { data: completions } = await supabase
      .from('enrollments')
      .select('user_id')
      .in('user_id', ids)
      .eq('progress', 100);

    for (const row of completions ?? []) {
      completionMap[row.user_id] = (completionMap[row.user_id] ?? 0) + 1;
    }
  }

  const entries: LeaderboardEntry[] = profiles.map((p, i) => ({
    id:                p.id,
    name:              p.name,
    avatar:            p.avatar,
    avatar_url:        p.avatar_url,
    lifetime_points:   p.lifetime_points ?? 0,
    courses_completed: completionMap[p.id] ?? 0,
    rank:              from + i + 1,
  }));

  return { entries, total: count ?? 0 };
}

function AvatarCircle({ entry, size = 'md' }: { entry: LeaderboardEntry; size?: 'sm' | 'md' | 'lg' }) {
  const dims = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'md' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';
  return (
    <div className={`${dims} rounded-full overflow-hidden bg-linear-to-br from-indigo-600 to-purple-700 flex items-center justify-center font-bold text-white shrink-0 border-2 border-indigo-500/30`}>
      {entry.avatar_url
        ? <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
        : <span>{entry.avatar || entry.name.slice(0, 2).toUpperCase()}</span>
      }
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-yellow-400 font-black text-xl">🥇</span>;
  if (rank === 2) return <span className="text-gray-300 font-black text-xl">🥈</span>;
  if (rank === 3) return <span className="text-amber-500 font-black text-xl">🥉</span>;
  return (
    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 border border-indigo-500/20 text-gray-400 text-sm font-bold">
      {rank}
    </span>
  );
}

function PodiumCard({ entry, medalColor }: { entry: LeaderboardEntry; medalColor: string }) {
  const borderColor = entry.rank === 1 ? 'border-yellow-500/40' : entry.rank === 2 ? 'border-gray-400/30' : 'border-amber-600/30';
  const glowColor   = entry.rank === 1 ? 'shadow-yellow-500/10' : entry.rank === 2 ? 'shadow-gray-400/10' : 'shadow-amber-600/10';

  return (
    <div className={`flex-1 rounded-2xl bg-linear-to-br from-gray-900 to-gray-800/60 border ${borderColor} p-5 flex flex-col items-center gap-3 shadow-xl ${glowColor} text-center`}>
      <AvatarCircle entry={entry} size="lg" />
      <p className="font-bold text-white text-sm leading-tight">{entry.name}</p>
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${medalColor}`}>
        <Zap size={11} />
        {entry.lifetime_points.toLocaleString()} pts
      </div>
      <p className="text-xs text-gray-500">{entry.courses_completed} course{entry.courses_completed !== 1 ? 's' : ''} completed</p>
      <span className="text-3xl mt-1">{entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}</span>
    </div>
  );
}

export default async function LeaderboardPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const sp   = await searchParams;
  const page = Math.max(1, parseInt(sp?.page ?? '1', 10));
  const { entries, total } = await getLeaderboardData(page);
  const totalPages = Math.ceil(total / PAGE_SIZE);

  const top3  = page === 1 ? entries.slice(0, 3) : [];
  const rest  = page === 1 ? entries.slice(3)    : entries;

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      {/* Nav */}
      <div className="border-b border-indigo-500/10 bg-gray-950/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/" className="text-xl font-extrabold text-white hover:text-indigo-300 transition">
            TITECX
          </Link>
          <div className="flex items-center gap-4">
            <Link href="/dashboard" className="text-sm text-gray-400 hover:text-white transition">
              Dashboard
            </Link>
            <Link
              href="/dashboard/referral"
              className="text-sm px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-medium transition"
            >
              My Referrals
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-10 space-y-10">

        {/* Hero */}
        <div className="text-center space-y-3">
          <div className="flex items-center justify-center gap-3 mb-2">
            <Trophy size={32} className="text-yellow-400" />
            <h1 className="text-4xl font-extrabold text-white">Global Leaderboard</h1>
            <Trophy size={32} className="text-yellow-400" />
          </div>
          <p className="text-gray-400 max-w-lg mx-auto">
            The top learners ranked by lifetime points earned through learning and referrals.
            Refer a friend, earn a commission — climb the board.
          </p>
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-900 border border-indigo-500/20 text-sm text-gray-400">
            <Users size={14} className="text-indigo-400" />
            <span><span className="text-white font-semibold">{total.toLocaleString()}</span> participants on the board</span>
          </div>
        </div>

        {/* Podium — top 3, only on page 1 */}
        {top3.length >= 3 && (
          <div className="space-y-3">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Medal size={14} /> Top 3
            </h2>
            {/* Podium layout: 2nd | 1st | 3rd */}
            <div className="flex gap-4 items-end">
              {[top3[1], top3[0], top3[2]].map((entry, i) => (
                <PodiumCard
                  key={entry.id}
                  entry={entry}
                  medalColor={
                    entry.rank === 1
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : entry.rank === 2
                      ? 'bg-gray-500/20 text-gray-300 border border-gray-500/30'
                      : 'bg-amber-700/20 text-amber-500 border border-amber-600/30'
                  }
                />
              ))}
            </div>
          </div>
        )}

        {/* Rankings list */}
        {(rest.length > 0 || (page === 1 && entries.length > 0)) && (
          <div className="space-y-3">
            {page === 1 && top3.length > 0 && (
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
                <Star size={14} /> Rankings
              </h2>
            )}

            <div className="rounded-2xl bg-gray-900/60 border border-indigo-500/20 overflow-hidden divide-y divide-indigo-500/10">
              {rest.map((entry) => (
                <div
                  key={entry.id}
                  className="flex items-center gap-4 px-5 py-4 hover:bg-indigo-500/5 transition"
                >
                  <RankBadge rank={entry.rank} />
                  <AvatarCircle entry={entry} size="sm" />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-white text-sm truncate">{entry.name}</p>
                    <p className="text-xs text-gray-500">{entry.courses_completed} course{entry.courses_completed !== 1 ? 's' : ''} completed</p>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0">
                    <Zap size={11} className="text-yellow-400" />
                    {entry.lifetime_points.toLocaleString()} pts
                  </div>
                </div>
              ))}

              {entries.length === 0 && (
                <div className="py-16 text-center text-gray-500">
                  <Trophy size={40} className="mx-auto mb-3 opacity-30" />
                  <p>No participants yet. Be the first on the leaderboard!</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-3">
            {page > 1 && (
              <Link
                href={`/leaderboard?page=${page - 1}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-900 border border-indigo-500/20 text-gray-300 hover:text-white hover:border-indigo-500/50 text-sm font-medium transition"
              >
                <ChevronLeft size={15} /> Prev
              </Link>
            )}
            <span className="text-sm text-gray-500">
              Page <span className="text-white font-semibold">{page}</span> of <span className="text-white font-semibold">{totalPages}</span>
            </span>
            {page < totalPages && (
              <Link
                href={`/leaderboard?page=${page + 1}`}
                className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-900 border border-indigo-500/20 text-gray-300 hover:text-white hover:border-indigo-500/50 text-sm font-medium transition"
              >
                Next <ChevronRight size={15} />
              </Link>
            )}
          </div>
        )}

        {/* CTA */}
        <div className="rounded-2xl bg-linear-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 p-8 text-center space-y-4 shadow-[0_0_40px_rgba(99,102,241,0.08)]">
          <Zap size={28} className="text-yellow-400 mx-auto" />
          <h3 className="text-xl font-bold text-white">Earn Points, Climb the Board</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Refer friends to TITECX and earn <span className="text-indigo-300 font-semibold">10% commission in points</span> when they purchase a course within 30 days.
          </p>
          <Link
            href="/dashboard/referral"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition shadow-lg shadow-indigo-500/20"
          >
            <Zap size={16} /> Get My Referral Link
          </Link>
        </div>

      </div>
    </div>
  );
}
