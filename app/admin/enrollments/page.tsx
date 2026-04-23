'use client';

import React, { useState, useMemo } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import { mockEnrollments, mockCourses, mockStudents, Enrollment, Student } from '@/components/admin/mock-data';
import { Download, Trash2, UserPlus, CheckCircle } from 'lucide-react';

export default function EnrollmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [courseFilter, setCourseFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [enrollments, setEnrollments] = useState<Enrollment[]>(mockEnrollments);
  const [removeTarget, setRemoveTarget] = useState<Enrollment | null>(null);
  const [isEnrollModalOpen, setIsEnrollModalOpen] = useState(false);
  const [enrollForm, setEnrollForm] = useState({ studentId: '', courseId: '' });

  const filteredEnrollments = useMemo(() => {
    return enrollments.filter((enrollment) => {
      const matchesSearch =
        enrollment.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        enrollment.courseName.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === '' || enrollment.status === statusFilter;
      const matchesCourse = courseFilter === '' || enrollment.courseId === courseFilter;
      const matchesPayment =
        paymentFilter === '' || enrollment.paymentType === paymentFilter;
      return matchesSearch && matchesStatus && matchesCourse && matchesPayment;
    });
  }, [enrollments, searchTerm, statusFilter, courseFilter, paymentFilter]);

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
    {
      key: 'id',
      label: 'Actions',
      render: (_, enrollment) => (
        <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
          {enrollment.status !== 'completed' && (
            <button
              onClick={() => handleMarkComplete(enrollment.id)}
              className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-emerald-500/30 text-emerald-400 hover:border-emerald-500/60 hover:bg-emerald-500/10 transition"
            >
              <CheckCircle size={13} /> Complete
            </button>
          )}
          <button
            onClick={() => setRemoveTarget(enrollment)}
            className="flex items-center gap-1 text-xs px-3 py-1 rounded-lg border border-red-500/30 text-red-400 hover:border-red-500/60 hover:bg-red-500/10 transition"
          >
            <Trash2 size={13} /> Remove
          </button>
        </div>
      ),
    },
  ];

  const handleMarkComplete = (enrollmentId: string) => {
    setEnrollments(prev => prev.map(e =>
      e.id === enrollmentId
        ? { ...e, status: 'completed', progress: 100, completionDate: new Date().toISOString().split('T')[0] }
        : e
    ));
  };

  const handleRemoveEnrollment = () => {
    if (!removeTarget) return;
    setEnrollments((prev) => prev.filter((e) => e.id !== removeTarget.id));
    setRemoveTarget(null);
  };

  const handleManualEnroll = () => {
    if (!enrollForm.studentId || !enrollForm.courseId) return;
    const student = mockStudents.find((s) => s.id === enrollForm.studentId);
    const course = mockCourses.find((c) => c.id === enrollForm.courseId);
    if (!student || !course) return;
    const newEnrollment: Enrollment = {
      id: `manual-${Date.now()}`,
      studentId: student.id,
      studentName: student.name,
      courseId: course.id,
      courseName: course.title,
      dateEnrolled: new Date().toISOString().split('T')[0],
      progress: 0,
      paymentType: 'free',
      status: 'in-progress',
    };
    setEnrollments((prev) => [newEnrollment, ...prev]);
    setEnrollForm({ studentId: '', courseId: '' });
    setIsEnrollModalOpen(false);
  };

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
          Showing {filteredEnrollments.length} of {enrollments.length}{' '}
          enrollments
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => setIsEnrollModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 text-sm font-medium text-white hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-500/30"
          >
            <UserPlus size={16} />
            Enroll Student
          </button>
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 rounded-lg border border-indigo-500/40 bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 px-4 py-2 text-sm font-medium text-indigo-300 hover:border-indigo-500/70 hover:from-indigo-500/30 hover:to-indigo-600/20 transition-all duration-300"
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
      </div>

      <AdminTable columns={enrollmentColumns} data={filteredEnrollments} />

      {/* Remove Enrollment Modal */}
      <Modal
        isOpen={!!removeTarget}
        onClose={() => setRemoveTarget(null)}
        title="Remove Enrollment"
        footer={
          <>
            <button
              onClick={() => setRemoveTarget(null)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleRemoveEnrollment}
              className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition"
            >
              Remove
            </button>
          </>
        }
      >
        <p className="text-gray-300 text-sm">
          Remove <span className="font-bold text-white">{removeTarget?.studentName}</span> from <span className="font-bold text-white">{removeTarget?.courseName}</span>? Their progress will be lost.
        </p>
      </Modal>

      {/* Enroll Student Modal */}
      <Modal
        isOpen={isEnrollModalOpen}
        onClose={() => setIsEnrollModalOpen(false)}
        title="Manually Enroll Student"
        footer={
          <>
            <button
              onClick={() => setIsEnrollModalOpen(false)}
              className="flex-1 rounded-lg border border-gray-600 px-4 py-2 font-medium text-gray-300 hover:bg-gray-800 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleManualEnroll}
              disabled={!enrollForm.studentId || !enrollForm.courseId}
              className="flex-1 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-4 py-2 font-medium text-white hover:from-indigo-600 hover:to-indigo-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Enroll
            </button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Student</label>
            <select
              value={enrollForm.studentId}
              onChange={(e) => setEnrollForm({ ...enrollForm, studentId: e.target.value })}
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white outline-none focus:border-indigo-500/60"
            >
              <option value="">Select a student...</option>
              {mockStudents.map((s) => (
                <option key={s.id} value={s.id}>{s.name} — {s.email}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-2">Course</label>
            <select
              value={enrollForm.courseId}
              onChange={(e) => setEnrollForm({ ...enrollForm, courseId: e.target.value })}
              className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white outline-none focus:border-indigo-500/60"
            >
              <option value="">Select a course...</option>
              {mockCourses.map((c) => (
                <option key={c.id} value={c.id}>{c.title}</option>
              ))}
            </select>
          </div>
          <p className="text-xs text-gray-500">This enrollment will be marked as free and start at 0% progress.</p>
        </div>
      </Modal>
    </div>
  );
}
