'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import {
  Copy, CheckCircle2, Zap, Users, Trophy, Clock,
  TrendingUp, ChevronDown, ChevronUp, ExternalLink, RefreshCw, AlertCircle,
} from 'lucide-react';

// ── Types ────────────────────────────────────────────────────────────────────

interface Referral {
  id: string;
  referee_name: string;
  referred_at: string;
  status: 'pending' | 'converted' | 'expired';
  commission_points: number | null;
  converted_at: string | null;
}

interface PointTransaction {
  id: string;
  type: 'referral_commission' | 'points_redeemed' | 'admin_grant' | 'admin_deduct';
  points: number;
  description: string | null;
  created_at: string;
}

interface DashboardData {
  referrals: Referral[];
  transactions: PointTransaction[];
  totalReferrals: number;
  convertedReferrals: number;
  totalEarned: number;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-NG', {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

function StatusBadge({ status }: { status: Referral['status'] }) {
  const map = {
    pending:   'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    converted: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    expired:   'bg-gray-600/20 text-gray-500 border-gray-600/30',
  };
  return (
    <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${map[status]}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function TxTypeBadge({ type, points }: { type: PointTransaction['type']; points: number }) {
  const isCredit = points > 0;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
      isCredit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
    }`}>
      {isCredit ? `+${points}` : points} pts
    </span>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export default function ReferralDashboard() {
  const { user } = useAuth();
  const [copied, setCopied]             = useState(false);
  const [data, setData]                 = useState<DashboardData | null>(null);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState('');
  const [txExpanded, setTxExpanded]     = useState(false);

  const referralLink = user?.referralCode
    ? `${typeof window !== 'undefined' ? window.location.origin : ''}/register?ref=${user.referralCode}`
    : '';

  const copyLink = async () => {
    if (!referralLink) return;
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for non-HTTPS or older browsers
      const el = document.createElement('textarea');
      el.value = referralLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/referral/dashboard', {
        headers: { 'x-csrf-protection': '1' },
      });
      if (!res.ok) throw new Error('Failed to load data');
      const json = await res.json() as DashboardData;
      setData(json);
    } catch {
      setError('Could not load referral data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <p className="text-gray-400">Please log in to view your referral dashboard.</p>
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Referral &amp; Points</h1>
          <p className="text-gray-400 text-sm mt-1">Share your link, earn commission on every purchase.</p>
        </div>
        <Link
          href="/dashboard/leaderboard"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-900 border border-indigo-500/20 text-sm text-indigo-300 hover:border-indigo-500/50 transition"
        >
          <Trophy size={14} /> Leaderboard <ExternalLink size={12} />
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Spendable Points',
            value: user.creditBalance.toLocaleString(),
            sub: '₦1 per point',
            color: 'text-indigo-400',
            icon: <Zap size={18} className="text-indigo-400" />,
          },
          {
            label: 'Lifetime Points',
            value: user.lifetimePoints.toLocaleString(),
            sub: 'never resets',
            color: 'text-purple-400',
            icon: <TrendingUp size={18} className="text-purple-400" />,
          },
          {
            label: 'Total Referrals',
            value: loading ? '—' : (data?.totalReferrals ?? 0).toString(),
            sub: 'signed up',
            color: 'text-emerald-400',
            icon: <Users size={18} className="text-emerald-400" />,
          },
          {
            label: 'Converted',
            value: loading ? '—' : (data?.convertedReferrals ?? 0).toString(),
            sub: 'purchased a course',
            color: 'text-yellow-400',
            icon: <CheckCircle2 size={18} className="text-yellow-400" />,
          },
        ].map(({ label, value, sub, color, icon }) => (
          <div key={label} className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/40 border border-indigo-500/20 p-4 space-y-1">
            <div className="flex items-center gap-2">{icon}<span className="text-xs text-gray-500">{label}</span></div>
            <p className={`text-2xl font-extrabold ${color}`}>{value}</p>
            <p className="text-xs text-gray-600">{sub}</p>
          </div>
        ))}
      </div>

      {/* Referral Link Card */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/40 border border-indigo-500/20 p-6 shadow-[0_0_40px_rgba(99,102,241,0.08)] space-y-4">
        <div>
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Users size={16} className="text-indigo-400" /> Your Referral Link
          </h2>
          <p className="text-sm text-gray-400 mt-1">
            Anyone who signs up via your link and purchases a course within 30 days earns you
            <span className="text-indigo-300 font-semibold"> 10% commission in points</span>.
          </p>
        </div>

        <div className="flex gap-2 items-center">
          <div className="flex-1 px-4 py-3 rounded-xl bg-gray-800 border border-indigo-500/20 text-sm text-indigo-300 font-mono truncate select-all">
            {referralLink || 'Loading...'}
          </div>
          <button
            onClick={copyLink}
            disabled={!referralLink}
            className={`flex items-center gap-2 px-4 py-3 rounded-xl font-semibold text-sm transition shrink-0 ${
              copied
                ? 'bg-emerald-600 text-white'
                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
            }`}
          >
            {copied ? <CheckCircle2 size={15} /> : <Copy size={15} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
        </div>

        <div className="flex items-start gap-2 px-4 py-3 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-xs text-indigo-300">
          <Clock size={13} className="shrink-0 mt-0.5" />
          Commission is earned when your referee purchases any course within 30 days of signup.
          Points are added to your balance instantly after their payment clears.
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
          <AlertCircle size={16} className="shrink-0" />
          <span>{error}</span>
          <button onClick={fetchData} className="ml-auto flex items-center gap-1 text-xs hover:text-red-300 transition">
            <RefreshCw size={12} /> Retry
          </button>
        </div>
      )}

      {/* Referral History */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/40 border border-indigo-500/20 overflow-hidden">
        <div className="px-5 py-4 border-b border-indigo-500/10 flex items-center justify-between">
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Users size={16} className="text-indigo-400" /> Referral History
          </h2>
          {loading && <RefreshCw size={14} className="text-gray-500 animate-spin" />}
        </div>

        {!loading && (!data?.referrals || data.referrals.length === 0) ? (
          <div className="py-12 text-center text-gray-500 space-y-2">
            <Users size={36} className="mx-auto opacity-30" />
            <p className="text-sm">No referrals yet. Share your link to get started.</p>
          </div>
        ) : (
          <div className="divide-y divide-indigo-500/10">
            {(data?.referrals ?? []).map((ref) => (
              <div key={ref.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-indigo-500/5 transition">
                {/* Avatar placeholder */}
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gray-700 to-gray-600 flex items-center justify-center text-sm font-bold text-gray-300 shrink-0">
                  {ref.referee_name.slice(0, 1).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-white truncate">{ref.referee_name}</p>
                  <p className="text-xs text-gray-500">Joined {formatDate(ref.referred_at)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <StatusBadge status={ref.status} />
                  {ref.status === 'converted' && ref.commission_points && (
                    <span className="text-xs text-emerald-400 font-semibold">+{ref.commission_points} pts earned</span>
                  )}
                  {ref.status === 'pending' && (
                    <span className="text-xs text-gray-500">30-day window active</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Transaction History (collapsible) */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900/80 to-gray-800/40 border border-indigo-500/20 overflow-hidden">
        <button
          onClick={() => setTxExpanded(!txExpanded)}
          className="w-full px-5 py-4 flex items-center justify-between hover:bg-indigo-500/5 transition"
        >
          <h2 className="font-bold text-white text-base flex items-center gap-2">
            <Zap size={16} className="text-yellow-400" /> Points Transactions
          </h2>
          {txExpanded ? <ChevronUp size={16} className="text-gray-500" /> : <ChevronDown size={16} className="text-gray-500" />}
        </button>

        {txExpanded && (
          <div className="border-t border-indigo-500/10">
            {!loading && (!data?.transactions || data.transactions.length === 0) ? (
              <div className="py-10 text-center text-gray-500 text-sm">
                No transactions yet.
              </div>
            ) : (
              <div className="divide-y divide-indigo-500/10">
                {(data?.transactions ?? []).map((tx) => (
                  <div key={tx.id} className="flex items-center gap-4 px-5 py-3.5 hover:bg-indigo-500/5 transition">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white truncate">
                        {tx.description ?? tx.type.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-gray-500">{formatDate(tx.created_at)}</p>
                    </div>
                    <TxTypeBadge type={tx.type} points={tx.points} />
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* How it works */}
      <div className="rounded-2xl bg-gradient-to-br from-gray-900/40 to-gray-800/20 border border-indigo-500/10 p-6 space-y-4">
        <h3 className="font-bold text-gray-300 text-sm uppercase tracking-widest">How It Works</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {[
            { step: '1', title: 'Share Your Link', desc: 'Copy your unique referral link and send it to friends.' },
            { step: '2', title: 'They Sign Up & Buy', desc: 'Your friend signs up and purchases any course within 30 days.' },
            { step: '3', title: 'You Earn Points', desc: 'Instantly receive 10% of their purchase as spendable points (₦1 each).' },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-3">
              <div className="w-7 h-7 rounded-full bg-indigo-600 flex items-center justify-center text-xs font-black text-white shrink-0 mt-0.5">
                {step}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
