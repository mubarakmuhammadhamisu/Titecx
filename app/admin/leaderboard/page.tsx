'use client';

import React, { useState } from 'react';
import { mockLeaderboard, Leaderboard } from '@/components/admin/mock-data';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { Trophy, Zap, BookOpen, Archive } from 'lucide-react';
import { Modal } from '@/components/admin/shared/Modal';

type Tab = 'credits' | 'learning';

interface ArchivedSnapshot {
  id: string;
  date: string;
  tab: Tab;
  data: Leaderboard[];
}

export default function LeaderboardPage() {
  const [activeTab, setActiveTab]             = useState<Tab>('credits');
  const [leaderboard, setLeaderboard]         = useState<Leaderboard[]>(mockLeaderboard);
  const [archives, setArchives]               = useState<ArchivedSnapshot[]>([]);
  const [showArchives, setShowArchives]       = useState(false);
  const [archiveConfirm, setArchiveConfirm]   = useState(false);
  const [viewingSnapshot, setViewingSnapshot] = useState<ArchivedSnapshot | null>(null);

  const handleArchiveAndReset = () => {
    const snapshot: ArchivedSnapshot = {
      id: `snap-${Date.now()}`,
      date: new Date().toLocaleDateString('en-NG', { day: 'numeric', month: 'long', year: 'numeric' }),
      tab: activeTab,
      data: leaderboard,
    };
    setArchives((prev) => [snapshot, ...prev]);
    setLeaderboard([]);
    setArchiveConfirm(false);
  };

  const creditsColumns: Column<Leaderboard>[] = [
    { key: 'position', label: '#', sortable: true },
    { key: 'studentName', label: 'Student', sortable: true },
    {
      key: 'lifetime_points',
      label: 'Lifetime Points',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center gap-1 font-semibold text-indigo-300">
          <Zap size={12} className="text-yellow-400" />{Number(value).toLocaleString()}
        </span>
      ),
    },
    {
      key: 'credit_balance',
      label: 'Spendable Balance',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
          ₦{Number(value).toLocaleString()}
        </span>
      ),
    },
    { key: 'coursesCompleted', label: 'Courses Done', sortable: true },
  ];

  const learningColumns: Column<Leaderboard>[] = [
    { key: 'position', label: '#', sortable: true },
    { key: 'studentName', label: 'Student', sortable: true },
    {
      key: 'learning_points',
      label: 'Learning Points',
      sortable: true,
      render: (value) => (
        <span className="inline-flex items-center gap-1 font-semibold text-emerald-300">
          <BookOpen size={12} className="text-emerald-400" />{Number(value).toLocaleString()} lp
        </span>
      ),
    },
    {
      key: 'courses_completed',
      label: 'Completed',
      sortable: true,
      render: (value, row) => (
        <span className="text-sm text-gray-300">{Number(value)} <span className="text-gray-600 text-xs">× 800 = {Number(value) * 800} pts</span></span>
      ),
    },
    {
      key: 'courses_in_progress',
      label: 'In Progress',
      sortable: true,
      render: (value) => (
        <span className="text-sm text-gray-300">{Number(value)} <span className="text-gray-600 text-xs">× 200 = {Number(value) * 200} pts</span></span>
      ),
    },
  ];

  const displayData = activeTab === 'credits'
    ? [...leaderboard].sort((a, b) => b.lifetime_points - a.lifetime_points).map((r, i) => ({ ...r, position: i + 1 }))
    : [...leaderboard].sort((a, b) => b.learning_points - a.learning_points).map((r, i) => ({ ...r, position: i + 1 }));

  const snapshotDisplay = viewingSnapshot
    ? (viewingSnapshot.tab === 'credits'
        ? [...viewingSnapshot.data].sort((a, b) => b.lifetime_points - a.lifetime_points).map((r, i) => ({ ...r, position: i + 1 }))
        : [...viewingSnapshot.data].sort((a, b) => b.learning_points - a.learning_points).map((r, i) => ({ ...r, position: i + 1 })))
    : [];

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Trophy size={28} className="text-yellow-400" /> Leaderboard
          </h1>
          <p className="mt-2 text-gray-400">
            {activeTab === 'credits'
              ? 'Ranked by lifetime credit points (Track A — stored). Spendable balance shown separately.'
              : 'Ranked by learning points (Track B — derived). Formula: (completed × 800) + (in-progress × 200).'}
          </p>
        </div>
        <div className="flex gap-3 flex-wrap">
          <button
            onClick={() => setShowArchives(!showArchives)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-indigo-500/30 text-indigo-300 hover:border-indigo-500/60 text-sm font-medium transition"
          >
            <Archive size={15} /> {showArchives ? 'Hide' : 'View'} Archives ({archives.length})
          </button>
          <button
            onClick={() => setArchiveConfirm(true)}
            disabled={leaderboard.length === 0}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-600/20 border border-amber-500/30 text-amber-300 hover:bg-amber-600/30 text-sm font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Archive size={15} /> Archive &amp; Reset
          </button>
        </div>
      </div>

      {/* Tab toggle */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-900/80 border border-indigo-500/20 w-fit">
        {(['credits', 'learning'] as Tab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
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

      {/* Table */}
      {leaderboard.length > 0 ? (
        <AdminTable
          columns={activeTab === 'credits' ? creditsColumns : learningColumns}
          data={displayData}
        />
      ) : (
        <div className="rounded-2xl border border-indigo-500/20 bg-gray-900/60 p-12 text-center space-y-2">
          <Trophy size={36} className="mx-auto opacity-30 text-yellow-400" />
          <p className="text-gray-400">Leaderboard has been reset. Data archived.</p>
        </div>
      )}

      {/* Archives section */}
      {showArchives && (
        <div className="space-y-3">
          <h2 className="text-lg font-bold text-white flex items-center gap-2"><Archive size={16} className="text-indigo-400" /> Archived Snapshots</h2>
          {archives.length === 0 ? (
            <p className="text-gray-500 text-sm">No snapshots archived yet.</p>
          ) : (
            archives.map((snap) => (
              <div key={snap.id} className="flex items-center justify-between px-5 py-4 rounded-xl border border-indigo-500/20 bg-gray-900/60">
                <div>
                  <p className="text-white font-semibold text-sm">{snap.date} — {snap.tab === 'credits' ? 'Credits' : 'Learning'} Board</p>
                  <p className="text-xs text-gray-500">{snap.data.length} entries</p>
                </div>
                <button
                  onClick={() => setViewingSnapshot(snap)}
                  className="text-xs px-3 py-1.5 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition"
                >
                  View
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {/* Archive confirm modal */}
      <Modal
        isOpen={archiveConfirm}
        onClose={() => setArchiveConfirm(false)}
        title="Archive & Reset Leaderboard"
        footer={
          <>
            <button onClick={() => setArchiveConfirm(false)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleArchiveAndReset} className="flex-1 rounded-lg bg-amber-600 hover:bg-amber-700 px-4 py-2 font-medium text-white transition">Archive & Reset</button>
          </>
        }
      >
        <p className="text-gray-300 text-sm">
          This will save the current <span className="font-bold text-white">{activeTab === 'credits' ? 'Credits' : 'Learning'} Board</span> as a snapshot, then clear all entries. You can view the snapshot at any time from the Archives section.
        </p>
      </Modal>

      {/* Snapshot viewer modal */}
      <Modal
        isOpen={!!viewingSnapshot}
        onClose={() => setViewingSnapshot(null)}
        title={viewingSnapshot ? `Archive — ${viewingSnapshot.date}` : 'Archive'}
        footer={
          <button onClick={() => setViewingSnapshot(null)} className="w-full rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Close</button>
        }
      >
        {viewingSnapshot && (
          <div className="overflow-x-auto max-h-80">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-indigo-500/20 text-left">
                  <th className="pb-2 text-xs text-gray-500 font-semibold">#</th>
                  <th className="pb-2 text-xs text-gray-500 font-semibold">Student</th>
                  <th className="pb-2 text-xs text-gray-500 font-semibold">{viewingSnapshot.tab === 'credits' ? 'Lifetime Pts' : 'Learning Pts'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-indigo-500/10">
                {snapshotDisplay.map((row) => (
                  <tr key={row.id}>
                    <td className="py-2 text-gray-500">{row.position}</td>
                    <td className="py-2 text-white font-medium">{row.studentName}</td>
                    <td className="py-2 text-indigo-300 font-semibold">
                      {viewingSnapshot.tab === 'credits'
                        ? row.lifetime_points.toLocaleString()
                        : row.learning_points.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Modal>
    </div>
  );
}
