'use client';

import React from 'react';
import { useRouter, useParams } from 'next/navigation';
import { ArrowLeft, Mail, Calendar, Award } from 'lucide-react';
import {
  mockStudents,
  mockEnrollments,
  mockPayments,
  Enrollment,
  Payment,
} from '@/components/admin/mock-data';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { format } from 'date-fns';

export default function StudentDetailPage() {
  const router = useRouter();
  const params = useParams();
  const studentId = params.id as string;

  const student = mockStudents.find((s) => s.id === studentId);
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
      <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-8 backdrop-blur-sm">
        <div className="space-y-6">
          <div>
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
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="rounded-lg bg-gray-800/50 p-4">
              <p className="text-sm text-gray-400">Total Spent</p>
              <p className="mt-1 text-2xl font-bold text-indigo-400">
                ₦{totalSpent.toLocaleString()}
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/50 p-4">
              <p className="text-sm text-gray-400">Active Enrollments</p>
              <p className="mt-1 text-2xl font-bold text-purple-400">
                {studentEnrollments.filter((e) => e.status === 'in-progress').length}
              </p>
            </div>
            <div className="rounded-lg bg-gray-800/50 p-4">
              <p className="text-sm text-gray-400">Referrals</p>
              <p className="mt-1 text-2xl font-bold text-green-400">
                {student.referralCount}
              </p>
            </div>
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
    </div>
  );
}
