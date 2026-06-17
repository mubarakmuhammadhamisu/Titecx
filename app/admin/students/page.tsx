'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import type { Student } from '@/components/admin/adminTypes';
import { User, Ban, CheckCircle, Trash2 } from 'lucide-react';

function fmt(kobo: number) { return `₦${(kobo / 100).toLocaleString()}`; }

export default function StudentsPage() {
  const router = useRouter();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [banTarget, setBanTarget]   = useState<Student | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Student | null>(null);

  useEffect(() => {
    fetch('/api/admin/students')
      .then((r) => r.json())
      .then((d) => { setStudents(d.students ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const isInactive = (s: Student) => {
    if (!s.last_login_at) return true;
    const ago30 = new Date(); ago30.setDate(ago30.getDate() - 30);
    return new Date(s.last_login_at) < ago30;
  };

  const filtered = useMemo(() => students.filter((s) => {
    const matchSearch = s.name.toLowerCase().includes(search.toLowerCase()) ||
                        s.email.toLowerCase().includes(search.toLowerCase());
    const matchStatus =
      statusFilter === ''         ? true :
      statusFilter === 'banned'   ? s.is_banned :
      statusFilter === 'inactive' ? (!s.is_banned && isInactive(s)) :
      !s.is_banned && !isInactive(s);
    return matchSearch && matchStatus;
  }), [students, search, statusFilter]);

  const handleBanToggle = async () => {
    if (!banTarget) return;
    const res = await fetch(`/api/admin/students/${banTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ is_banned: !banTarget.is_banned }),
    });
    if (res.ok) {
      setStudents((prev) => prev.map((s) => s.id === banTarget.id ? { ...s, is_banned: !s.is_banned } : s));
    }
    setBanTarget(null);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/students/${deleteTarget.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ role: 'deleted' }),
    });
    setStudents((prev) => prev.filter((s) => s.id !== deleteTarget.id));
    setDeleteTarget(null);
  };

  const columns: Column<Student>[] = [
    {
      key: 'name', label: 'Student', sortable: true,
      render: (v, s) => (
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <User size={16} className="text-indigo-300" />
          </div>
          <div>
            <p className="font-medium text-white text-sm">{String(v)}</p>
            <p className="text-xs text-gray-500">{s.email}</p>
          </div>
        </div>
      ),
    },
    { key: 'created_at', label: 'Joined', sortable: true, render: (v) => new Date(v as string).toLocaleDateString() },
    { key: 'enrollment_count', label: 'Courses', sortable: true },
    { key: 'total_paid_kobo',  label: 'Total Paid', sortable: true, render: (v) => fmt(Number(v)) },
    { key: 'credit_balance',   label: 'Credits',    sortable: true, render: (v) => `₦${Number(v).toLocaleString()}` },
    {
      key: 'is_banned', label: 'Status',
      render: (v, s) => (
        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold
          ${s.is_banned ? 'bg-red-500/10 text-red-400 border border-red-500/20'
          : isInactive(s) ? 'bg-gray-500/10 text-gray-400 border border-gray-500/20'
          : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
          {s.is_banned ? 'Banned' : isInactive(s) ? 'Inactive' : 'Active'}
        </span>
      ),
    },
    {
      key: 'id', label: 'Actions',
      render: (_, s) => (
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); setBanTarget(s); }}
            className={`flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border transition
              ${s.is_banned
                ? 'border-green-500/30 text-green-400 hover:bg-green-500/10'
                : 'border-amber-500/30 text-amber-400 hover:bg-amber-500/10'}`}
          >
            {s.is_banned ? <><CheckCircle size={12} /> Unban</> : <><Ban size={12} /> Ban</>}
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setDeleteTarget(s); }}
            className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 transition"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ),
    },
  ];

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-400 text-sm animate-pulse">Loading students…</div>
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Students</h1>
        <p className="mt-2 text-gray-400">{students.length} total students</p>
      </div>

      <FilterBar
        searchValue={search} onSearchChange={setSearch}
        placeholder="Search by name or email…"
        filters={{
          status: {
            label: 'Status', value: statusFilter,
            options: [
              { label: 'Active',   value: 'active' },
              { label: 'Inactive', value: 'inactive' },
              { label: 'Banned',   value: 'banned' },
            ],
            onChange: setStatusFilter,
          },
        }}
      />

      <p className="text-sm text-gray-400">Showing {filtered.length} of {students.length}</p>
      <AdminTable columns={columns} data={filtered} onRowClick={(s) => router.push(`/admin/students/${s.id}`)} />

      <Modal isOpen={!!banTarget} onClose={() => setBanTarget(null)} title={banTarget?.is_banned ? 'Unban Student' : 'Ban Student'}
        footer={
          <>
            <button onClick={() => setBanTarget(null)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleBanToggle} className={`flex-1 rounded-lg px-4 py-2 font-medium text-white transition ${banTarget?.is_banned ? 'bg-green-600 hover:bg-green-700' : 'bg-amber-600 hover:bg-amber-700'}`}>
              {banTarget?.is_banned ? 'Unban' : 'Ban'}
            </button>
          </>
        }>
        <p className="text-gray-300 text-sm">
          {banTarget?.is_banned
            ? `Unban ${banTarget?.name}? They will regain access to the platform.`
            : `Ban ${banTarget?.name}? They will lose access to the platform.`}
        </p>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDeleteTarget(null)} title="Remove Student"
        footer={
          <>
            <button onClick={() => setDeleteTarget(null)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition">Remove</button>
          </>
        }>
        <p className="text-gray-300 text-sm">Remove <span className="font-bold text-white">{deleteTarget?.name}</span>? This marks the account as deleted.</p>
      </Modal>
    </div>
  );
}
