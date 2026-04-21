'use client';

import React, { useState } from 'react';
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
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative rounded-xl border bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-6 backdrop-blur-md transition-all duration-300 ${
        isHovered
          ? 'border-indigo-400/60 shadow-lg shadow-indigo-500/20'
          : 'border-indigo-500/20'
      }`}
    >
      {/* Glow effect on hover */}
      {isHovered && (
        <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-indigo-500/10 to-transparent pointer-events-none" />
      )}

      <div className="relative z-10 flex items-start justify-between">
        <div className="flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">
            {title}
          </p>
          <p className="mt-2 text-4xl font-bold text-white">{value}</p>
          {trend && (
            <p
              className={`mt-2 text-sm font-medium ${
                trend.isPositive ? 'text-emerald-400' : 'text-rose-400'
              }`}
            >
              {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% vs last month
            </p>
          )}
        </div>
        <div className={`rounded-lg bg-gradient-to-br from-indigo-500/20 to-indigo-600/10 p-3 transition-transform duration-300 ${
          isHovered ? 'scale-110' : 'scale-100'
        }`}>
          <Icon className={`h-6 w-6 transition-colors duration-300 ${
            isHovered ? 'text-indigo-300' : 'text-indigo-400'
          }`} />
        </div>
      </div>
    </div>
  );
}
