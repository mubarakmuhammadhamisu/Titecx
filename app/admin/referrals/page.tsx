'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { FilterBar } from '@/components/admin/shared/FilterBar';
import type { Referral } from '@/components/admin/adminTypes';
import { CheckCircle, Clock, X } from 'lucide-react';
import { format } from 'date-fns';

function StatusBadge({ status }: { status: string }) {
  if (status === 'converted') return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold"><CheckCircle size={11} />Converted</span>;
  if (status === 'expired')   return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-semibold"><X size={11} />Expired</span>;
  return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold"><Clock size={11} />Pending</span>;
}

export default function ReferralsPage() {
  const [referrals, setReferrals] = useState<Referral[]>([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState('');
  const [statusFilter, setStatus] = useState('');

  useEffect(() => {
    fetch('/api/admin/referrals')
      .then((r) => r.json())
      .then((d) => { setReferrals(d.referrals ?? []); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => referrals.filter((r) => {
    const q = search.toLowerCase();
    const matchSearch = r.referrer_name.toLowerCase().includes(q) || r.referee_name.toLowerCase().includes(q);
    const matchStatus = !statusFilter || r.status === statusFilter;
    return matchSearch && matchStatus;
  }), [referrals, search, statusFilter]);

  const converted = referrals.filter((r) => r.status === 'converted').length;
  const totalCommission = referrals.filter((r) => r.status === 'converted').reduce((s, r) => s + (r.commission_points ?? 0), 0);

  const columns: Column<Referral>[] = [
    { key: 'referrer_name',  label: 'Referrer', sortable: true, render: (v, r) => (
      <div><p className="text-sm text-white font-medium">{String(v)}</p><p className="text-xs text-gray-500">{r.referrer_email}</p></div>
    )},
    { key: 'referee_name',   label: 'Referred',  sortable: true, render: (v, r) => (
      <div><p className="text-sm text-white font-medium">{String(v)}</p><p className="text-xs text-gray-500">{r.referee_email}</p></div>
    )},
    { key: 'referred_at',    label: 'Date',       sortable: true, render: (v) => format(new Date(v as string), 'MMM d, yyyy') },
    { key: 'status',         label: 'Status',     render: (v) => <StatusBadge status={String(v)} /> },
    { key: 'converted_at',   label: 'Converted',  render: (v) => v ? format(new Date(v as string), 'MMM d, yyyy') : <span className="text-gray-600">—</span> },
    { key: 'commission_points', label: 'Commission', render: (v) => v ? <span className="text-emerald-400 text-sm font-semibold">{Number(v)} pts</span> : <span className="text-gray-600">—</span> },
  ];

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading referrals…</div></div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-white">Referrals</h1>
        <p className="mt-2 text-gray-400">{referrals.length} total · {converted} converted · {totalCommission.toLocaleString()} pts commissioned</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {[
          { label: 'Total Referrals', value: referrals.length, color: 'text-indigo-400' },
          { label: 'Converted',       value: converted,         color: 'text-emerald-400' },
          { label: 'Conversion Rate', value: referrals.length ? `${Math.round((converted / referrals.length) * 100)}%` : '0%', color: 'text-purple-400' },
        ].map(({ label, value, color }) => (
          <div key={label} className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-5">
            <p className="text-xs text-gray-400 uppercase tracking-wider">{label}</p>
            <p className={`mt-2 text-3xl font-bold ${color}`}>{value}</p>
          </div>
        ))}
      </div>

      <FilterBar searchValue={search} onSearchChange={setSearch} placeholder="Search by referrer or referee…"
        filters={{ status: { label: 'Status', value: statusFilter, options: [
          { label: 'Pending',   value: 'pending' },
          { label: 'Converted', value: 'converted' },
          { label: 'Expired',   value: 'expired' },
        ], onChange: setStatus }}} />

      <AdminTable columns={columns} data={filtered} />
    </div>
  );
}
