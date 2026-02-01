'use client';

import { useState } from 'react';
import DashboardSidebar from './DashboardSidebar';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100">
      <DashboardSidebar isOpen={sidebarOpen} onClose={toggleSidebar} />

      {/* Main Content */}
      <main className="md:ml-64 transition-all duration-300">
        <div className="p-4 md:p-8">
          {/* Mobile Header Spacing */}
          <div className="h-12 md:h-0" />
          {children}
        </div>
      </main>
    </div>
  );
}
