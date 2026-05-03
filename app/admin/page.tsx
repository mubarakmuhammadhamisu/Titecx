'use client';

import React, { useState } from 'react';
import { StatCard } from '@/components/admin/shared/StatCard';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import {
  getMetrics,
  getRecentPayments,
  mockRevenueData,
  mockReferralConversions,
  Payment,
} from '@/components/admin/mock-data';
import {
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle,
  GitBranch,
  Zap,
} from 'lucide-react';
import { format } from 'date-fns';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';

export default function AdminOverview() {
  const metrics = getMetrics();
  const recentPayments = getRecentPayments(5);
  const [lessonsToday] = useState(() => Math.floor(Math.random() * 50 + 10));
  const last7Revenue = mockRevenueData.slice(-7).map((d) => ({ v: d.revenue }));
  const last7Enrollments = mockRevenueData.slice(-7).map((d, i) => ({ v: Math.round((d.revenue / 15000) * (8 + i)) }));

  const paymentColumns: Column<Payment>[] = [
    { key: 'studentName', label: 'Student', sortable: true },
    { key: 'courseName', label: 'Course', sortable: true },
    {
      key: 'amount',
      label: 'Amount',
      sortable: true,
      render: (value) => `₦${value.toLocaleString()}`,
    },
    {
      key: 'date',
      label: 'Date',
      sortable: true,
      render: (value) => format(new Date(value), 'MMM d, yyyy'),
    },
    {
      key: 'status',
      label: 'Status',
      render: (value) => (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
          <CheckCircle size={12} />
          {String(value).charAt(0).toUpperCase() + String(value).slice(1)}
        </span>
      ),
    },
  ];

  const todayRevenue = mockRevenueData[mockRevenueData.length - 1]?.revenue || 0;
  const yesterdayRevenue = mockRevenueData[mockRevenueData.length - 2]?.revenue || 0;
  const revenueTrend = yesterdayRevenue
    ? ((todayRevenue - yesterdayRevenue) / yesterdayRevenue) * 100
    : 0;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Admin Dashboard</h1>
        <p className="mt-2 text-gray-400">
          Welcome to the Titecx admin panel. Manage courses, students, payments,
          and more.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
        <StatCard
          title="Total Revenue (This Month)"
          value={`₦${metrics.totalRevenue.toLocaleString()}`}
          icon={DollarSign}
          trend={{ value: Math.abs(revenueTrend), isPositive: revenueTrend >= 0 }}
          sparkData={last7Revenue}
          sparkColor="pink"
        />
        <StatCard
          title="Students Enrolled"
          value={metrics.totalStudents}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
          sparkData={last7Enrollments}
          sparkColor="green"
        />
        <StatCard
          title="Active Enrollments"
          value={metrics.activeEnrollments}
          icon={BookOpen}
          trend={{ value: 8, isPositive: true }}
          sparkData={last7Enrollments}
          sparkColor="pink"
        />
        <StatCard
          title="Lessons Completed Today"
          value={lessonsToday}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
          sparkData={last7Revenue.map((d) => ({ v: Math.round(d.v / 3000) }))}
          sparkColor="green"
        />
        <StatCard
          title="Credits Issued This Month"
          value={`₦${metrics.creditsIssuedThisMonth.toLocaleString()}`}
          icon={Zap}
          trend={{ value: 4, isPositive: true }}
          sparkData={last7Revenue.map((d) => ({ v: Math.round(d.v / 10000) }))}
          sparkColor="green"
        />
        <StatCard
          title="Pending Referrals"
          value={metrics.pendingReferrals}
          icon={GitBranch}
          trend={{ value: 2, isPositive: false }}
          sparkData={last7Enrollments}
          sparkColor="pink"
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bar Chart */}
        <div className="rounded-xl border border-pink-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md shadow-[0_0_28px_rgba(244,114,182,0.12)]">
          <h2 className="mb-6 text-lg font-bold text-white">
            Daily Revenue (Last 15 Days)
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockRevenueData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(99, 102, 241, 0.1)"
              />
              <XAxis
                dataKey="date"
                stroke="rgb(156, 163, 175)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="rgb(156, 163, 175)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(244, 114, 182, 0.35)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: any) => `₦${(value as number).toLocaleString()}`}
              />
              <Bar
                dataKey="revenue"
                fill="url(#colorRevenue)"
                radius={[8, 8, 0, 0]}
              />
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#f472b6" stopOpacity={0.85} />
                  <stop offset="95%" stopColor="#f472b6" stopOpacity={0.08} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend Line Chart */}
        <div className="rounded-xl border border-green-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md shadow-[0_0_28px_rgba(74,222,128,0.10)]">
          <h2 className="mb-6 text-lg font-bold text-white">
            Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockRevenueData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(74, 222, 128, 0.08)"
              />
              <XAxis
                dataKey="date"
                stroke="rgb(156, 163, 175)"
                style={{ fontSize: '12px' }}
              />
              <YAxis
                stroke="rgb(156, 163, 175)"
                style={{ fontSize: '12px' }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'rgba(17, 24, 39, 0.95)',
                  border: '1px solid rgba(74, 222, 128, 0.35)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: any) => `₦${(value as number).toLocaleString()}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#4ade80"
                strokeWidth={3}
                dot={{ fill: '#4ade80', r: 4 }}
                activeDot={{ r: 6, fill: '#4ade80', stroke: '#166534', strokeWidth: 2 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Referral Conversions Chart */}
        <div className="rounded-xl border border-emerald-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md shadow-[0_0_28px_rgba(52,211,153,0.08)]">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <GitBranch size={18} className="text-emerald-400" /> Referral Conversions (Last 7 Days)
            </h2>
            <span className="text-xs text-gray-500">
              {metrics.referralConversionsLast7Days.reduce((s, d) => s + d.conversions, 0)} total
            </span>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={mockReferralConversions}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(99,102,241,0.1)" />
              <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fill: '#6b7280', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: '#111827', border: '1px solid rgba(52,211,153,0.2)', borderRadius: '8px' }}
                labelStyle={{ color: '#9ca3af' }}
                itemStyle={{ color: '#34d399' }}
              />
              <Bar dataKey="conversions" fill="rgba(52,211,153,0.7)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Payments */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Recent Payments</h2>
        <AdminTable columns={paymentColumns} data={recentPayments} />
      </div>
    </div>
  );
}
