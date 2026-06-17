'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import { Modal } from '@/components/admin/shared/Modal';
import type { PointTransaction } from '@/components/admin/adminTypes';
import { Plus } from 'lucide-react';
import { format } from 'date-fns';

const TXN_LABELS: Record<string, { label: string; color: string }> = {
  referral_commission: { label: 'Referral Commission', color: 'text-emerald-400' },
  manual_credit:       { label: 'Manual Credit',       color: 'text-indigo-400'  },
  manual_deduction:    { label: 'Manual Deduction',     color: 'text-red-400'    },
  redemption:          { label: 'Redemption',           color: 'text-amber-400'  },
  expiry:              { label: 'Expiry',               color: 'text-gray-500'   },
};

const isDebit = (type: string) => type === 'manual_deduction' || type === 'redemption' || type === 'expiry';

export default function PointsPage() {
  const [transactions, setTransactions] = useState<PointTransaction[]>([]);
  const [loading, setLoading]           = useState(true);
  const [search, setSearch]             = useState('');
  const [typeFilter, setTypeFilter]     = useState('');
  const [students, setStudents]         = useState<{ id: string; name: string; email: string }[]>([]);

  // Issue modal
  const [showIssue, setShowIssue]     = useState(false);
  const [selStudent, setSelStudent]   = useState('');
  const [issueType, setIssueType]     = useState<'manual_credit' | 'manual_deduction'>('manual_credit');
  const [issuePoints, setIssuePoints] = useState('');
  const [issueNote, setIssueNote]     = useState('');
  const [issuing, setIssuing]         = useState(false);
  const [issueError, setIssueError]   = useState('');

  useEffect(() => {
    fetch('/api/admin/points')
      .then((r) => r.json())
      .then((d) => { setTransactions(d.transactions ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const openIssue = async () => {
    const r = await fetch('/api/admin/students').then((r) => r.json());
    setStudents((r.students ?? []).map((s: any) => ({ id: s.id, name: s.name, email: s.email })));
    setShowIssue(true);
  };

  const handleIssue = async () => {
    if (!selStudent || !issuePoints) { setIssueError('Select a student and enter points.'); return; }
    setIssuing(true); setIssueError('');
    const res = await fetch('/api/admin/points', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ user_id: selStudent, type: issueType, points: Number(issuePoints), description: issueNote || null }),
    });
    setIssuing(false);
    if (!res.ok) { const d = await res.json(); setIssueError(d.error ?? 'Failed'); return; }
    setShowIssue(false); setSelStudent(''); setIssuePoints(''); setIssueNote('');
    fetch('/api/admin/points').then((r) => r.json()).then((d) => setTransactions(d.transactions ?? []));
  };

  const filtered = useMemo(() => transactions.filter((t) => {
    const q = search.toLowerCase();
    const matchSearch = t.student_name.toLowerCase().includes(q) || t.student_email.toLowerCase().includes(q);
    const matchType = !typeFilter || t.type === typeFilter;
    return matchSearch && matchType;
  }), [transactions, search, typeFilter]);

  const columns: Column<PointTransaction>[] = [
    { key: 'student_name', label: 'Student', sortable: true, render: (v, t) => (
      <div><p className="text-sm text-white">{String(v)}</p><p className="text-xs text-gray-500">{t.student_email}</p></div>
    )},
    { key: 'type', label: 'Type', render: (v) => {
      const cfg = TXN_LABELS[String(v)] ?? { label: String(v), color: 'text-gray-400' };
      return <span className={`text-xs font-medium ${cfg.color}`}>{cfg.label}</span>;
    }},
    { key: 'points', label: 'Points', sortable: true, render: (v, t) => (
      <span className={`font-bold ${isDebit(t.type) ? 'text-red-400' : 'text-green-400'}`}>
        {isDebit(t.type) ? '−' : '+'}{Number(v).toLocaleString()}
      </span>
    )},
    { key: 'credit_balance', label: 'Balance', render: (v) => <span className="text-gray-300 text-sm">₦{Number(v).toLocaleString()}</span> },
    { key: 'description', label: 'Note', render: (v) => <span className="text-gray-400 text-xs">{String(v ?? '—')}</span> },
    { key: 'created_at',  label: 'Date',  sortable: true, render: (v) => format(new Date(v as string), 'MMM d, yyyy') },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading points…</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Points & Credits</h1>
          <p className="mt-2 text-gray-400">{transactions.length} transactions</p>
        </div>
        <button onClick={openIssue}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white text-sm font-medium transition shadow-lg shadow-indigo-500/30">
          <Plus size={16} /> Issue / Deduct
        </button>
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} placeholder="Search by student…"
        filters={{ type: { label: 'Type', value: typeFilter, options: Object.entries(TXN_LABELS).map(([v, { label }]) => ({ label, value: v })), onChange: setTypeFilter }}} />

      <AdminTable columns={columns} data={filtered} />

      <Modal isOpen={showIssue} onClose={() => setShowIssue(false)} title="Issue or Deduct Points"
        footer={
          <>
            <button onClick={() => setShowIssue(false)} className="flex-1 rounded-lg border border-gray-600 px-4 py-2 text-gray-300 hover:bg-gray-800 transition">Cancel</button>
            <button onClick={handleIssue} disabled={issuing}
              className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 font-medium text-white transition disabled:opacity-50">
              {issuing ? 'Processing…' : 'Confirm'}
            </button>
          </>
        }>
        <div className="space-y-4">
          {issueError && <p className="text-red-400 text-sm">{issueError}</p>}
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Student</label>
            <select value={selStudent} onChange={(e) => setSelStudent(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60">
              <option value="">Select a student…</option>
              {students.map((s) => <option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Action</label>
            <select value={issueType} onChange={(e) => setIssueType(e.target.value as any)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none">
              <option value="manual_credit">Credit (add points)</option>
              <option value="manual_deduction">Deduct (remove points)</option>
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Points</label>
            <input type="number" min="1" value={issuePoints} onChange={(e) => setIssuePoints(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60" placeholder="e.g. 500" />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1.5">Note (optional)</label>
            <input value={issueNote} onChange={(e) => setIssueNote(e.target.value)}
              className="w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60" placeholder="Reason for adjustment" />
          </div>
        </div>
      </Modal>
    </div>
  );
}
