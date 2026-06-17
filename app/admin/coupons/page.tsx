'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { Modal } from '@/components/admin/shared/Modal';
import type { Coupon } from '@/components/admin/adminTypes';
import { Plus, Trash2, ToggleLeft, ToggleRight } from 'lucide-react';
import { format } from 'date-fns';

const inp = 'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 transition';

export default function CouponsPage() {
  const [coupons, setCoupons]   = useState<Coupon[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState('');
  const [showCreate, setCreate] = useState(false);
  const [deleteTarget, setDel]  = useState<Coupon | null>(null);

  const [form, setForm] = useState({ code: '', discount_percent: '', max_usage: '100', expires_at: '' });
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  useEffect(() => {
    fetch('/api/admin/coupons')
      .then((r) => r.json())
      .then((d) => { setCoupons(d.coupons ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() =>
    coupons.filter((c) => c.code.toLowerCase().includes(search.toLowerCase())),
    [coupons, search]);

  const handleToggle = async (c: Coupon) => {
    const res = await fetch(`/api/admin/coupons/${c.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ is_active: !c.is_active }),
    });
    if (res.ok) setCoupons((prev) => prev.map((x) => x.id === c.id ? { ...x, is_active: !x.is_active } : x));
  };

  const handleCreate = async () => {
    if (!form.code || !form.discount_percent) { setSaveError('Code and discount % are required.'); return; }
    setSaving(true); setSaveError('');
    const res = await fetch('/api/admin/coupons', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ ...form, discount_percent: Number(form.discount_percent), max_usage: Number(form.max_usage), expires_at: form.expires_at || null }),
    });
    setSaving(false);
    if (!res.ok) { const d = await res.json(); setSaveError(d.error ?? 'Failed'); return; }
    const { coupon } = await res.json();
    setCoupons((prev) => [coupon, ...prev]);
    setCreate(false); setForm({ code: '', discount_percent: '', max_usage: '100', expires_at: '' });
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await fetch(`/api/admin/coupons/${deleteTarget.id}`, { method: 'DELETE', headers: { 'x-csrf-protection': '1' } });
    setCoupons((prev) => prev.filter((c) => c.id !== deleteTarget.id));
    setDel(null);
  };

  const columns: Column<Coupon>[] = [
    { key: 'code', label: 'Code', sortable: true, render: (v) => <span className="font-mono text-indigo-300 font-bold text-sm">{String(v)}</span> },
    { key: 'discount_percent', label: 'Discount', sortable: true, render: (v) => <span className="text-emerald-400 font-bold">{v}%</span> },
    { key: 'used_count', label: 'Used / Max', render: (_, c) => <span className="text-gray-300 text-sm">{c.used_count} / {c.max_usage}</span> },
    { key: 'expires_at', label: 'Expires', render: (v) => v ? format(new Date(v as string), 'MMM d, yyyy') : <span className="text-gray-600">Never</span> },
    { key: 'is_active', label: 'Status', render: (_, c) => (
      <button onClick={(e) => { e.stopPropagation(); handleToggle(c); }} className="flex items-center gap-1.5 text-xs transition">
        {c.is_active
          ? <><ToggleRight size={18} className="text-emerald-400" /><span className="text-emerald-400">Active</span></>
          : <><ToggleLeft  size={18} className="text-gray-500"    /><span className="text-gray-500">Inactive</span></>}
      </button>
    )},
    { key: 'created_at', label: 'Created', sortable: true, render: (v) => format(new Date(v as string), 'MMM d, yyyy') },
    { key: 'id', label: 'Actions', render: (_, c) => (
      <button onClick={(e) => { e.stopPropagation(); setDel(c); }}
        className="flex items-center gap-1 text-xs px-2 py-1 rounded border border-red-500/30 text-red-400 hover:bg-red-500/10 transition">
        <Trash2 size={11} />
      </button>
    )},
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading coupons…</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Coupons</h1>
          <p className="mt-2 text-gray-400">{coupons.length} coupons · {coupons.filter((c) => c.is_active).length} active</p>
        </div>
        <button onClick={() => setCreate(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-medium transition shadow-lg shadow-indigo-500/30">
          <Plus size={16} /> New Coupon
        </button>
      </div>

      <div>
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by code…"
          className="rounded-lg bg-gray-800 border border-gray-700 px-4 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 w-full max-w-sm" />
      </div>

      <AdminTable columns={columns} data={filtered} />

      <Modal isOpen={showCreate} onClose={() => setCreate(false)} title="Create Coupon"
        footer={
          <>
            <button onClick={() => setCreate(false)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 font-medium text-white transition disabled:opacity-50">{saving ? 'Creating…' : 'Create'}</button>
          </>
        }>
        <div className="space-y-4">
          {saveError && <p className="text-red-400 text-sm">{saveError}</p>}
          {[
            { label: 'Coupon Code *', key: 'code', placeholder: 'e.g. LAUNCH50', type: 'text' },
            { label: 'Discount % *', key: 'discount_percent', placeholder: 'e.g. 20', type: 'number' },
            { label: 'Max Usage', key: 'max_usage', placeholder: '100', type: 'number' },
            { label: 'Expires At', key: 'expires_at', placeholder: '', type: 'date' },
          ].map(({ label, key, placeholder, type }) => (
            <div key={key}>
              <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
              <input type={type} value={(form as any)[key]} onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
                placeholder={placeholder} className={inp} />
            </div>
          ))}
        </div>
      </Modal>

      <Modal isOpen={!!deleteTarget} onClose={() => setDel(null)} title="Delete Coupon"
        footer={
          <>
            <button onClick={() => setDel(null)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleDelete} className="flex-1 rounded-lg bg-red-600 hover:bg-red-700 px-4 py-2 font-medium text-white transition">Delete</button>
          </>
        }>
        <p className="text-gray-300 text-sm">Delete coupon <span className="font-mono font-bold text-indigo-300">{deleteTarget?.code}</span>? This cannot be undone.</p>
      </Modal>
    </div>
  );
}
