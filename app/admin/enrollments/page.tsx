'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { mockEnrollments, mockCourses, Enrollment } from '@/components/admin/mock-data';
import { Download } from 'lucide-react';

export default function EnrollmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');

  const filteredEnrollments = useMemo(() => {
    return mockEnrollments.filter((enrollment) => {
      const matchesSearch =
        enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === '' || enrollment.status === statusFilter;
      const matchesCourse = courseFilter === '' || enrollment.courseId === courseFilter;
      const matchesPayment =
        paymentFilter === '' || enrollment.paymentType === paymentFilter;
      return matchesSearch && matchesStatus && matchesCourse && matchesPayment;
    });
  }, [searchTerm, statusFilter, courseFilter, paymentFilter]);

  const enrollmentColumns: Column<Enrollment>[] = [
    { key: 'studentName', label: 'Student', sortable: true },
    { key: 'courseName', label: 'Course', sortable: true },
    {
      key: 'dateEnrolled',
      label: 'Enrolled Date',
      sortable: true,
      render: (value) => new Date(value).toLocaleDateString(),
    },
    {
      key: 'progress',
      label: 'Progress',
      sortable: true,
      render: (value) => (
        <div className="flex items-center gap-2">
          <div className="w-20 h-2 rounded-full bg-gray-700">
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
      sortable: true,
      render: (value) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            value === 'completed'
              ? 'bg-green-500/10 text-green-400'
              : value === 'in-progress'
                ? 'bg-blue-500/10 text-blue-400'
                : 'bg-red-500/10 text-red-400'
          }`}
        >
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
    {
      key: 'paymentType',
      label: 'Payment',
      render: (value) => (
        <span
          className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
            value === 'paid'
              ? 'bg-purple-500/10 text-purple-400'
              : 'bg-gray-500/10 text-gray-400'
          }`}
        >
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
  ];

  const handleExportCSV = () => {
    const headers = ['Student', 'Course', 'Enrolled Date', 'Progress', 'Status', 'Payment Type'];
    const rows = filteredEnrollments.map((e) => [
      e.studentName,
      e.courseName,
      new Date(e.dateEnrolled).toLocaleDateString(),
      `${e.progress}%`,
      e.status,
      e.paymentType,
    ]);

    const csv = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(',')),
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `enrollments-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Enrollments</h1>
        <p className="mt-2 text-gray-400">
          View and manage student course enrollments.
        </p>
      </div>

      <FilterBar
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
        filters={{
          status: {
            label: 'Status',
            value: statusFilter,
            options: [
              { label: 'In Progress', value: 'in-progress' },
              { label: 'Completed', value: 'completed' },
              { label: 'Dropped', value: 'dropped' },
            ],
            onChange: setStatusFilter,
          },
          course: {
            label: 'Course',
            value: courseFilter,
            options: mockCourses.map((c) => ({
              label: c.title,
              value: c.id,
            })),
            onChange: setCourseFilter,
          },
          payment: {
            label: 'Payment Type',
            value: paymentFilter,
            options: [
              { label: 'Paid', value: 'paid' },
              { label: 'Free', value: 'free' },
            ],
            onChange: setPaymentFilter,
          },
        }}
        placeholder="Search by student or course name..."
      />

      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-400">
          Showing {filteredEnrollments.length} of {mockEnrollments.length}{' '}
          enrollments
        </p>
        <button
          onClick={handleExportCSV}
          className="flex items-center gap-2 rounded-lg border border-indigo-500/30 bg-indigo-500/10 px-4 py-2 text-sm font-medium text-indigo-400 hover:border-indigo-500/60 hover:bg-indigo-500/20 transition"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      <AdminTable columns={enrollmentColumns} data={filteredEnrollments} />
    </div>
  );
}
