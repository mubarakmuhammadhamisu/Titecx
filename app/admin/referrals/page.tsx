'use client';

import React, { useState, useMemo } from 'react';
import {
  mockReferrals,
  ReferralRecord,
  ReferralStatus,
} from '@/components/admin/mock-data';
import {
  GitBranch,
  CheckCircle,
  Clock,
  X,
  AlertTriangle,
  ChevronRight,
  Search,
  SlidersHorizontal,
} from 'lucide-react';
import { Modal } from '@/components/admin/shared/Modal';
import { format } from 'date-fns';

// ── Status badge ──────────────────────────────────────────────────────────────
function StatusBadge({ status, manual }: { status: ReferralStatus; manual: boolean }) {
  if (status === 'converted') {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
        <CheckCircle size={11} />
        Converted{manual ? ' (Manual)' : ''}
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
      <Clock size={11} />
      Pending
    </span>
  );
}

// ── Detail side-panel ─────────────────────────────────────────────────────────
function DetailPanel({
  record,
  onClose,
  onManualConvert,
}: {
  record: ReferralRecord;
  onClose: () => void;
  onManualConvert: (id: string, reason: string) => void;
}) {
  const [convertReason, setConvertReason] = useState('');
  const [showConvertForm, setShowConvertForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleConvert = () => {
    if (!convertReason.trim()) return;
    setSubmitting(true);
    setTimeout(() => {
      onManualConvert(record.id, convertReason.trim());
      setSubmitting(false);
      setShowConvertForm(false);
      setConvertReason('');
    }, 800);
  };

  const rows: { label: string; value: React.ReactNode }[] = [
    { label: 'Referral ID',      value: <span className="font-mono text-xs text-gray-300">{record.id}</span> },
    { label: 'Referral Code',    value: <span className="font-mono text-xs text-indigo-300">{record.referral_code}</span> },
    { label: 'Referrer',         value: <span className="text-white font-semibold">{record.referrer_name}</span> },
    { label: 'Referee',          value: <span className="text-white font-semibold">{record.referee_name}</span> },
    { label: 'Referee Email',    value: <span className="text-gray-300 text-xs">{record.referee_email}</span> },
    { label: 'Registered',       value: format(new Date(record.created_at), 'MMM d, yyyy · HH:mm') },
    {
      label: 'Status',
      value: <StatusBadge status={record.status} manual={record.manually_converted} />,
    },
    ...(record.converted_at
      ? [{ label: 'Converted On', value: format(new Date(record.converted_at), 'MMM d, yyyy · HH:mm') }]
      : []),
    {
      label: 'Commission',
      value: record.commission_credits > 0
        ? <span className="text-amber-400 font-bold">₦{record.commission_credits.toLocaleString()} credits</span>
        : <span className="text-gray-600">—</span>,
    },
    ...(record.triggering_payment_id
      ? [
          { label: 'Triggering Payment', value: <span className="font-mono text-xs text-gray-300">{record.triggering_payment_id}</span> },
          { label: 'Payment Amount',     value: <span className="text-white">₦{record.triggering_payment_amount?.toLocaleString()}</span> },
        ]
      : []),
    ...(record.manually_converted
      ? [{ label: 'Source', value: <span className="text-purple-400 text-xs font-semibold">Admin manual conversion</span> }]
      : []),
    ...(record.admin_notes
      ? [{ label: 'Admin Notes', value: <span className="text-gray-300 text-xs italic">{record.admin_notes}</span> }]
      : []),
  ];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full max-w-md bg-gray-950 border-l border-indigo-500/20 shadow-2xl flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-5 border-b border-indigo-500/20">
        <h2 className="text-lg font-bold text-white flex items-center gap-2">
          <GitBranch size={18} className="text-indigo-400" /> Referral Detail
        </h2>
        <button onClick={onClose} className="text-gray-500 hover:text-white transition p-1">
          <X size={20} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">
        <dl className="space-y-3">
          {rows.map(({ label, value }) => (
            <div key={label} className="flex items-start justify-between gap-4 border-b border-indigo-500/10 pb-3">
              <dt className="text-xs text-gray-500 font-semibold uppercase tracking-wide shrink-0 pt-0.5 w-32">{label}</dt>
              <dd className="text-sm text-gray-300 text-right">{value}</dd>
            </div>
          ))}
        </dl>

        {/* Manual convert */}
        {record.status === 'pending' && (
          <div className="mt-4">
            {!showConvertForm ? (
              <button
                onClick={() => setShowConvertForm(true)}
                className="w-full py-2.5 rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-300 text-sm font-semibold hover:bg-indigo-600/30 transition flex items-center justify-center gap-2"
              >
                <CheckCircle size={15} /> Manual Convert
              </button>
            ) : (
              <div className="space-y-3 rounded-xl border border-indigo-500/20 bg-gray-900/60 p-4">
                <p className="text-sm font-semibold text-white">Manual Convert</p>
                <p className="text-xs text-gray-400">
                  This will mark the referral as converted and award <span className="text-amber-400 font-semibold">10% commission credits</span> to{' '}
                  <span className="text-white font-semibold">{record.referrer_name}</span>. This action is logged and irreversible.
                </p>
                <textarea
                  value={convertReason}
                  onChange={(e) => setConvertReason(e.target.value)}
                  placeholder="Reason for manual conversion (required)..."
                  rows={3}
                  className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/60 resize-none"
                />
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowConvertForm(false); setConvertReason(''); }}
                    className="flex-1 py-2 rounded-lg border border-gray-700 text-gray-400 text-sm hover:bg-gray-800 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleConvert}
                    disabled={!convertReason.trim() || submitting}
                    className="flex-1 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {submitting ? 'Converting...' : 'Confirm Convert'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {record.status === 'converted' && !record.manually_converted && (
          <div className="rounded-xl bg-emerald-500/5 border border-emerald-500/20 p-4 text-xs text-emerald-400">
            <CheckCircle size={14} className="inline mr-1.5" />
            This referral converted automatically via a qualifying payment.
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function ReferralsPage() {
  const [records, setRecords] = useState<ReferralRecord[]>(mockReferrals);
  const [searchTerm, setSearchTerm]     = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ReferralStatus>('all');
  const [selected, setSelected]         = useState<ReferralRecord | null>(null);
  const [toast, setToast]               = useState('');

  const filtered = useMemo(() => {
    return records.filter((r) => {
      const matchSearch =
        r.referrer_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referee_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referee_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.referral_code.toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = statusFilter === 'all' || r.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [records, searchTerm, statusFilter]);

  const totalConverted  = records.filter((r) => r.status === 'converted').length;
  const totalPending    = records.filter((r) => r.status === 'pending').length;
  const totalCommission = records.reduce((s, r) => s + r.commission_credits, 0);

  const handleManualConvert = (id: string, reason: string) => {
    setRecords((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: 'converted',
              converted_at: new Date().toISOString(),
              commission_credits: r.triggering_payment_amount
                ? Math.floor(r.triggering_payment_amount * 0.1)
                : 1500,
              manually_converted: true,
              admin_notes: reason,
            }
          : r,
      ),
    );
    // Update selected to reflect new state
    setSelected((prev) =>
      prev?.id === id
        ? {
            ...prev,
            status: 'converted',
            converted_at: new Date().toISOString(),
            manually_converted: true,
            admin_notes: reason,
          }
        : prev,
    );
    setToast(`Referral manually converted and commission awarded.`);
    setTimeout(() => setToast(''), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <GitBranch size={26} className="text-indigo-400" /> Referrals
        </h1>
        <p className="mt-2 text-gray-400">
          Full audit trail for every referral. Use Manual Convert to resolve disputes without touching the database.
        </p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Converted</p>
          <p className="mt-2 text-3xl font-bold text-emerald-400">{totalConverted}</p>
        </div>
        <div className="rounded-xl border border-amber-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Pending</p>
          <p className="mt-2 text-3xl font-bold text-amber-400">{totalPending}</p>
          <p className="text-xs text-gray-500 mt-1">registered but not purchased</p>
        </div>
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-5">
          <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Total Commission Issued</p>
          <p className="mt-2 text-3xl font-bold text-indigo-400">₦{totalCommission.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">in credits across all referrers</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 items-center">
        {/* Search */}
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            type="text"
            placeholder="Search referrer, referee, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-indigo-500/20 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition"
          />
        </div>
        {/* Status pills */}
        <div className="flex gap-1.5">
          {(['all', 'converted', 'pending'] as const).map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={`px-3 py-2 rounded-lg text-xs font-semibold border transition ${
                statusFilter === s
                  ? s === 'pending'
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                    : s === 'converted'
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400'
                      : 'bg-indigo-500/20 border-indigo-500/40 text-indigo-300'
                  : 'bg-gray-900 border-gray-700 text-gray-500 hover:border-indigo-500/30'
              }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
        <p className="text-sm text-gray-500 ml-auto">{filtered.length} record{filtered.length !== 1 ? 's' : ''}</p>
      </div>

      {/* Desktop Table */}
      <div className="hidden md:block rounded-2xl border border-indigo-500/20 bg-gray-900/60 overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-indigo-500/20 text-left">
              {['Referrer', 'Referee', 'Code', 'Registered', 'Status', 'Commission', ''].map((h) => (
                <th key={h} className="px-5 py-4 text-xs text-gray-500 font-semibold uppercase tracking-wide">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-indigo-500/10">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-5 py-12 text-center text-gray-500">
                  No referral records match your filters.
                </td>
              </tr>
            ) : (
              filtered.map((r) => (
                <tr
                  key={r.id}
                  onClick={() => setSelected(r)}
                  className="hover:bg-indigo-500/5 cursor-pointer transition group"
                >
                  <td className="px-5 py-4 font-semibold text-white">{r.referrer_name}</td>
                  <td className="px-5 py-4">
                    <p className="text-white">{r.referee_name}</p>
                    <p className="text-xs text-gray-500">{r.referee_email}</p>
                  </td>
                  <td className="px-5 py-4 font-mono text-xs text-indigo-300">{r.referral_code}</td>
                  <td className="px-5 py-4 text-gray-400 text-xs">
                    {format(new Date(r.created_at), 'MMM d, yyyy')}
                  </td>
                  <td className="px-5 py-4">
                    <StatusBadge status={r.status} manual={r.manually_converted} />
                  </td>
                  <td className="px-5 py-4">
                    {r.commission_credits > 0 ? (
                      <span className="text-amber-400 font-semibold">₦{r.commission_credits.toLocaleString()}</span>
                    ) : (
                      <span className="text-gray-600">—</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <ChevronRight size={15} className="text-gray-600 group-hover:text-indigo-400 transition" />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Cards */}
      <div className="md:hidden space-y-3">
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-gray-700 p-8 text-center text-gray-500">
            No referral records match your filters.
          </div>
        ) : (
          filtered.map((r) => (
            <div
              key={r.id}
              onClick={() => setSelected(r)}
              className="rounded-xl border border-indigo-500/20 bg-gray-900/60 p-4 cursor-pointer hover:border-indigo-500/40 transition"
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-white font-semibold">{r.referrer_name}</p>
                  <p className="text-xs text-gray-500">→ {r.referee_name}</p>
                </div>
                <StatusBadge status={r.status} manual={r.manually_converted} />
              </div>
              <div className="space-y-1.5 text-sm border-t border-indigo-500/10 pt-3">
                <div className="flex justify-between">
                  <span className="text-gray-500">Code</span>
                  <span className="font-mono text-xs text-indigo-300">{r.referral_code}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Registered</span>
                  <span className="text-gray-300 text-xs">{format(new Date(r.created_at), 'MMM d, yyyy')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Commission</span>
                  <span className={r.commission_credits > 0 ? 'text-amber-400 font-semibold' : 'text-gray-600'}>
                    {r.commission_credits > 0 ? `₦${r.commission_credits.toLocaleString()}` : '—'}
                  </span>
                </div>
              </div>
              <div className="flex justify-end mt-3">
                <ChevronRight size={14} className="text-indigo-400" />
              </div>
            </div>
          ))
        )}
      </div>

      {/* Detail Panel */}
      {selected && (
        <>
          <div className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <DetailPanel
            record={selected}
            onClose={() => setSelected(null)}
            onManualConvert={handleManualConvert}
          />
        </>
      )}

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 shadow-xl backdrop-blur-md">
          <CheckCircle size={18} />
          <span className="text-sm font-medium">{toast}</span>
        </div>
      )}
    </div>
  );
}
