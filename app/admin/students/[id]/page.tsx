'use client';

import React, { useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Award, Ban, CheckCircle, Trash2, Zap, BookOpen, GitBranch, Coins } from 'lucide-react';
import {
  mockStudents,
  mockEnrollments,
  mockPayments,
  Enrollment,
  Payment,
  Student,
} from '@/components/admin/mock-data';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { Modal } from '@/components/admin/shared/Modal';
import { format } from 'date-fns';
import Link from 'next/link';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const [student, setStudent] = useState<Student | null>(
    mockStudents.find((s) => s.id === studentId) ?? null
  );
  const [banTarget, setBanTarget] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  const handleToggleBan = () => {
    setStudent(prev => prev ? { ...prev, isBanned: !prev.isBanned } : null);
    setBanTarget(false);
  };

  const handleDelete = () => {
    router.replace('/admin/students');
  };

  const studentEnrollments = mockEnrollments.filter(
    (e) => e.studentId === studentId
  );
  const studentPayments = mockPayments.filter((p) => p.studentId === studentId);

  if (!student) {
    return (
      <div className="space-y-6">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300"
        >
          <ArrowLeft size={18} />
          Back
        </button>
        <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-6">
          <p className="text-red-400">Student not found</p>
        </div>
      </div>
    );
  }

  const enrollmentColumns: Column<Enrollment>[] = [
    { key: 'courseName', label: 'Course', sortable: true },
    {
      key: 'dateEnrolled',
      label: 'Enrolled',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM d, yyyy'),
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-24 h-2 rounded-full bg-gray-700">
            <div
              className="h-full rounded-full bg-indigo-500"
              style={{ width: `${value}%` }}
            />
          </div>
          <span className="text-xs">{value}%</span>
        </div>
      ),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            value === 'completed'
              ? 'bg-green-500/10 text-green-400'
              : value === 'in-progress'
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-gray-500/10 text-gray-400'
          }`}
        >
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
  ];

  const paymentColumns: Column<Payment>[] = [
    { key: 'courseName', label: 'Course', sortable: true },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => `₦${value.toLocaleString()}`,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM d, yyyy'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="inline-block px-3 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400">
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
  ];

  const totalSpent = studentPayments.reduce((sum, p) => sum + p.amount, 0);
  const completedCourses = studentEnrollments.filter(
    (e) => e.status === 'completed'
  ).length;

  return (
    <div className="space-y-8">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition"
      >
        <ArrowLeft size={18} />
        Back to Students
      </button>

      {/* Student Header */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-8 backdrop-blur-md shadow-lg shadow-indigo-500/10">
        <div className="space-y-6">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Profile Picture */}
            <div className="relative h-32 w-32 shrink-0">
              {/* Glow halo */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-pink-500/50 to-indigo-500/40 blur-[12px] opacity-60" />
              {/* Circle avatar */}
              <div className="relative h-32 w-32 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/30 flex items-center justify-center border-2 border-pink-400/40 ring-2 ring-pink-500/20 overflow-hidden">
                {/* Show initials — when backend is connected, swap this for a real avatar_url */}
                <span className="text-4xl font-bold text-white">
                  {student.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
                </span>
              </div>
            </div>

            {/* Student Info */}
            <div className="flex-1">
              {student.isBanned && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 mb-4">
                  <Ban size={14} className="text-red-400" />
                  <span className="text-sm text-red-400 font-medium">This account is currently banned</span>
                </div>
              )}
              <h1 className="text-4xl font-bold text-white">{student.name}</h1>
              <div className="mt-4 flex flex-wrap gap-4 text-gray-400">
                <div className="flex items-center gap-2">
                  <Mail size={18} className="text-indigo-400" />
                  <span>{student.email}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Calendar size={18} className="text-indigo-400" />
                  <span>
                    Joined {format(new Date(student.joinDate), 'MMMM d, yyyy')}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Award size={18} className="text-indigo-400" />
                  <span>{completedCourses} courses completed</span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => setBanTarget(true)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-medium transition ${
                    student.isBanned
                      ? 'border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10'
                      : 'border-amber-500/30 text-amber-400 hover:border-amber-500/60 hover:bg-amber-500/10'
                  }`}
                >
                  {student.isBanned ? <><CheckCircle size={15} /> Unban Student</> : <><Ban size={15} /> Ban Student</>}
                </button>
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 text-sm font-medium transition"
                >
                  <Trash2 size={15} /> Delete Student
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-xl bg-gradient-to-br from-indigo-500/10 to-indigo-600/5 border border-indigo-500/20 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Spent</p>
              <p className="mt-2 text-3xl font-bold text-indigo-400">
                ₦{totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Active Enrollments</p>
              <p className="mt-2 text-3xl font-bold text-purple-400">
                {studentEnrollments.filter((e) => e.status === 'in-progress').length}
              </p>
            </div>
            <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4">
              <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Referrals</p>
              <p className="mt-2 text-3xl font-bold text-emerald-400">
                {student.referralCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Points & Referrals Panel */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md shadow-lg shadow-indigo-500/10">
        <h2 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <Coins size={18} className="text-indigo-400" /> Points &amp; Referrals
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Credit summary */}
          <div className="rounded-xl bg-gradient-to-br from-amber-500/10 to-amber-600/5 border border-amber-500/20 p-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-1.5"><Zap size={12} className="text-yellow-400" /> Credits</p>
            <div>
              <p className="text-xs text-gray-500">Spendable Balance</p>
              <p className="text-2xl font-bold text-amber-400">₦{student.credit_balance.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-xs text-gray-500">Lifetime Points Earned</p>
              <p className="text-lg font-bold text-white">{student.lifetime_points.toLocaleString()}</p>
            </div>
            <Link
              href={`/admin/points`}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              View full transaction log →
            </Link>
          </div>

          {/* Learning summary */}
          <div className="rounded-xl bg-gradient-to-br from-emerald-500/10 to-emerald-600/5 border border-emerald-500/20 p-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-1.5"><BookOpen size={12} className="text-emerald-400" /> Learning</p>
            <div>
              <p className="text-xs text-gray-500">Learning Points (derived)</p>
              <p className="text-2xl font-bold text-emerald-400">
                {studentEnrollments.reduce((sum, e) => sum + (e.progress === 100 ? 800 : e.progress > 0 ? 200 : 0), 0).toLocaleString()}
              </p>
            </div>
            <p className="text-xs text-gray-600">
              {studentEnrollments.filter((e) => e.progress === 100).length} completed × 800
              {' + '}
              {studentEnrollments.filter((e) => e.progress > 0 && e.progress < 100).length} in-progress × 200
            </p>
            <p className="text-xs text-gray-600">Score never stored — derived at runtime.</p>
          </div>

          {/* Referral summary */}
          <div className="rounded-xl bg-gradient-to-br from-purple-500/10 to-purple-600/5 border border-purple-500/20 p-4 space-y-3">
            <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold flex items-center gap-1.5"><GitBranch size={12} className="text-purple-400" /> Referrals</p>
            <div className="space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Sent</span>
                <span className="text-white font-semibold">{student.referrals_sent}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Converted</span>
                <span className="text-emerald-400 font-semibold">{student.referrals_converted}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Total Commission</span>
                <span className="text-amber-400 font-semibold">₦{student.total_commission_earned.toLocaleString()}</span>
              </div>
            </div>
            <Link
              href={`/admin/referrals`}
              className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 transition"
            >
              View referral records →
            </Link>
          </div>
        </div>
      </div>

      {/* Enrollments */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Enrollments</h2>
        {studentEnrollments.length > 0 ? (
          <AdminTable columns={enrollmentColumns} data={studentEnrollments} />
        ) : (
          <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-6 text-center">
            <p className="text-gray-400">No enrollments yet</p>
          </div>
        )}
      </div>

      {/* Payment History */}
      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white">Payment History</h2>
        {studentPayments.length > 0 ? (
          <AdminTable columns={paymentColumns} data={studentPayments} />
        ) : (
          <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-6 text-center">
            <p className="text-gray-400">No payments</p>
          </div>
        )}
      </div>

      {/* Ban Modal */}
      {student && (
        <Modal
          isOpen={banTarget}
          onClose={() => setBanTarget(false)}
          title={student.isBanned ? 'Unban Student' : 'Ban Student'}
          footer={
            <>
              <button onClick={() => setBanTarget(false)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleToggleBan} className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition ${student.isBanned ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
                {student.isBanned ? 'Yes, Unban' : 'Yes, Ban'}
              </button>
            </>
          }
        >
          <p className="text-gray-300 text-sm">
            {student.isBanned
              ? <>Unban <span className="font-bold text-white">{student.name}</span>? They will regain platform access.</>
              : <>Ban <span className="font-bold text-white">{student.name}</span>? They will lose platform access immediately.</>
            }
          </p>
        </Modal>
      )}

      {/* Delete Modal */}
      {student && (
        <Modal
          isOpen={deleteConfirm}
          onClose={() => setDeleteConfirm(false)}
          title="Delete Student"
          footer={
            <>
              <button onClick={() => setDeleteConfirm(false)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
              <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition">Delete</button>
            </>
          }
        >
          <p className="text-gray-300 text-sm">
            Permanently delete <span className="font-bold text-white">{student.name}</span>? All their data will be removed.
          </p>
        </Modal>
      )}
    </div>
  );
}
