'use client';

import React from 'react';
import { StatCard } from '@/components/admin/shared/StatCard';
import { AdminTable, Column } from '@/components/admin/shared/AdminTable';
import {
  getMetrics,
  getRecentPayments,
  mockRevenueData,
  Payment,
} from '@/components/admin/mock-data';
import {
  DollarSign,
  Users,
  BookOpen,
  TrendingUp,
  CheckCircle,
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
        />
        <StatCard
          title="Students Enrolled"
          value={metrics.totalStudents}
          icon={Users}
          trend={{ value: 12, isPositive: true }}
        />
        <StatCard
          title="Active Enrollments"
          value={metrics.activeEnrollments}
          icon={BookOpen}
          trend={{ value: 8, isPositive: true }}
        />
        <StatCard
          title="Lessons Completed Today"
          value={Math.floor(Math.random() * 50 + 10)}
          icon={TrendingUp}
          trend={{ value: 5, isPositive: true }}
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Bar Chart */}
        <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md">
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
                  border: '1px solid rgba(99, 102, 241, 0.3)',
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
                  <stop offset="5%" stopColor="rgb(99, 102, 241)" stopOpacity={0.8} />
                  <stop offset="95%" stopColor="rgb(99, 102, 241)" stopOpacity={0.1} />
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Revenue Trend Line Chart */}
        <div className="rounded-xl border border-purple-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md">
          <h2 className="mb-6 text-lg font-bold text-white">
            Revenue Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={mockRevenueData}>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(168, 85, 247, 0.1)"
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
                  border: '1px solid rgba(168, 85, 247, 0.3)',
                  borderRadius: '8px',
                }}
                labelStyle={{ color: '#fff' }}
                formatter={(value: any) => `₦${(value as number).toLocaleString()}`}
              />
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="rgb(168, 85, 247)"
                strokeWidth={3}
                dot={{ fill: 'rgb(168, 85, 247)', r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
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
