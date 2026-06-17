'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, User, BookOpen, CreditCard, Coins } from 'lucide-react';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { format } from 'date-fns';

function fmt(kobo: number) { return `₦${(kobo / 100).toLocaleString()}`; }

export default function StudentDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/admin/students/${id}`)
      .then((r) => r.json())
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-400 text-sm animate-pulse">Loading student…</div>
    </div>
  );
  if (!data?.profile) return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-400 text-sm"><ArrowLeft size={16} /> Back</button>
      <p className="text-red-400">Student not found.</p>
    </div>
  );

  const { profile, enrollments, payments, point_transactions } = data;

  const enrollCols: Column<any>[] = [
    { key: 'course_title', label: 'Course', sortable: true },
    { key: 'progress', label: 'Progress', sortable: true, render: (v) => (
      <div className="flex items-center gap-2">
        <div className="w-20 h-1.5 rounded-full bg-gray-700">
          <div className="h-full rounded-full bg-indigo-500" style={{ width: `${v}%` }} />
        </div>
        <span className="text-xs">{v}%</span>
      </div>
    )},
    { key: 'enrolled_at', label: 'Enrolled', sortable: true, render: (v) => format(new Date(v as string), 'MMM d, yyyy') },
    { key: 'purchase_type', label: 'Type', render: (v) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'free' ? 'bg-gray-500/10 text-gray-400' : 'bg-indigo-500/10 text-indigo-400'}`}>{String(v)}</span>
    )},
  ];

  const paymentCols: Column<any>[] = [
    { key: 'course_slug', label: 'Course', sortable: true },
    { key: 'amount_kobo', label: 'Amount', sortable: true, render: (v) => fmt(Number(v)) },
    { key: 'status', label: 'Status', render: (v) => (
      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${v === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>{String(v)}</span>
    )},
    { key: 'paid_at', label: 'Date', sortable: true, render: (v) => format(new Date(v as string), 'MMM d, yyyy') },
  ];

  const pointCols: Column<any>[] = [
    { key: 'type', label: 'Type', render: (v) => <span className="text-xs text-gray-300">{String(v).replace(/_/g, ' ')}</span> },
    { key: 'points', label: 'Points', sortable: true, render: (v, row) => (
      <span className={row.type === 'manual_deduction' || row.type === 'redemption' ? 'text-red-400' : 'text-green-400'}>
        {row.type === 'manual_deduction' || row.type === 'redemption' ? '-' : '+'}{v}
      </span>
    )},
    { key: 'description', label: 'Note', render: (v) => <span className="text-gray-400 text-xs">{String(v ?? '—')}</span> },
    { key: 'created_at', label: 'Date', sortable: true, render: (v) => format(new Date(v as string), 'MMM d, yyyy') },
  ];

  return (
    <div className="space-y-8">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 text-sm transition">
        <ArrowLeft size={16} /> Back to Students
      </button>

      {/* Profile card */}
      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-8">
        <div className="flex items-start gap-6">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-indigo-500/40 to-purple-500/40 flex items-center justify-center border border-indigo-500/30 shrink-0">
            <User size={28} className="text-indigo-300" />
          </div>
          <div className="flex-1">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-2xl font-bold text-white">{profile.name}</h1>
                <p className="text-gray-400 text-sm mt-1">{profile.email}</p>
                {profile.location && <p className="text-gray-500 text-xs mt-0.5">{profile.location}</p>}
              </div>
              <div className="flex flex-col items-end gap-2">
                <span className={`px-3 py-1 rounded-full text-xs font-semibold border
                  ${profile.is_banned ? 'bg-red-500/10 text-red-400 border-red-500/20'
                  : profile.role === 'Admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20'
                  : 'bg-green-500/10 text-green-400 border-green-500/20'}`}>
                  {profile.is_banned ? 'Banned' : profile.role}
                </span>
                <p className="text-xs text-gray-500">Joined {format(new Date(profile.created_at), 'MMM d, yyyy')}</p>
              </div>
            </div>
            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { label: 'Courses', value: enrollments.length, icon: BookOpen, color: 'text-indigo-400' },
                { label: 'Total Paid', value: fmt(payments.reduce((s: number, p: any) => s + (p.status === 'success' ? p.amount_kobo : 0), 0)), icon: CreditCard, color: 'text-emerald-400' },
                { label: 'Credits', value: `₦${profile.credit_balance?.toLocaleString() ?? 0}`, icon: Coins, color: 'text-amber-400' },
                { label: 'Lifetime Pts', value: profile.lifetime_points?.toLocaleString() ?? 0, icon: Coins, color: 'text-purple-400' },
              ].map(({ label, value, icon: Icon, color }) => (
                <div key={label} className="rounded-lg bg-gray-800/50 border border-gray-700 p-3">
                  <div className="flex items-center gap-2 mb-1">
                    <Icon size={13} className={color} />
                    <span className="text-xs text-gray-400">{label}</span>
                  </div>
                  <p className={`text-lg font-bold ${color}`}>{value}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Enrollments */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><BookOpen size={18} className="text-indigo-400" /> Enrollments</h2>
        {enrollments.length > 0
          ? <AdminTable columns={enrollCols} data={enrollments} />
          : <p className="text-gray-500 text-sm">No enrollments yet.</p>}
      </section>

      {/* Payments */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><CreditCard size={18} className="text-emerald-400" /> Payments</h2>
        {payments.length > 0
          ? <AdminTable columns={paymentCols} data={payments} />
          : <p className="text-gray-500 text-sm">No payments yet.</p>}
      </section>

      {/* Points */}
      <section className="space-y-3">
        <h2 className="text-lg font-bold text-white flex items-center gap-2"><Coins size={18} className="text-amber-400" /> Point Transactions</h2>
        {point_transactions.length > 0
          ? <AdminTable columns={pointCols} data={point_transactions} />
          : <p className="text-gray-500 text-sm">No transactions yet.</p>}
      </section>
    </div>
  );
}
