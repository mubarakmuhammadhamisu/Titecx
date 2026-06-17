'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { Modal } from '@/components/admin/shared/Modal';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import type { MysteryBoxRequest, MysteryBoxStatus } from '@/components/admin/adminTypes';
import { Package, Truck, CheckCircle, Clock, X } from 'lucide-react';
import { format } from 'date-fns';

const STATUS_CONFIG: Record<MysteryBoxStatus, { label: string; color: string; icon: React.ReactNode }> = {
  pending:    { label: 'Pending',    color: 'text-amber-400  border-amber-500/20  bg-amber-500/10',  icon: <Clock size={11} /> },
  processing: { label: 'Processing', color: 'text-indigo-400 border-indigo-500/20 bg-indigo-500/10', icon: <Package size={11} /> },
  shipped:    { label: 'Shipped',    color: 'text-blue-400   border-blue-500/20   bg-blue-500/10',   icon: <Truck size={11} /> },
  delivered:  { label: 'Delivered',  color: 'text-emerald-400 border-emerald-500/20 bg-emerald-500/10', icon: <CheckCircle size={11} /> },
  forfeited:  { label: 'Forfeited', color: 'text-gray-500   border-gray-600/20   bg-gray-700/20',   icon: <X size={11} /> },
};

const inp = 'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 transition';

export default function MysteryBoxPage() {
  const [requests, setRequests]   = useState<MysteryBoxRequest[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');
  const [selected, setSelected]   = useState<MysteryBoxRequest | null>(null);
  const [saving, setSaving]       = useState(false);

  const [editForm, setEditForm] = useState({
    status: '' as MysteryBoxStatus,
    tracking_number: '',
    notes: '',
  });

  useEffect(() => {
    fetch('/api/admin/mystery-box')
      .then((r) => r.json())
      .then((d) => { setRequests(d.requests ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openModal = (r: MysteryBoxRequest) => {
    setSelected(r);
    setEditForm({ status: r.status, tracking_number: r.tracking_number ?? '', notes: r.notes ?? '' });
  };

  const handleSave = async () => {
    if (!selected) return;
    setSaving(true);
    const res = await fetch('/api/admin/mystery-box', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ id: selected.id, ...editForm }),
    });
    setSaving(false);
    if (res.ok) {
      const { request } = await res.json();
      setRequests((prev) => prev.map((r) => r.id === selected.id ? { ...r, ...request } : r));
      setSelected(null);
    }
  };

  const filtered = useMemo(() => requests.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = r.student_name.toLowerCase().includes(q) || r.course_title.toLowerCase().includes(q) ||
                        (r.delivery_name ?? '').toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  }), [requests, search, statusFilter]);

  const StatusBadge = ({ s }: { s: MysteryBoxStatus }) => {
    const cfg = STATUS_CONFIG[s];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
        {cfg.icon}{cfg.label}
      </span>
    );
  };

  const columns: Column<MysteryBoxRequest>[] = [
    { key: 'student_name', label: 'Student', sortable: true, render: (v, r) => (
      <div><p className="text-sm text-white">{String(v)}</p><p className="text-xs text-gray-500">{r.student_email}</p></div>
    )},
    { key: 'course_title',   label: 'Course',   sortable: true },
    { key: 'status',         label: 'Status',   render: (v) => <StatusBadge s={v as MysteryBoxStatus} /> },
    { key: 'tracking_number',label: 'Tracking', render: (v) => v ? <span className="font-mono text-xs text-indigo-300">{String(v)}</span> : <span className="text-gray-600 text-xs">—</span> },
    { key: 'delivery_city',  label: 'City',     render: (v) => <span className="text-gray-300 text-xs">{String(v ?? '—')}</span> },
    { key: 'delivery_state', label: 'State',    render: (v) => <span className="text-gray-300 text-xs">{String(v ?? '—')}</span> },
    { key: 'earned_at',      label: 'Earned',   sortable: true, render: (v) => v ? format(new Date(v as string), 'MMM d, yyyy') : '—' },
  ];

  const counts = Object.keys(STATUS_CONFIG).reduce((acc, s) => {
    acc[s] = requests.filter((r) => r.status === s).length;
    return acc;
  }, {} as Record<string, number>);

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading requests…</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Mystery Box</h1>
        <p className="mt-2 text-gray-400">{requests.length} total requests</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {Object.entries(STATUS_CONFIG).map(([s, cfg]) => (
          <button key={s} onClick={() => setStatus(statusFilter === s ? '' : s)}
            className={`rounded-xl border p-3 text-left transition ${statusFilter === s ? 'border-indigo-500/50 bg-indigo-500/10' : 'border-gray-800 bg-gray-900/50 hover:border-gray-700'}`}>
            <p className="text-xs text-gray-400">{cfg.label}</p>
            <p className={`text-2xl font-bold mt-1 ${cfg.color.split(' ')[0]}`}>{counts[s] ?? 0}</p>
          </button>
        ))}
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} placeholder="Search by student, course, or recipient…"
        filters={{ status: { label: 'Status', value: statusFilter,
          options: Object.entries(STATUS_CONFIG).map(([v, { label }]) => ({ label, value: v })),
          onChange: setStatus }}} />

      <AdminTable columns={columns} data={filtered} onRowClick={openModal} />

      <Modal isOpen={!!selected} onClose={() => setSelected(null)} title={`Update: ${selected?.student_name}`}
        footer={
          <>
            <button onClick={() => setSelected(null)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleSave} disabled={saving} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 font-medium text-white transition disabled:opacity-50">
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </>
        }>
        {selected && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-800/50 border border-gray-700 p-4 space-y-1 text-sm">
              <p className="text-gray-300"><span className="text-gray-500">Course:</span> {selected.course_title}</p>
              {selected.delivery_name    && <p className="text-gray-300"><span className="text-gray-500">Name:</span> {selected.delivery_name}</p>}
              {selected.delivery_address && <p className="text-gray-300"><span className="text-gray-500">Address:</span> {selected.delivery_address}</p>}
              {selected.delivery_city    && <p className="text-gray-300"><span className="text-gray-500">City/State:</span> {selected.delivery_city}, {selected.delivery_state}</p>}
              {selected.delivery_phone   && <p className="text-gray-300"><span className="text-gray-500">Phone:</span> {selected.delivery_phone}</p>}
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Status</label>
              <select value={editForm.status} onChange={(e) => setEditForm((f) => ({ ...f, status: e.target.value as MysteryBoxStatus }))} className={inp}>
                {Object.entries(STATUS_CONFIG).map(([v, { label }]) => <option key={v} value={v}>{label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Tracking Number</label>
              <input value={editForm.tracking_number} onChange={(e) => setEditForm((f) => ({ ...f, tracking_number: e.target.value }))}
                placeholder="e.g. ABC123456" className={inp} />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1.5">Internal Notes</label>
              <textarea value={editForm.notes} onChange={(e) => setEditForm((f) => ({ ...f, notes: e.target.value }))}
                rows={3} placeholder="Optional notes…" className={`${inp} resize-none`} />
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
