import React from 'react';
import AppShellLayout from '@/components/AppShell/AppShellLayout';
import AuthGuard from '@/components/AppShell/AuthGuard';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <AuthGuard>
      <AppShellLayout>{children}</AppShellLayout>
    </AuthGuard>
  );
}
