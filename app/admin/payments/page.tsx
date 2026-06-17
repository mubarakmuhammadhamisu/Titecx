'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import type { Payment } from '@/components/admin/adminTypes';
import { CheckCircle, AlertCircle, Clock } from 'lucide-react';
import { format } from 'date-fns';

function fmt(kobo: number) { return `₦${(kobo / 100).toLocaleString()}`; }

export default function PaymentsPage() {
  const [payments, setPayments]     = useState<Payment[]>([]);
  const [loading, setLoading]       = useState(true);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatus]   = useState('');
  const [dateFrom, setDateFrom]     = useState('');
  const [dateTo, setDateTo]         = useState('');
  const [verifying, setVerifying]   = useState<string | null>(null);
  const [verifyResult, setVerifyResult] = useState<{ id: string; ok: boolean } | null>(null);

  useEffect(() => {
    fetch('/api/admin/payments')
      .then((r) => r.json())
      .then((d) => { setPayments(d.payments ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => payments.filter((p) => {
    const q = search.toLowerCase();
    const matchSearch = p.student_name.toLowerCase().includes(q) ||
                        p.course_title.toLowerCase().includes(q) ||
                        p.paystack_reference.toLowerCase().includes(q);
    const matchStatus = !statusFilter || p.status === statusFilter;
    const pd = new Date(p.paid_at);
    const matchFrom = !dateFrom || pd >= new Date(dateFrom);
    const matchTo   = !dateTo   || pd <= new Date(dateTo);
    return matchSearch && matchStatus && matchFrom && matchTo;
  }), [payments, search, statusFilter, dateFrom, dateTo]);

  const totalRevenue = filtered.filter((p) => p.status === 'success').reduce((s, p) => s + p.amount_kobo, 0);

  const handleVerify = async (p: Payment) => {
    setVerifying(p.id);
    try {
      const res = await fetch('/api/admin/payments/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
        body: JSON.stringify({ reference: p.paystack_reference }),
      });
      const data = await res.json();
      setVerifyResult({ id: p.id, ok: data.data?.status === 'success' });
    } catch { setVerifyResult({ id: p.id, ok: false }); }
    finally {
      setVerifying(null);
      setTimeout(() => setVerifyResult(null), 3000);
    }
  };

  const statusBadge = (s: string) => {
    if (s === 'success') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20 text-green-400 text-xs font-semibold"><CheckCircle size={11} />Success</span>;
    if (s === 'failed')  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold"><AlertCircle size={11} />Failed</span>;
    return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold"><Clock size={11} />Pending</span>;
  };

  const columns: Column<Payment>[] = [
    { key: 'student_name',        label: 'Student',    sortable: true },
    { key: 'course_title',        label: 'Course',     sortable: true },
    { key: 'amount_kobo',         label: 'Amount',     sortable: true, render: (v) => fmt(Number(v)) },
    { key: 'points_applied',      label: 'Pts Applied',sortable: true, render: (v) => Number(v) > 0 ? <span className="text-amber-400 text-xs">{Number(v)} pts</span> : <span className="text-gray-600 text-xs">—</span> },
    { key: 'status',              label: 'Status',     render: (v) => statusBadge(String(v)) },
    { key: 'paid_at',             label: 'Date',       sortable: true, render: (v) => format(new Date(v as string), 'MMM d, yyyy') },
    { key: 'paystack_reference',  label: 'Reference',  render: (v) => <span className="text-xs text-gray-400 font-mono">{String(v)}</span> },
    {
      key: 'id', label: 'Verify',
      render: (_, p) => (
        <button
          onClick={() => handleVerify(p)}
          disabled={verifying === p.id}
          className="text-xs px-2.5 py-1 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 transition disabled:opacity-50"
        >
          {verifying === p.id ? '…' :
           verifyResult?.id === p.id ? (verifyResult.ok ? '✓ OK' : '✗ Fail') : 'Verify'}
        </button>
      ),
    },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading payments…</div></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Payments</h1>
          <p className="mt-2 text-gray-400">{filtered.length} transactions · {fmt(totalRevenue)} total</p>
        </div>
      </div>

      <FilterBar
        searchValue={search} onSearchChange={setSearch}
        placeholder="Search by student, course, or reference…"
        filters={{
          status: {
            label: 'Status', value: statusFilter,
            options: [{ label: 'Success', value: 'success' }, { label: 'Failed', value: 'failed' }, { label: 'Pending', value: 'pending' }],
            onChange: setStatus,
          },
        }}
      />

      <div className="flex gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">From</label>
          <input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)}
            className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white text-sm outline-none focus:border-indigo-500/60" />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">To</label>
          <input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)}
            className="rounded-lg bg-gray-800 border border-gray-700 px-3 py-2 text-white text-sm outline-none focus:border-indigo-500/60" />
        </div>
      </div>

      <AdminTable columns={columns} data={filtered} />
    </div>
  );
}
