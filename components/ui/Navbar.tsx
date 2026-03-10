'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import MobileMenu from './MobileMenu';

export default function Navbar() {
  const pathname = usePathname();
  // TODO: replace with real auth check (e.g. useSession)
  const isLoggedIn = pathname.startsWith('/dashboard');

  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo — routes to dashboard if logged in */}
        <Link
          href={isLoggedIn ? '/dashboard' : '/'}
          className="text-xl font-bold text-white hover:text-indigo-300 transition"
        >
          Learnify
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          <Link href="/courses" className="hover:text-white transition">Courses</Link>
          <Link href="/pricing" className="hover:text-white transition">Pricing</Link>
          <Link href="/about" className="hover:text-white transition">About</Link>
          <Link href="/login" className="hover:text-white transition">Login</Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white font-semibold shadow-lg hover:opacity-90 transition"
          >
            Get Started
          </Link>
        </nav>

        <MobileMenu />
      </div>
    </header>
  );
}
