'use client';

import React from 'react';
import AppShellSidebar from './AppShellSidebar';

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export default function AppShellLayout({ children }: AppShellLayoutProps) {
  return (
    // Outer shell caps width on ultra-wide displays and centers the whole UI
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-[1440px] mx-auto min-h-screen flex gap-4 p-4 md:p-6 lg:gap-6">
        <AppShellSidebar />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
