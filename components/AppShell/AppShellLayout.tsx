'use client';

import AppShellSidebar from './AppShellSidebar';

interface AppShellLayoutProps {
  children: React.ReactNode;
}

export default function AppShellLayout({ children }: AppShellLayoutProps) {
  return (
    <div className="min-h-screen bg-gray-950 flex gap-4 p-4 md:p-6 lg:gap-6">
      <AppShellSidebar />
      <main className="flex-1 overflow-y-auto w-full lg:w-auto">
        {children}
      </main>
    </div>
  );
}
