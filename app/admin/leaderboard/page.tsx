'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import { mockLeaderboard, Leaderboard } from '@/components/admin/mock-data';
import { RotateCcw, Trophy } from 'lucide-react';

export default function LeaderboardPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);

  const filteredLeaderboard = useMemo(() => {
    return mockLeaderboard.filter((entry) =>
      entry.studentName.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm]);

  const handleResetLeaderboard = () => {
    alert('Leaderboard reset! (Mock: data not actually cleared)');
    setIsResetModalOpen(false);
  };

  const leaderboardColumns: Column<Leaderboard>[] = [
    {
      key: 'position',
      label: 'Position',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <Trophy
            size={16}
            className={
              value === 1
                ? 'text-yellow-400'
                : value === 2
                  ? 'text-gray-400'
                  : value === 3
                    ? 'text-orange-400'
                    : 'text-gray-500'
            }
          />
          <span className="font-bold">
            {value === 1 ? '🥇' : value === 2 ? '🥈' : value === 3 ? '🥉' : `#${value}`}
          </span>
        </div>
      ),
    },
    { key: 'studentName', label: 'Student', sortable: true },
    {
      key: 'points',
      label: 'Points',
      sortable: true,
      render: (value) => (
        <span className="font-bold text-indigo-400">{value}</span>
      ),
    },
    {
      key: 'coursesCompleted',
      label: 'Courses Completed',
      sortable: true,
      render: (value) => (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-purple-500/10 text-purple-400">
          {value} {value === 1 ? 'Course' : 'Courses'}
        </span>
      ),
    },
  ];

  const topStudent = filteredLeaderboard[0];
  const totalPoints = filteredLeaderboard.reduce((sum, entry) => sum + entry.points, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Leaderboard</h1>
          <p className="mt-2 text-gray-400">
            Track student achievements and performance rankings.
          </p>
        </div>
        <button
          onClick={() => setIsResetModalOpen(true)}
          className="flex items-center gap-2 rounded-lg border border-red-500/40 bg-gradient-to-br from-red-500/20 to-red-600/10 px-4 py-2 font-medium text-red-300 hover:border-red-500/70 hover:from-red-500/30 hover:to-red-600/20 transition-all duration-300"
        >
          <RotateCcw size={18} />
          Reset Monthly
        </button>
      </div>

      {/* Top Performer */}
      {topStudent && (
        <div className="relative overflow-hidden rounded-xl border border-yellow-500/30 bg-gradient-to-r from-yellow-500/10 to-amber-500/5 p-6 backdrop-blur-md shadow-lg shadow-yellow-500/10">
          <div className="absolute inset-0 bg-gradient-to-r from-yellow-500/5 to-transparent pointer-events-none" />
          <div className="relative flex items-center justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-yellow-400">🏆 Top Performer This Month</p>
              <p className="mt-3 text-3xl font-bold text-white">
                {topStudent.studentName}
              </p>
              <p className="mt-1 text-lg font-bold text-yellow-400">
                {topStudent.points} points
              </p>
              <p className="mt-1 text-sm text-gray-400">
                {topStudent.coursesCompleted} course{topStudent.coursesCompleted !== 1 ? 's' : ''} completed
              </p>
            </div>
            <div className="text-7xl drop-shadow-lg">🥇</div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md shadow-lg shadow-indigo-500/10">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Students</p>
          <p className="mt-3 text-4xl font-bold text-indigo-400">
            {filteredLeaderboard.length}
          </p>
        </div>
        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md shadow-lg shadow-purple-500/10">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Points Awarded</p>
          <p className="mt-3 text-4xl font-bold text-purple-400">{totalPoints}</p>
        </div>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by student name..."
      />

      <div className="space-y-4">
        <p className="text-sm text-gray-400">
          Showing {filteredLeaderboard.length} of {mockLeaderboard.length} students
        </p>
        <AdminTable columns={leaderboardColumns} data={filteredLeaderboard} />
      </div>

      {/* Reset Modal */}
      <Modal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        title="Reset Monthly Leaderboard"
        footer={
          <>
            <button
              onClick={() => setIsResetModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleResetLeaderboard}
              className="flex-1 rounded-lg bg-red-500 px-4 py-2 font-medium text-white hover:bg-red-600 transition"
            >
              Reset
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-gray-300">
            Are you sure you want to reset the monthly leaderboard? All student points
            will be cleared for the new month.
          </p>
          <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-3">
            <p className="text-sm text-yellow-400">
              This action cannot be undone. Archive current scores if needed.
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
}
