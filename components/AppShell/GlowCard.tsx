import React from 'react';

interface GlowCardProps {
  children: React.ReactNode;
  className?: string;
  gradient?: boolean;
  hero?: boolean;
}

export default function GlowCard({
  children,
  className = '',
  gradient = false,
  hero = false,
}: GlowCardProps) {
  if (hero) {
    return (
      <div
        className={`relative rounded-2xl overflow-hidden bg-linear-to-r from-indigo-500/30 to-purple-500/30
          border border-indigo-500/50 p-8 shadow-[0_0_40px_rgba(99,102,241,0.25)]
          ${className}`}
      >
        {children}
      </div>
    );
  }

  return (
    <div
      className={`relative rounded-2xl bg-gray-900 p-6
        border border-indigo-500/30 
        shadow-[0_0_30px_rgba(99,102,241,0.1)]
        hover:shadow-[0_0_40px_rgba(99,102,241,0.2)]
        hover:border-indigo-500/50
        transition-all duration-300
        ${className}`}
    >
      {/* Gradient border effect */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none
          bg-linear-to-r from-indigo-500/0 via-indigo-500/0 to-purple-500/0
          opacity-0 group-hover:opacity-100 transition-opacity"
      />
      {children}
    </div>
  );
}
