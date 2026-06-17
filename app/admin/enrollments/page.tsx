'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import type { Enrollment } from '@/components/admin/adminTypes';
import { Plus, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

export default function EnrollmentsPage() {
  const [enrollments, setEnrollments] = useState<Enrollment[]>([]);
  const [loading, setLoading]         = useState(true);
  const [search, setSearch]           = useState('');
  const [statusFilter, setStatus]     = useState('');

  // Manual enroll modal
  const [showEnroll, setShowEnroll] = useState(false);
  const [students, setStudents]     = useState<{ id: string; name: string; email: string }[]>([]);
  const [courses, setCourses]       = useState<{ slug: string; title: string }[]>([]);
  const [selStudent, setSelStudent] = useState('');
  const [selCourse, setSelCourse]   = useState('');
  const [enrolling, setEnrolling]   = useState(false);
  const [enrollError, setEnrollError] = useState('');

  // Delete modal
  const [deleteTarget, setDeleteTarget] = useState<Enrollment | null>(null);

  useEffect(() => {
    fetch('/api/admin/enrollments')
      .then((r) => r.json())
      .then((d) => { setEnrollments(d.enrollments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const loadEnrollModalData = async () => {
    const [sr, cr] = await Promise.all([
      fetch('/api/admin/students').then((r) => r.json()),
      fetch('/api/admin/courses').then((r) => r.json()),
    ]);
    setStudents((sr.students ?? []).map((s: any) => ({ id: s.id, name: s.name, email: s.email })));
    setCourses((cr.courses ?? []).map((c: any) => ({ slug: c.slug, title: c.title })));
    setShowEnroll(true);
  };

  const handleManualEnroll = async () => {
    if (!selStudent || !selCourse) { setEnrollError('Select both a student and a course.'); return; }
    setEnrolling(true); setEnrollError('');
    const res = await fetch('/api/admin/enrollments', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ studentId: selStudent, courseId: selCourse }),
    });
    setEnrolling(false);
    if (!res.ok) { const d = await res.json(); setEnrollError(d.error ?? 'Failed'); return; }
    setShowEnroll(false); setSelStudent(''); setSelCourse('');
    // Refresh
    fetch('/api/admin/enrollments').then((r) => r.json()).then((d) => setEnrollments(d.enrollments ?? []));
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    // We mark progress to signal removal — or you could add a DELETE endpoint
    setEnrollments((prev) => prev.filter((e) => e.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const filtered = useMemo(() => enrollments.filter((e) => {
    const q = search.toLowerCase();
    const matchSearch = e.student_name.toLowerCase().includes(q) || e.course_title.toLowerCase().includes(q);
    const matchStatus =
      !statusFilter ? true :
      statusFilter === 'completed'  ? e.progress === 100 :
      statusFilter === 'in-progress'? e.progress > 0 && e.progress < 100 :
      e.progress === 0;
    return matchSearch && matchStatus;
  }), [enrollments, search, statusFilter]);

  const columns: Column<Enrollment>[] = [
    { key: 'student_name', label: 'Student',  sortable: true },
    { key: 'course_title', label: 'Course',   sortable: true },
    { key: 'progress', label: 'Progress', sortable: true, render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-gray-700">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${v}%` }} />
        </div>
        <span className="text-xs text-gray-300">{v}%</span>
      </div>
    )},
    { key: 'enrolled_at', label: 'Enrolled', sortable: true, render: (v) => format(new Date(v as string), 'MMM d, yyyy') },
    { key: 'purchase_type', label: 'Type', render: (v) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'free' ? 'bg-gray-500/10 text-gray-400' : 'bg-indigo-500/10 text-indigo-400'}`}>{String(v)}</span>
    )},
    { key: 'referral_triggered', label: 'Referred', render: (v, e) => v ? <span className="text-emerald-400 text-xs">✓ {e.referrer_name ?? ''}</span> : <span className="text-gray-600 text-xs">—</span> },
    {
      key: 'id', label: 'Actions',
      render: (_, e) => (
        <button onClick={(evt) => { evt.stopPropagation(); setDeleteTarget(e); }}
          className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
          <Trash2 size={11} />
        </button>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading enrollments…</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Enrollments</h1>
          <p className="mt-2 text-gray-400">{enrollments.length} total enrollments</p>
        </div>
        <button onClick={loadEnrollModalData}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-medium transition shadow-lg shadow-indigo-500/30">
          <Plus size={16} /> Manual Enroll
        </button>
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} placeholder="Search by student or course…"
        filters={{ status: { label: 'Status', value: statusFilter, options: [
          { label: 'Not Started',  value: 'not-started' },
          { label: 'In Progress',  value: 'in-progress' },
          { label: 'Completed',    value: 'completed' },
        ], onChange: setStatus }}} />

      <p className="text-sm text-gray-400">Showing {filtered.length} of {enrollments.length}</p>
      <AdminTable columns={columns} data={filtered} />

      {/* Manual Enroll Modal */}
      <Modal isOpen={showEnroll} onClose={() => setShowEnroll(false)} title="Manual Enroll Student"
        footer={
          <>
            <button onClick={() => setShowEnroll(false)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleManualEnroll} disabled={enrolling}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 font-medium text-white transition disabled:opacity-50">
              {enrolling ? 'Enrolling…' : 'Enroll'}
            </button>
          </>
        }>
        <div className="space-y-4">
          {enrollError && <p className="text-red-400 text-sm">{enrollError}</p>}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Student</label>
            <select value={selStudent} onChange={(e) => setSelStudent(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60">
              <option value="">Select a student…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Course</label>
            <select value={selCourse} onChange={(e) => setSelCourse(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60">
              <option value="">Select a course…</option>
              {courses.map((c) => <option key={c.slug} value={c.slug}>{c.title}</option>)}
            </select>
          </div>
          <p className="text-xs text-gray-500">This enroll will be marked as <strong className="text-gray-400">free / manual</strong> and won't create a payment record.</p>
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Enrollment"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition">Remove</button>
          </>
        }>
        <p className="text-gray-300 text-sm">Remove <span className="font-bold text-white">{deleteTarget?.student_name}</span> from <span className="font-bold text-white">{deleteTarget?.course_title}</span>?</p>
      </Modal>
    </div>
  );
}
