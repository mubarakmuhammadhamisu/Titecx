'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

export function StatCard({ title, value, icon: Icon, trend }: StatCardProps) {
  return (
    <div className="rounded-lg border border-indigo-500/20 bg-gray-900/50 p-6 backdrop-blur-sm">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400">{title}</p>
          <p className="mt-2 text-3xl font-bold text-white">{value}</p>
          {trend && (
            <p
              className={`mt-1 text-sm ${
                trend.isPositive ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {trend.isPositive ? '+' : '-'}{Math.abs(trend.value)}% vs last month
            </p>
          )}
        </div>
        <div className="rounded-lg bg-indigo-500/10 p-3">
          <Icon className="h-6 w-6 text-indigo-400" />
        </div>
      </div>
    </div>
  );
}
