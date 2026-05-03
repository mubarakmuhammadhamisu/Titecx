'use client';

import React, { useState, useMemo } from 'react';
import {
  mockStudentPoints,
  mockStudents,
  StudentPointSummary,
  PointTransaction,
  PointTxnType,
} from '@/components/admin/mock-data';
import {
  Coins,
  Search,
  Zap,
  BookOpen,
  CheckCircle,
  ArrowUpCircle,
  ArrowDownCircle,
  GitBranch,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';
import { format } from 'date-fns';

// ── Transaction type display config ──────────────────────────────────────────
const TXN_CONFIG: Record<PointTxnType, { label: string; color: string }> = {
  referral_commission: { label: 'Referral Commission', color: 'text-emerald-400' },
  manual_credit:       { label: 'Manual Credit',       color: 'text-indigo-400'  },
  manual_deduction:    { label: 'Manual Deduction',     color: 'text-red-400'    },
  redemption:          { label: 'Redemption',           color: 'text-amber-400'  },
  expiry:              { label: 'Expiry',               color: 'text-gray-500'   },
};

function TxnTypeBadge({ type }: { type: PointTxnType }) {
  const cfg = TXN_CONFIG[type] ?? { label: type, color: 'text-gray-400' };
  return (
    <span className={`text-xs font-semibold ${cfg.color}`}>{cfg.label}</span>
  );
}

function TxnAmountDisplay({ amount }: { amount: number }) {
  const isPositive = amount > 0;
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-sm ${isPositive ? 'text-emerald-400' : 'text-red-400'}`}>
      {isPositive
        ? <ArrowUpCircle size={13} />
        : <ArrowDownCircle size={13} />}
      {isPositive ? '+' : ''}₦{Math.abs(amount).toLocaleString()}
    </span>
  );
}

// ── Right panel: student point detail ────────────────────────────────────────
function PointDetailPanel({
  summary,
  onAdjust,
}: {
  summary: StudentPointSummary;
  onAdjust: (studentId: string, txn: PointTransaction) => void;
}) {
  const [adjAmount, setAdjAmount]   = useState('');
  const [adjReason, setAdjReason]   = useState('');
  const [adjError, setAdjError]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess]       = useState(false);

  const handleSubmit = () => {
    const amount = parseInt(adjAmount, 10);
    if (isNaN(amount) || amount === 0) { setAdjError('Enter a non-zero integer.'); return; }
    if (!adjReason.trim()) { setAdjError('Reason is required.'); return; }
    setAdjError('');
    setSubmitting(true);
    setTimeout(() => {
      const type: PointTxnType = amount > 0 ? 'manual_credit' : 'manual_deduction';
      const newBalance = summary.credit_balance + amount;
      const txn: PointTransaction = {
        id:           `txn-manual-${Date.now()}`,
        student_id:   summary.student_id,
        type,
        amount,
        balance_after: Math.max(0, newBalance),
        description:  adjReason.trim(),
        reference_id:  null,
        created_at:    new Date().toISOString(),
        created_by:    'Admin',
      };
      onAdjust(summary.student_id, txn);
      setAdjAmount('');
      setAdjReason('');
      setSubmitting(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    }, 700);
  };

  return (
    <div className="space-y-6">
      {/* Summary header */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Spendable</p>
          <p className="text-xl font-bold text-amber-400 mt-1">₦{summary.credit_balance.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-0.5">credits</p>
        </div>
        <div className="rounded-xl border border-indigo-500/20 bg-indigo-500/5 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Lifetime</p>
          <p className="text-xl font-bold text-indigo-400 mt-1">{summary.lifetime_points.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-0.5">total pts (Track A)</p>
        </div>
        <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">Learning</p>
          <p className="text-xl font-bold text-emerald-400 mt-1">{summary.learning_points.toLocaleString()}</p>
          <p className="text-xs text-gray-600 mt-0.5">derived (Track B)</p>
        </div>
      </div>

      {/* Transaction log */}
      <div>
        <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
          <RotateCcw size={14} className="text-indigo-400" /> Transaction Log
        </h3>
        {summary.transactions.length === 0 ? (
          <p className="text-sm text-gray-500 py-4 text-center">No transactions yet.</p>
        ) : (
          <div className="rounded-xl border border-indigo-500/20 overflow-hidden divide-y divide-indigo-500/10">
            {[...summary.transactions]
              .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
              .map((txn) => (
                <div key={txn.id} className="px-4 py-3 hover:bg-indigo-500/5 transition">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <TxnTypeBadge type={txn.type} />
                      <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{txn.description}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-600">
                          {format(new Date(txn.created_at), 'MMM d, yyyy · HH:mm')}
                        </span>
                        {txn.reference_id && (
                          <span className="font-mono text-xs text-gray-700">ref: {txn.reference_id}</span>
                        )}
                        <span className={`text-xs ${txn.created_by === 'system' ? 'text-gray-700' : 'text-purple-400'}`}>
                          by {txn.created_by}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <TxnAmountDisplay amount={txn.amount} />
                      <p className="text-xs text-gray-600 mt-0.5">bal: ₦{txn.balance_after.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>

      {/* Manual Adjustment Form */}
      <div className="rounded-xl border border-indigo-500/20 bg-gray-900/60 p-5 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Coins size={14} className="text-indigo-400" /> Manual Adjustment
        </h3>
        <p className="text-xs text-gray-400">
          Positive values add credits. Negative values deduct. All adjustments are permanently logged as a new transaction.
        </p>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Amount (positive = credit, negative = deduction)</label>
          <input
            type="number"
            value={adjAmount}
            onChange={(e) => setAdjAmount(e.target.value)}
            placeholder="e.g. 2000 or -500"
            className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/60 transition"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1.5">Reason (required)</label>
          <textarea
            value={adjReason}
            onChange={(e) => setAdjReason(e.target.value)}
            placeholder="Explain why this adjustment is being made..."
            rows={3}
            className="w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2.5 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/60 transition resize-none"
          />
        </div>
        {adjError && (
          <p className="text-xs text-red-400">{adjError}</p>
        )}
        {success && (
          <p className="text-xs text-emerald-400 flex items-center gap-1.5">
            <CheckCircle size={12} /> Adjustment applied and logged.
          </p>
        )}
        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {submitting ? 'Applying...' : 'Apply Adjustment'}
        </button>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function PointsPage() {
  // Initialise with mock data, then extend from mockStudents for completeness
  const buildInitialData = (): StudentPointSummary[] => {
    const existing = new Set(mockStudentPoints.map((s) => s.student_id));
    const extras: StudentPointSummary[] = mockStudents
      .filter((s) => !existing.has(s.id))
      .map((s) => ({
        student_id:      s.id,
        student_name:    s.name,
        credit_balance:  s.credit_balance,
        lifetime_points: s.lifetime_points,
        learning_points: 0,
        transactions:    [],
      }));
    return [...mockStudentPoints, ...extras];
  };

  const [summaries, setSummaries]   = useState<StudentPointSummary[]>(buildInitialData);
  const [search, setSearch]         = useState('');
  const [selectedId, setSelectedId] = useState<string>(mockStudentPoints[0]?.student_id ?? '');

  const filtered = useMemo(
    () =>
      summaries.filter((s) =>
        s.student_name.toLowerCase().includes(search.toLowerCase()),
      ),
    [summaries, search],
  );

  const activeSummary = summaries.find((s) => s.student_id === selectedId) ?? null;

  const handleAdjust = (studentId: string, txn: PointTransaction) => {
    setSummaries((prev) =>
      prev.map((s) => {
        if (s.student_id !== studentId) return s;
        const newBalance = Math.max(0, s.credit_balance + txn.amount);
        const newLifetime =
          txn.amount > 0
            ? s.lifetime_points + txn.amount
            : s.lifetime_points;
        return {
          ...s,
          credit_balance:  newBalance,
          lifetime_points: newLifetime,
          transactions:    [txn, ...s.transactions],
        };
      }),
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-white flex items-center gap-3">
          <Coins size={26} className="text-indigo-400" /> Points Audit
        </h1>
        <p className="mt-2 text-gray-400">
          Full credit point history for every student. Manually adjust balances and resolve disputes without touching the database.
        </p>
      </div>

      {/* Two-panel layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Left panel — student list */}
        <div className="lg:col-span-1 space-y-3">
          <div className="relative">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              type="text"
              placeholder="Search students..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-900 border border-indigo-500/20 text-sm text-white placeholder-gray-600 outline-none focus:border-indigo-500/50 transition"
            />
          </div>

          <div className="rounded-xl border border-indigo-500/20 bg-gray-900/60 overflow-hidden divide-y divide-indigo-500/10 max-h-[calc(100vh-240px)] overflow-y-auto">
            {filtered.length === 0 ? (
              <div className="p-6 text-center text-gray-500 text-sm">No students found.</div>
            ) : (
              filtered.map((s) => (
                <button
                  key={s.student_id}
                  onClick={() => setSelectedId(s.student_id)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-indigo-500/10 transition flex items-center justify-between gap-3 ${
                    selectedId === s.student_id ? 'bg-indigo-500/15 border-l-2 border-l-indigo-400' : ''
                  }`}
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{s.student_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-amber-400 font-semibold flex items-center gap-0.5">
                        <Zap size={9} />₦{s.credit_balance.toLocaleString()}
                      </span>
                      <span className="text-gray-700 text-xs">·</span>
                      <span className="text-xs text-indigo-400 flex items-center gap-0.5">
                        <BookOpen size={9} />{s.learning_points}lp
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={14} className={selectedId === s.student_id ? 'text-indigo-400' : 'text-gray-700'} />
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right panel — detail */}
        <div className="lg:col-span-2">
          {activeSummary ? (
            <div className="space-y-2">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <GitBranch size={16} className="text-indigo-400" />
                {activeSummary.student_name}
              </h2>
              <PointDetailPanel
                summary={activeSummary}
                onAdjust={handleAdjust}
              />
            </div>
          ) : (
            <div className="rounded-2xl border border-indigo-500/20 bg-gray-900/60 p-12 text-center text-gray-500">
              <Coins size={36} className="mx-auto opacity-30 mb-3" />
              <p>Select a student from the list to view their point history.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
