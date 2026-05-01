'use client';

// app/dashboard/leaderboard/page.tsx
// Protected page — sits inside the dashboard AuthGuard + AppShell.
// Client component because it handles pagination state.

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Trophy, Medal, Star, ChevronLeft, ChevronRight,
  Zap, Users, RefreshCw, Crown,
} from 'lucide-react';

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

interface LeaderboardResponse {
  leaderboard: LeaderboardEntry[];
  total: number;
  page: number;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AvatarCircle({
  entry, size = 'md', highlight = false,
}: {
  entry: LeaderboardEntry;
  size?: 'sm' | 'md' | 'lg';
  highlight?: boolean;
}) {
  const dims = size === 'lg' ? 'w-20 h-20 text-2xl' : size === 'md' ? 'w-11 h-11 text-sm' : 'w-9 h-9 text-xs';
  const border = highlight ? 'border-2 border-yellow-400/60' : 'border-2 border-indigo-500/30';
  return (
    <div className={`${dims} ${border} rounded-full overflow-hidden bg-gradient-to-br from-indigo-600 to-purple-700 flex items-center justify-center font-bold text-white shrink-0`}>
      {entry.avatar_url
        ? <img src={entry.avatar_url} alt={entry.name} className="w-full h-full object-cover" />
        : <span>{entry.avatar || entry.name.slice(0, 2).toUpperCase()}</span>
      }
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return (
    <span className="w-8 h-8 flex items-center justify-center rounded-full bg-gray-800 border border-indigo-500/20 text-gray-400 text-sm font-bold shrink-0">
      {rank}
    </span>
  );
}

function PodiumCard({
  entry, medalColor, borderColor,
}: {
  entry: LeaderboardEntry;
  medalColor: string;
  borderColor: string;
}) {
  return (
    <div className={`flex-1 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800/60 border ${borderColor} p-5 flex flex-col items-center gap-3 text-center`}>
      <AvatarCircle entry={entry} size="lg" highlight={entry.rank === 1} />
      <p className="font-bold text-white text-sm leading-tight truncate w-full">{entry.name}</p>
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${medalColor}`}>
        <Zap size={11} />
        {entry.lifetime_points.toLocaleString()} pts
      </div>
      <p className="text-xs text-gray-500">
        {entry.courses_completed} course{entry.courses_completed !== 1 ? 's' : ''} done
      </p>
      <span className="text-3xl mt-1">
        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
      </span>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [page, setPage]           = useState(1);
  const [data, setData]           = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState('');

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  const fetchPage = useCallback(async (p: number) => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`/api/admin/leaderboard?page=${p}&limit=${PAGE_SIZE}`);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json() as LeaderboardResponse;
      setData(json);
      setPage(p);
    } catch {
      setError('Could not load Credits Leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchPage(1); }, [fetchPage]);

  const entries   = data?.leaderboard ?? [];
  const top3      = page === 1 ? entries.slice(0, 3) : [];
  const rest      = page === 1 ? entries.slice(3) : entries;

  // Find the current user's position in the current page results
  const myEntry   = entries.find((e) => e.id === user?.id);

  return (
    <div className="w-full max-w-4xl mx-auto space-y-8">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <Trophy size={26} className="text-yellow-400" /> Credits Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            Ranked by lifetime credits earned through referrals. 1 Credit = ₦1.
          </p>
        </div>
        <Link
          href="/dashboard/referral"
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold transition shrink-0 shadow-lg shadow-indigo-500/20"
        >
          <Zap size={14} /> Earn Points
        </Link>
      </div>

      {/* Your position banner (if you're on the board) */}
      {myEntry && (
        <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
          <Crown size={18} className="text-yellow-400 shrink-0" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-white">Your position on this page</p>
            <p className="text-xs text-gray-400">Rank #{myEntry.rank} · {myEntry.lifetime_points.toLocaleString()} lifetime pts</p>
          </div>
          <div className="text-2xl font-black text-indigo-300">#{myEntry.rank}</div>
        </div>
      )}

      {/* Stats bar */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users size={14} className="text-indigo-400" />
        <span>
          <span className="text-white font-semibold">{data?.total.toLocaleString() ?? '—'}</span> participants on the board
        </span>
        {loading && <RefreshCw size={13} className="ml-2 animate-spin text-gray-600" />}
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchPage(page)} className="text-xs underline">Retry</button>
        </div>
      )}

      {/* Podium — top 3, page 1 only */}
      {!loading && top3.length >= 3 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Medal size={13} /> Top 3
          </h2>
          {/* Order: 2nd | 1st | 3rd — classic podium layout */}
          <div className="flex gap-3 items-end">
            <PodiumCard
              entry={top3[1]}
              borderColor="border-gray-400/30"
              medalColor="bg-gray-500/20 text-gray-300 border border-gray-500/30"
            />
            <PodiumCard
              entry={top3[0]}
              borderColor="border-yellow-500/40"
              medalColor="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30"
            />
            <PodiumCard
              entry={top3[2]}
              borderColor="border-amber-600/30"
              medalColor="bg-amber-700/20 text-amber-500 border border-amber-600/30"
            />
          </div>
        </div>
      )}

      {/* Rankings list */}
      {!loading && (rest.length > 0 || (page === 1 && entries.length > 0 && top3.length < 3)) && (
        <div className="space-y-2">
          {page === 1 && top3.length >= 3 && (
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Star size={13} /> Rankings
            </h2>
          )}

          <div className="rounded-2xl bg-gray-900/60 border border-indigo-500/20 overflow-hidden divide-y divide-indigo-500/10">
            {/* If fewer than 3 on page 1, show all entries in the list */}
            {(page === 1 && top3.length < 3 ? entries : rest).map((entry) => (
              <div
                key={entry.id}
                className={`flex items-center gap-4 px-5 py-4 transition ${
                  entry.id === user?.id
                    ? 'bg-indigo-500/10 border-l-2 border-l-indigo-400'
                    : 'hover:bg-indigo-500/5'
                }`}
              >
                <RankBadge rank={entry.rank} />
                <AvatarCircle entry={entry} size="sm" />
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-white text-sm truncate">
                    {entry.name}
                    {entry.id === user?.id && (
                      <span className="ml-2 text-xs text-indigo-400 font-normal">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-gray-500">
                    {entry.courses_completed} course{entry.courses_completed !== 1 ? 's' : ''} completed
                  </p>
                </div>
                <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-bold shrink-0">
                  <Zap size={11} className="text-yellow-400" />
                  {entry.lifetime_points.toLocaleString()} pts
                </div>
              </div>
            ))}

            {entries.length === 0 && !loading && (
              <div className="py-16 text-center text-gray-500 space-y-2">
                <Trophy size={40} className="mx-auto opacity-30" />
                <p className="text-sm">No participants yet.</p>
                <p className="text-xs">Refer a friend to earn your first points and claim the top spot.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Loading skeleton */}
      {loading && (
        <div className="rounded-2xl bg-gray-900/60 border border-indigo-500/20 overflow-hidden divide-y divide-indigo-500/10">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-5 py-4 animate-pulse">
              <div className="w-8 h-8 rounded-full bg-gray-800" />
              <div className="w-9 h-9 rounded-full bg-gray-800" />
              <div className="flex-1 space-y-1.5">
                <div className="h-3 bg-gray-800 rounded w-1/3" />
                <div className="h-2.5 bg-gray-800/60 rounded w-1/5" />
              </div>
              <div className="h-6 w-20 bg-gray-800 rounded-full" />
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && !loading && (
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={() => fetchPage(page - 1)}
            disabled={page <= 1}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-900 border border-indigo-500/20 text-gray-300 hover:text-white hover:border-indigo-500/50 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <ChevronLeft size={15} /> Prev
          </button>
          <span className="text-sm text-gray-500">
            Page <span className="text-white font-semibold">{page}</span> of{' '}
            <span className="text-white font-semibold">{totalPages}</span>
          </span>
          <button
            onClick={() => fetchPage(page + 1)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-900 border border-indigo-500/20 text-gray-300 hover:text-white hover:border-indigo-500/50 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

      {/* CTA for users with no points yet */}
      {!loading && user && user.lifetimePoints === 0 && (
        <div className="rounded-2xl bg-gradient-to-br from-indigo-900/40 to-purple-900/20 border border-indigo-500/20 p-7 text-center space-y-3 shadow-[0_0_40px_rgba(99,102,241,0.08)]">
          <Zap size={26} className="text-yellow-400 mx-auto" />
          <h3 className="text-lg font-bold text-white">You're not on the Credits Leaderboard yet</h3>
          <p className="text-gray-400 text-sm max-w-sm mx-auto">
            Refer friends and earn 10% commission in points when they purchase a course within 30 days.
          </p>
          <Link
            href="/dashboard/referral"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm transition"
          >
            <Zap size={14} /> Get My Referral Link
          </Link>
        </div>
      )}

    </div>
  );
}
