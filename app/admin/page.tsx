'use client';

import React, { useState, useEffect } from 'react';
import { DollarSign, Users, BookOpen, TrendingUp, CheckCircle } from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { AdminStats, Payment } from '@/components/admin/adminTypes';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import { StatCard } from '@/components/admin/shared/StatCard';

function koboToNaira(k: number) { return k / 100; }
function fmt(k: number) { return `₦${koboToNaira(k).toLocaleString()}`; }

export default function AdminOverview() {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then((r) => r.json())
      .then((d) => { setStats(d); setLoading(false); })
      .catch(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-gray-400 text-sm animate-pulse">Loading dashboard…</div>
    </div>
  );

  const revenueData = (stats?.revenue_by_day ?? []).map((d) => ({
    date: d.date.slice(5),
    revenue: koboToNaira(d.revenue_kobo),
  }));

  const last7 = revenueData.slice(-7);
  const sparkRevenue = last7.map((d) => ({ v: d.revenue }));
  const totalRevenue = stats?.total_revenue_kobo ?? 0;
  const prevRevenue  = revenueData.slice(-14, -7).reduce((s, d) => s + d.revenue, 0);
  const curRevenue   = last7.reduce((s, d) => s + d.revenue, 0);
  const revTrend     = prevRevenue ? ((curRevenue - prevRevenue) / prevRevenue) * 100 : 0;

  const paymentColumns: Column<Payment>[] = [
    { key: 'student_name', label: 'Student',  sortable: true },
    { key: 'course_title', label: 'Course',   sortable: true },
    { key: 'amount_kobo',  label: 'Amount',   sortable: true, render: (v) => fmt(Number(v)) },
    { key: 'paid_at',      label: 'Date',     sortable: true, render: (v) => format(new Date(v as string), 'MMM d, yyyy') },
    {
      key: 'status', label: 'Status',
      render: (v) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
          <CheckCircle size={12} />{String(v)}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-gray-400">Overview of revenue, students, and enrollments.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue"
          value={fmt(totalRevenue)}
          icon={DollarSign}
          trend={{ value: Math.abs(Math.round(revTrend)), isPositive: revTrend >= 0 }}
          sparkData={sparkRevenue}
          sparkColor="pink"
        />
        <StatCard
          title="Total Students"
          value={stats?.total_students ?? 0}
          icon={Users}
          sparkData={sparkRevenue.map((d) => ({ v: Math.round(d.v / 5000) }))}
          sparkColor="green"
        />
        <StatCard
          title="Active Enrollments"
          value={stats?.active_enrollments ?? 0}
          icon={BookOpen}
          sparkData={sparkRevenue.map((d) => ({ v: Math.round(d.v / 8000) }))}
          sparkColor="pink"
        />
        <StatCard
          title="Completed Enrollments"
          value={stats?.completed_enrollments ?? 0}
          icon={TrendingUp}
          sparkData={sparkRevenue.map((d) => ({ v: Math.round(d.v / 15000) }))}
          sparkColor="green"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-pink-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md">
          <h2 className="mb-6 text-lg font-bold text-white">Daily Revenue — Last 30 Days</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="date" stroke="rgb(156,163,175)" style={{ fontSize: '11px' }} />
              <YAxis stroke="rgb(156,163,175)" style={{ fontSize: '11px' }} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(17,24,39,0.95)', border: '1px solid rgba(244,114,182,0.35)', borderRadius: '8px' }}
                formatter={(v) => [`₦${Number(v).toLocaleString()}`, 'Revenue']}
              />
              <defs>
                <linearGradient id="colRev" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f472b6" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0.08} />
                </linearGradient>
              </defs>
              <Bar dataKey="revenue" fill="url(#colRev)" radius={[6,6,0,0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md">
          <h2 className="mb-6 text-lg font-bold text-white">Revenue Trend</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={revenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(74,222,128,0.08)" />
              <XAxis dataKey="date" stroke="rgb(156,163,175)" style={{ fontSize: '11px' }} />
              <YAxis stroke="rgb(156,163,175)" style={{ fontSize: '11px' }} tickFormatter={(v) => `₦${(v/1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ backgroundColor: 'rgba(17,24,39,0.95)', border: '1px solid rgba(74,222,128,0.35)', borderRadius: '8px' }}
                formatter={(v) => [`₦${Number(v).toLocaleString()}`, 'Revenue']}
              />
              <Line type="monotone" dataKey="revenue" stroke="#4ade80" strokeWidth={2.5}
                dot={{ fill: '#4ade80', r: 3 }} activeDot={{ r: 5 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Recent Payments</h2>
        {(stats?.recent_payments ?? []).length > 0
          ? <AdminTable columns={paymentColumns} data={stats!.recent_payments} />
          : <p className="text-gray-500 text-sm">No payments yet.</p>
        }
      </div>
    </div>
  );
}
