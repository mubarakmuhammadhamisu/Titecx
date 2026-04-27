'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Menu,
  X,
  LayoutDashboard,
  Users,
  BookOpen,
  LogIn,
  CreditCard,
  Ticket,
  Trophy,
  Settings,
  LogOut,
  Package,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import TitecxForgeLogo from '../ui/TitecxForgeLogo';

const adminNavItems = [
  { href: '/admin', label: 'Overview', icon: LayoutDashboard },
  { href: '/admin/students', label: 'Students', icon: Users },
  { href: '/admin/courses', label: 'Courses', icon: BookOpen },
  { href: '/admin/enrollments', label: 'Enrollments', icon: LogIn },
  { href: '/admin/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin/coupons', label: 'Coupons', icon: Ticket },
  { href: '/admin/mystery-box', label: 'Mystery Box', icon: Package },
  { href: '/admin/leaderboard', label: 'Leaderboard', icon: Trophy },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminSidebar() {
  const { user, logout } = useAuth();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  const isActive = (href: string) =>
    href === '/admin' ? pathname === '/admin' : pathname.startsWith(href);

  return (
    <>
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-5 right-5 z-50 p-2 rounded-xl bg-gray-900 border border-indigo-500/30 hover:border-indigo-500/60 transition"
        >
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      )}

      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/60 z-30"
            aria-hidden="true"
          />
        )}
      </AnimatePresence>

      <motion.aside
        initial={isMobile ? { x: -280 } : false}
        animate={isMobile ? (isOpen ? { x: 0 } : { x: -280 }) : { x: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className="fixed left-4 top-4 bottom-4 w-64 z-40 md:relative md:left-auto md:top-auto md:bottom-auto md:w-64
          bg-gray-950/60 backdrop-blur-md rounded-3xl border border-indigo-500/20
          shadow-[0_0_40px_rgba(99,102,241,0.12)] p-6 overflow-y-auto flex flex-col shrink-0"
      >
        {/* Logo */}
        <Link
          href="/admin"
          className="flex items-center gap-3 mb-8 group"
          onClick={() => isMobile && setIsOpen(false)}
        >
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/40 group-hover:shadow-indigo-500/60 transition text-sm">
            <Image
              src="/im1.png"
              alt="Titecx logo"
              width={40}
              height={40}
              className="rounded-full w-full h-full object-cover"
            />
          </div>
          <div className="flex flex-col">
            <TitecxForgeLogo className="text-xl" />
            <span className="text-xs text-indigo-400">Admin</span>
          </div>
        </Link>

        {/* Nav */}
        <nav className="space-y-1 flex-1">
          {adminNavItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                onClick={() => isMobile && setIsOpen(false)}
              >
                <motion.div
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition relative
                    ${
                      active
                        ? 'bg-indigo-500/15 text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800/50'
                    }`}
                  whileHover={{ x: 3 }}
                  whileTap={{ scale: 0.97 }}
                >
                  {active && (
                    <motion.div
                      layoutId="admin-sidebar-active"
                      className="absolute inset-0 rounded-2xl bg-linear-to-r from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 -z-10"
                      transition={{ type: 'spring', damping: 22 }}
                    />
                  )}
                  <Icon size={18} className={active ? 'text-indigo-400' : ''} />
                  <span className="font-medium text-sm">{label}</span>
                  {active && (
                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="pt-4 mt-4 border-t border-indigo-500/10 space-y-3">
          {user && (
            <div className="flex items-center gap-3 px-2">
              <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 bg-linear-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white">
                {user.avatarUrl ? (
                  <Image
                    src={user.avatarUrl}
                    alt={user.name}
                    width={32}
                    height={32}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  user.avatar
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-white truncate">
                  {user.name.split(' ')[0]}
                </p>
                <p className="text-xs text-gray-500 truncate">{user.email}</p>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-4 py-2.5 rounded-xl text-gray-400 hover:text-red-400 hover:bg-red-500/10 transition text-sm font-medium"
          >
            <LogOut size={16} />
            Log out
          </button>
        </div>
      </motion.aside>
    </>
  );
}
