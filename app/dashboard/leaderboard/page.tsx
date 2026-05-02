'use client';

// app/dashboard/leaderboard/page.tsx
// Two-tab leaderboard:
//   Tab 1 — Credits Board:   ranked by lifetime_points (Track A, stored)
//   Tab 2 — Learning Board:  ranked by derived learning_points (Track B, real-time)
//
// "Your Status" card is always visible — resolved by /api/leaderboard/my-rank
// so the user's true rank shows even if they are on page 5 of the list.

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Trophy, Medal, Star, ChevronLeft, ChevronRight,
  Zap, Users, RefreshCw, Crown, BookOpen, ArrowRight,
} from 'lucide-react';

const PAGE_SIZE = 20;

// ── Shared display shape — both tabs map into this ───────────────────────────
interface DisplayEntry {
  id: string;
  name: string;
  avatar: string;
  avatar_url: string | null;
  points: number;
  courses_completed: number;
  courses_in_progress?: number; // learning tab only
  rank: number;
}

interface LeaderboardResponse {
  leaderboard: DisplayEntry[];
  total: number;
  page: number;
}

interface MyRankData {
  rank: number | null;
  points: number;
  total: number;
}

type Tab = 'credits' | 'learning';

// ── Sub-components ────────────────────────────────────────────────────────────

function AvatarCircle({
  entry, size = 'md', highlight = false,
}: {
  entry: DisplayEntry;
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
  entry, medalColor, borderColor, tab,
}: {
  entry: DisplayEntry;
  medalColor: string;
  borderColor: string;
  tab: Tab;
}) {
  return (
    <div className={`flex-1 rounded-2xl bg-gradient-to-br from-gray-900 to-gray-800/60 border ${borderColor} p-5 flex flex-col items-center gap-3 text-center`}>
      <AvatarCircle entry={entry} size="lg" highlight={entry.rank === 1} />
      <p className="font-bold text-white text-sm leading-tight truncate w-full">{entry.name}</p>
      <div className={`flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${medalColor}`}>
        {tab === 'credits' ? <Zap size={11} /> : <BookOpen size={11} />}
        {entry.points.toLocaleString()} pts
      </div>
      <p className="text-xs text-gray-500">
        {entry.courses_completed} course{entry.courses_completed !== 1 ? 's' : ''} done
        {tab === 'learning' && entry.courses_in_progress
          ? ` · ${entry.courses_in_progress} in progress`
          : ''}
      </p>
      <span className="text-3xl mt-1">
        {entry.rank === 1 ? '🥇' : entry.rank === 2 ? '🥈' : '🥉'}
      </span>
    </div>
  );
}

// ── Sticky "Your Status" card ─────────────────────────────────────────────────
function YourStatusCard({
  myRank, tab, loading,
}: {
  myRank: MyRankData | null;
  tab: Tab;
  loading: boolean;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30 animate-pulse">
        <div className="w-5 h-5 rounded-full bg-gray-700 shrink-0" />
        <div className="flex-1 space-y-1.5">
          <div className="h-3 bg-gray-700 rounded w-1/4" />
          <div className="h-2.5 bg-gray-700/60 rounded w-1/3" />
        </div>
        <div className="h-7 w-14 bg-gray-700 rounded-lg" />
      </div>
    );
  }

  // ── Ranked ────────────────────────────────────────────────────────────────
  if (myRank?.rank !== null && myRank?.rank !== undefined) {
    const icon = tab === 'credits'
      ? <Zap size={14} className="text-yellow-400" />
      : <BookOpen size={14} className="text-emerald-400" />;
    const label = tab === 'credits' ? 'lifetime credit pts' : 'learning pts';
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-indigo-500/10 border border-indigo-500/30">
        <Crown size={18} className="text-yellow-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">Your position</p>
          <p className="text-xs text-gray-400 flex items-center gap-1">
            {icon}
            {myRank.points.toLocaleString()} {label} · out of {myRank.total.toLocaleString()} participants
          </p>
        </div>
        <div className="text-2xl font-black text-indigo-300 shrink-0">#{myRank.rank}</div>
      </div>
    );
  }

  // ── Unranked — high-conversion CTA ────────────────────────────────────────
  if (tab === 'credits') {
    return (
      <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
        <Zap size={18} className="text-amber-400 shrink-0" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-white">You're not on the Credits Board yet</p>
          <p className="text-xs text-gray-400">
            One referral that converts = instant entry. Earn 10% of every course they buy.
          </p>
        </div>
        <Link
          href="/dashboard/referral"
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 text-xs font-semibold transition shrink-0 border border-amber-500/20"
        >
          Get Link <ArrowRight size={12} />
        </Link>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-4 px-5 py-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
      <BookOpen size={18} className="text-emerald-400 shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-white">Start learning to appear here</p>
        <p className="text-xs text-gray-400">
          Even partial progress earns 200 pts. Finish a course for 800 pts.
        </p>
      </div>
      <Link
        href="/courses"
        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition shrink-0 border border-emerald-500/20"
      >
        Browse <ArrowRight size={12} />
      </Link>
    </div>
  );
}

