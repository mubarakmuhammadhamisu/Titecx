'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import MobileMenu from './MobileMenu';
import { LayoutDashboard } from 'lucide-react';

export default function Navbar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // On dashboard routes the AppShell sidebar takes over — no top navbar needed
  const isDashboard = pathname.startsWith('/dashboard');
  if (isDashboard) return null;

  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link
          href={user ? '/dashboard' : '/'}
          className="text-xl font-bold text-white hover:text-indigo-300 transition"
        >
          TITECX
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          {/* Public links — hidden once logged in */}
          {!user && (
            <>
              <Link href="/courses" className="hover:text-white transition">Courses</Link>
              <Link href="/about" className="hover:text-white transition">About</Link>
            </>
          )}

          {user ? (
            /* Logged in — show dashboard button only */
            <Link
              href="/dashboard"
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:opacity-90 transition"
            >
              <LayoutDashboard size={15} />
              Dashboard
            </Link>
          ) : (
            /* Not logged in — show login + register */
            <>
              <Link href="/login" className="hover:text-white transition">Login</Link>
              <Link
                href="/register"
                className="px-4 py-2 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:opacity-90 transition"
              >
                Get Started
              </Link>
            </>
          )}
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
