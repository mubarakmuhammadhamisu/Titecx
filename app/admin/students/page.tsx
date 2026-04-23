'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import { mockStudents, mockEnrollments, Student } from '@/components/admin/mock-data';
import { useRouter } from 'next/navigation';
import { User, Trash2, Ban, CheckCircle } from 'lucide-react';

export default function StudentsPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [banFilter, setBanFilter] = useState<'all' | 'active' | 'banned' | 'inactive'>('all');
  const [students, setStudents] = useState<Student[]>(mockStudents);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);
  const [banTarget, setBanTarget] = useState<Student | null>(null);

  // Helper: Check if student is inactive (not logged in for 30+ days OR 0% progress across all courses)
  const isInactiveStudent = (student: Student): boolean => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const lastLoginDate = new Date(student.lastLogin);
    
    // Get enrollments for this student to check progress
    const studentEnrollments = mockEnrollments.filter(e => e.studentId === student.id);
    const hasZeroProgress = studentEnrollments.length > 0 && studentEnrollments.every(e => e.progress === 0);
    
    // Inactive if: (1) no login for 30+ days OR (2) has enrollments but all at 0%
    return lastLoginDate < thirtyDaysAgo || (studentEnrollments.length > 0 && hasZeroProgress);
  };

  const filteredStudents = useMemo(() => {
    return students.filter((student) => {
      const matchesSearch =
        student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        student.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesBan =
        banFilter === 'all' ? true :
        banFilter === 'banned' ? student.isBanned :
        banFilter === 'inactive' ? isInactiveStudent(student) :
        !student.isBanned && !isInactiveStudent(student); // active = not banned AND not inactive
      return matchesSearch && matchesBan;
    });
  }, [students, searchTerm, banFilter]);

  const studentColumns: Column<Student>[] = [
    {
      key: 'name',
      label: 'Student',
      sortable: true,
      render: (value, student) => (
        <div className="flex items-center gap-3">
          <div className="relative h-10 w-10 shrink-0">
            <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/40 to-indigo-500/40 blur-[6px] opacity-70" />
            <div className="relative h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 flex items-center justify-center border border-pink-400/40 ring-2 ring-pink-500/20">
              <User size={18} className="text-indigo-300" />
            </div>
          </div>
          <div>
            <p className="font-medium text-white">{value}</p>
            <p className="text-xs text-gray-500">{student.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'email', label: 'Email', sortable: true },
    {
      key: 'joinDate',
      label: 'Join Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'enrollmentCount',
      label: 'Enrollments',
      sortable: true,
    },
    {
      key: 'amountPaid',
      label: 'Total Paid',
      sortable: true,
      render: (value) => `₦${value.toLocaleString()}`,
    },
    {
      key: 'id',
      label: 'Actions',
      render: (_, student) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setBanTarget(student)}
            className={`flex items-center gap-1 text-xs px-3 py-1 rounded-lg border transition ${
              student.isBanned
                ? 'border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10'
                : 'border-amber-500/30 text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/10'
            }`}
          >
            {student.isBanned ? <><CheckCircle size={13} /> Unban</> : <><Ban size={13} /> Ban</>}
          </button>
          <button
            onClick={() => setDeleteTarget(student)}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 transition"
          >
            <Trash2 size={13} />
            Delete
          </button>
        </div>
      ),
    },
  ];

  const handleDeleteStudent = () => {
    if (!deleteTarget) return;
    setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const handleToggleBan = () => {
    if (!banTarget) return;
    setStudents((prev) =>
      prev.map((s) => s.id === banTarget.id ? { ...s, isBanned: !s.isBanned } : s)
    );
    setBanTarget(null);
  };

  const handleRowClick = (student: Student) => {
    router.push(`/admin/students/${student.id}`);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Students</h1>
        <p className="mt-2 text-gray-400">
          Manage and view student information and enrollment history.
        </p>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        placeholder="Search by name or email..."
      />

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <p className="text-sm text-gray-400">
              Showing {filteredStudents.length} of {students.length} students
            </p>
            {/* Ban status filter pills */}
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'active', 'banned', 'inactive'] as const).map(f => (
                <button
                  key={f}
                  onClick={() => setBanFilter(f)}
                  className={`px-3 py-1 rounded-full text-xs font-medium border transition ${
                    banFilter === f
                      ? f === 'banned'
                        ? 'bg-red-500/20 border-red-500/50 text-red-400'
                        : f === 'inactive'
                          ? 'bg-orange-500/20 border-orange-500/50 text-orange-400'
                          : 'bg-indigo-500/30 border-indigo-500/50 text-indigo-200'
                      : 'bg-gray-800 border-gray-700 text-gray-400 hover:border-indigo-500/30'
                  }`}
                >
                  {f === 'inactive' ? 'Inactive' : f.charAt(0).toUpperCase() + f.slice(1)}
                </button>
              ))}
            </div>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'table'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              Table
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                viewMode === 'grid'
                  ? 'bg-indigo-500/30 text-indigo-200 border border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              Grid
            </button>
          </div>
        </div>

        {viewMode === 'table' ? (
          <AdminTable
            columns={studentColumns}
            data={filteredStudents}
            onRowClick={handleRowClick}
          />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <div
                key={student.id}
                onClick={() => handleRowClick(student)}
                className="group rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md cursor-pointer transition-all duration-300 hover:border-indigo-400/60 hover:shadow-lg hover:shadow-[0_8px_30px_rgba(244,114,182,0.12),0_4px_16px_rgba(99,102,241,0.10)]"
              >
                <div className="flex items-center gap-4 mb-4">
                  <div className="relative h-16 w-16 shrink-0">
                    <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/50 to-indigo-500/40 blur-[8px] opacity-60 group-hover:opacity-90 transition-opacity duration-300" />
                    <div className="relative h-16 w-16 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/30 flex items-center justify-center border-2 border-pink-400/40 ring-2 ring-pink-500/15 group-hover:border-pink-400/70 group-hover:ring-pink-500/35 transition-all duration-300">
                      <User size={28} className="text-indigo-300" />
                    </div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-white truncate">{student.name}</h3>
                    <p className="text-xs text-gray-500 truncate">{student.email}</p>
                  </div>
                </div>

                {student.isBanned && (
                  <div className="mb-3 flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-500/20">
                    <Ban size={13} className="text-red-400" />
                    <span className="text-xs text-red-400 font-medium">Account Banned</span>
                  </div>
                )}

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                    <span className="text-gray-400">Joined</span>
                    <span className="text-gray-200">{new Date(student.joinDate).toLocaleDateString()}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                    <span className="text-gray-400">Enrollments</span>
                    <span className="font-semibold text-indigo-400">{student.enrollmentCount}</span>
                  </div>
                  <div className="flex justify-between items-center p-2 rounded-lg bg-gray-800/30">
                    <span className="text-gray-400">Total Paid</span>
                    <span className="font-semibold text-emerald-400">₦{student.amountPaid.toLocaleString()}</span>
                  </div>
                </div>

                {/* Action buttons — stop propagation so card click (go to detail) doesn't fire */}
                <div className="mt-4 pt-4 border-t border-indigo-500/10 flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() => setBanTarget(student)}
                    className={`flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border transition ${
                      student.isBanned
                        ? 'border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10'
                        : 'border-amber-500/30 text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/10'
                    }`}
                  >
                    {student.isBanned ? <><CheckCircle size={13} /> Unban</> : <><Ban size={13} /> Ban</>}
                  </button>
                  <button
                    onClick={() => setDeleteTarget(student)}
                    className="flex-1 flex items-center justify-center gap-1.5 text-xs py-2 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 transition"
                  >
                    <Trash2 size={13} /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete Student Modal */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Student"
        footer={
          <>
            <button
              onClick={() => setDeleteTarget(null)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteStudent}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition"
            >
              Delete
            </button>
          </>
        }
      >
        <p className="text-gray-300 text-sm">
          Are you sure you want to permanently delete <span className="font-bold text-white">{deleteTarget?.name}</span>? All their data will be removed.
        </p>
      </Modal>

      {/* Ban/Unban Student Modal */}
      <Modal
        isOpen={!!banTarget}
        onClose={() => setBanTarget(null)}
        title={banTarget?.isBanned ? 'Unban Student' : 'Ban Student'}
        footer={
          <>
            <button
              onClick={() => setBanTarget(null)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleToggleBan}
              className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition ${banTarget?.isBanned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}
            >
              {banTarget?.isBanned ? 'Yes, Unban' : 'Yes, Ban'}
            </button>
          </>
        }
      >
        <p className="text-gray-300 text-sm">
          {banTarget?.isBanned
            ? <>Are you sure you want to unban <span className="font-bold text-white">{banTarget?.name}</span>? They will regain access to the platform.</>
            : <>Are you sure you want to ban <span className="font-bold text-white">{banTarget?.name}</span>? They will lose access to the platform immediately.</>
          }
        </p>
      </Modal>
    </div>
  );
}