// ── Normalise both API response shapes into DisplayEntry ──────────────────────
function normaliseEntry(raw: any, tab: Tab): DisplayEntry {
  return {
    id:                  raw.id,
    name:                raw.name,
    avatar:              raw.avatar,
    avatar_url:          raw.avatar_url,
    points:              tab === 'credits'
                           ? (raw.lifetime_points ?? raw.points ?? 0)
                           : (raw.learning_points ?? raw.points ?? 0),
    courses_completed:   raw.courses_completed ?? raw.coursesCompleted ?? 0,
    courses_in_progress: raw.courses_in_progress,
    rank:                raw.rank,
  };
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function LeaderboardPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab]     = useState<Tab>('credits');
  const [page, setPage]               = useState(1);
  const [data, setData]               = useState<LeaderboardResponse | null>(null);
  const [myRank, setMyRank]           = useState<MyRankData | null>(null);
  const [loading, setLoading]         = useState(true);
  const [myRankLoading, setMyRankLoading] = useState(true);
  const [error, setError]             = useState('');

  const totalPages = data ? Math.ceil(data.total / PAGE_SIZE) : 1;

  const fetchPage = useCallback(async (p: number, tab: Tab) => {
    setLoading(true);
    setError('');
    try {
      const url = tab === 'credits'
        ? `/api/admin/leaderboard?page=${p}&limit=${PAGE_SIZE}`
        : `/api/leaderboard/learning?page=${p}&limit=${PAGE_SIZE}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('fetch failed');
      const json = await res.json();
      setData({
        leaderboard: (json.leaderboard ?? []).map((e: any) => normaliseEntry(e, tab)),
        total:       json.total,
        page:        json.page,
      });
      setPage(p);
    } catch {
      setError('Could not load leaderboard. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchMyRank = useCallback(async (tab: Tab) => {
    setMyRankLoading(true);
    try {
      const res = await fetch(`/api/leaderboard/my-rank?tab=${tab}`);
      if (!res.ok) throw new Error();
      setMyRank(await res.json());
    } catch {
      setMyRank(null);
    } finally {
      setMyRankLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPage(1, 'credits');
    fetchMyRank('credits');
  }, [fetchPage, fetchMyRank]);

  const switchTab = (tab: Tab) => {
    if (tab === activeTab) return;
    setActiveTab(tab);
    setData(null);
    setMyRank(null);
    fetchPage(1, tab);
    fetchMyRank(tab);
  };

  const entries = data?.leaderboard ?? [];
  const top3    = page === 1 ? entries.slice(0, 3) : [];
  const rest    = page === 1 ? entries.slice(3) : entries;
  const tabIcon = activeTab === 'credits'
    ? <Zap size={13} className="text-yellow-400" />
    : <BookOpen size={13} className="text-emerald-400" />;
  const tabPtLabel = activeTab === 'credits' ? 'pts' : 'lp';

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white flex items-center gap-3">
            <Trophy size={26} className="text-yellow-400" /> Leaderboard
          </h1>
          <p className="text-gray-400 text-sm mt-1">
            {activeTab === 'credits'
              ? 'Ranked by lifetime credit points earned through referrals. 1 Credit = ₦1.'
              : 'Ranked by learning progress. Completed = 800 pts · In-progress = 200 pts.'}
          </p>
        </div>
        <Link
          href={activeTab === 'credits' ? '/dashboard/referral' : '/courses'}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-sm font-semibold transition shrink-0 shadow-lg shadow-indigo-500/20"
        >
          {activeTab === 'credits'
            ? <><Zap size={14} /> Earn Credits</>
            : <><BookOpen size={14} /> Browse Courses</>}
        </Link>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-900/80 border border-indigo-500/20 w-fit">
        {(['credits', 'learning'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => switchTab(tab)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition ${
              activeTab === tab
                ? 'bg-indigo-600 text-white shadow-md shadow-indigo-500/20'
                : 'text-gray-400 hover:text-white'
            }`}
          >
            {tab === 'credits'
              ? <><Zap size={13} className={activeTab === tab ? 'text-yellow-300' : 'text-gray-500'} /> Credits</>
              : <><BookOpen size={13} className={activeTab === tab ? 'text-emerald-300' : 'text-gray-500'} /> Learning</>}
          </button>
        ))}
      </div>

      {/* Your Status — always visible, never page-dependent */}
      <YourStatusCard myRank={myRank} tab={activeTab} loading={myRankLoading} />

      {/* Stats bar */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Users size={14} className="text-indigo-400" />
        <span>
          <span className="text-white font-semibold">{data?.total.toLocaleString() ?? '—'}</span>{' '}
          participants on the {activeTab === 'credits' ? 'Credits' : 'Learning'} Board
        </span>
        {loading && <RefreshCw size={13} className="ml-2 animate-spin text-gray-600" />}
      </div>

      {/* Error */}
      {error && (
        <div className="px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => fetchPage(page, activeTab)} className="text-xs underline">Retry</button>
        </div>
      )}

      {/* Podium */}
      {!loading && top3.length >= 3 && (
        <div className="space-y-3">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
            <Medal size={13} /> Top 3
          </h2>
          <div className="flex gap-3 items-end">
            <PodiumCard entry={top3[1]} tab={activeTab} borderColor="border-gray-400/30" medalColor="bg-gray-500/20 text-gray-300 border border-gray-500/30" />
            <PodiumCard entry={top3[0]} tab={activeTab} borderColor="border-yellow-500/40" medalColor="bg-yellow-500/20 text-yellow-400 border border-yellow-500/30" />
            <PodiumCard entry={top3[2]} tab={activeTab} borderColor="border-amber-600/30" medalColor="bg-amber-700/20 text-amber-500 border border-amber-600/30" />
          </div>
        </div>
      )}

      {/* Rankings list */}
      {!loading && entries.length > 0 && (
        <div className="space-y-2">
          {page === 1 && top3.length >= 3 && (
            <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-widest flex items-center gap-2">
              <Star size={13} /> Rankings
            </h2>
          )}
          <div className="rounded-2xl bg-gray-900/60 border border-indigo-500/20 overflow-hidden divide-y divide-indigo-500/10">
            {(page === 1 && top3.length >= 3 ? rest : entries).map((entry) => (
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
                    {activeTab === 'learning' && entry.courses_in_progress
                      ? ` · ${entry.courses_in_progress} in progress`
                      : ''}
                  </p>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold shrink-0 ${
                  activeTab === 'credits'
                    ? 'bg-indigo-500/10 border-indigo-500/20 text-indigo-300'
                    : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-300'
                }`}>
                  {tabIcon}
                  {entry.points.toLocaleString()} {tabPtLabel}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
      {!loading && entries.length === 0 && !error && (
        <div className="py-16 text-center text-gray-500 space-y-2 rounded-2xl bg-gray-900/60 border border-indigo-500/20">
          <Trophy size={40} className="mx-auto opacity-30" />
          <p className="text-sm">No participants yet on the {activeTab === 'credits' ? 'Credits' : 'Learning'} Board.</p>
          <p className="text-xs">
            {activeTab === 'credits'
              ? 'Refer a friend to earn your first credits and claim the top spot.'
              : 'Start any course to be the first on the Learning Board.'}
          </p>
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
            onClick={() => fetchPage(page - 1, activeTab)}
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
            onClick={() => fetchPage(page + 1, activeTab)}
            disabled={page >= totalPages}
            className="flex items-center gap-1 px-4 py-2 rounded-lg bg-gray-900 border border-indigo-500/20 text-gray-300 hover:text-white hover:border-indigo-500/50 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next <ChevronRight size={15} />
          </button>
        </div>
      )}

    </div>
  );
}
