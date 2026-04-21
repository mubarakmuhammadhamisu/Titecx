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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
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

      {/* Revenue Chart Placeholder */}
      <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-6 backdrop-blur-sm">
        <h2 className="mb-6 text-xl font-bold text-white">
          Daily Revenue (Last 15 Days)
        </h2>
        <div className="relative h-64 w-full">
          <svg
            viewBox="0 0 800 200"
            className="w-full h-full"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 50, 100, 150, 200].map((y) => (
              <line
                key={`grid-${y}`}
                x1="0"
                y1={y}
                x2="800"
                y2={y}
                stroke="rgb(99, 102, 241)"
                strokeOpacity="0.1"
                strokeWidth="1"
              />
            ))}

            {/* Chart area */}
            <defs>
              <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="rgb(99, 102, 241)" stopOpacity="0.3" />
                <stop
                  offset="100%"
                  stopColor="rgb(99, 102, 241)"
                  stopOpacity="0"
                />
              </linearGradient>
            </defs>

            {/* Bars */}
            {mockRevenueData.map((data, index) => {
              const maxRevenue = Math.max(...mockRevenueData.map((d) => d.revenue));
              const barHeight = (data.revenue / maxRevenue) * 160;
              const x = (index / (mockRevenueData.length - 1)) * 750 + 25;
              return (
                <g key={data.date}>
                  <rect
                    x={x}
                    y={190 - barHeight}
                    width="40"
                    height={barHeight}
                    fill="url(#chartGradient)"
                    opacity="0.7"
                    rx="4"
                  />
                  <rect
                    x={x}
                    y={190 - barHeight}
                    width="40"
                    height={barHeight}
                    fill="none"
                    stroke="rgb(99, 102, 241)"
                    strokeWidth="1"
                    opacity="0.5"
                    rx="4"
                  />
                </g>
              );
            })}

            {/* Axis labels */}
            <text x="10" y="195" fontSize="12" fill="rgb(156, 163, 175)">
              ₦0
            </text>
            <text
              x="10"
              y="50"
              fontSize="12"
              fill="rgb(156, 163, 175)"
              textAnchor="start"
            >
              ₦250K
            </text>
          </svg>
        </div>
        <p className="mt-4 text-sm text-gray-400">
          Note: This chart displays mock data and will update with real analytics
          when backend integration is added.
        </p>
      </div>

      {/* Recent Payments */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-white">Recent Payments</h2>
        <AdminTable columns={paymentColumns} data={recentPayments} />
      </div>
    </div>
  );
}
