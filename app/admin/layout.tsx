'use client';

import React from 'react';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();
  const router = useRouter();

  // For now, we allow all authenticated users. In real backend:
  // Check if user.role === 'admin' and redirect to 403 if not
  useEffect(() => {
    if (!isLoading && !user) {
      router.replace('/login?redirect=/admin');
    }
  }, [user, isLoading, router]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 animate-pulse" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="max-w-[1440px] mx-auto min-h-screen flex gap-4 p-4 md:p-6 lg:gap-6">
        <AdminSidebar />
        <main className="flex-1 overflow-y-auto min-w-0">
          {children}
        </main>
      </div>
    </div>
  );
}
