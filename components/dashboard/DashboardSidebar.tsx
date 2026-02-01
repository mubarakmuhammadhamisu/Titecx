'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  User,
  BookOpen,
  BarChart3,
  Trophy,
  Menu,
  X,
} from 'lucide-react';

const navigationItems = [
  {
    label: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    label: 'My Courses',
    href: '/dashboard/my-courses',
    icon: BookOpen,
  },
  {
    label: 'Progress',
    href: '/dashboard/progress',
    icon: BarChart3,
  },
  {
    label: 'Achievements',
    href: '/dashboard/achievements',
    icon: Trophy,
  },
  {
    label: 'Profile',
    href: '/dashboard/profile',
    icon: User,
  },
];

interface DashboardSidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function DashboardSidebar({
  isOpen: externalIsOpen = false,
  onClose,
}: DashboardSidebarProps) {
  const pathname = usePathname();
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(!isMobile);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      setIsOpen(!mobile);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const sidebarIsOpen = isMobile ? externalIsOpen : isOpen;

  const isActive = (href: string) => {
    if (href === '/dashboard') {
      return pathname === '/dashboard';
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <div className="md:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => onClose?.()}
          className="p-2 rounded-lg bg-gray-900 border border-white/10 text-white hover:bg-gray-800 transition"
          aria-label="Toggle sidebar"
        >
          {sidebarIsOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Overlay for Mobile */}
      <AnimatePresence>
        {isMobile && sidebarIsOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="md:hidden fixed inset-0 bg-black/50 z-30"
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? { x: -280 } : false}
        animate={{
          x: sidebarIsOpen ? 0 : isMobile ? -280 : 0,
        }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="fixed md:sticky top-0 left-0 h-screen md:h-screen w-64 bg-gray-900 border-r border-white/10 z-40 overflow-y-auto"
      >
        {/* Logo/Header */}
        <div className="p-6 border-b border-white/10">
          <h2 className="text-xl font-bold text-white">Dashboard</h2>
          <p className="text-xs text-gray-400 mt-1">Student Portal</p>
        </div>

        {/* Navigation */}
        <nav className="p-4 space-y-2">
          {navigationItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);

            return (
              <Link key={item.href} href={item.href}>
                <motion.div
                  whileHover={{ x: 4 }}
                  className={`
                    relative flex items-center gap-3 px-4 py-3 rounded-lg transition-all
                    ${
                      active
                        ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                        : 'text-gray-300 hover:bg-gray-800/50 border border-transparent hover:border-white/10'
                    }
                  `}
                >
                  {active && (
                    <motion.div
                      layoutId="sidebar-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-gradient-to-b from-indigo-500 to-purple-500 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                  <Icon size={20} />
                  <span className="font-medium text-sm">{item.label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
          <Link href="/">
            <div className="flex items-center gap-2 px-4 py-3 rounded-lg text-gray-400 hover:text-gray-200 hover:bg-gray-800/50 transition text-sm font-medium">
              ← Back to Site
            </div>
          </Link>
        </div>
      </motion.aside>

      {/* Desktop Sidebar Toggle (Optional) */}
      <div className="hidden md:flex fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-lg bg-gray-900 border border-white/10 text-gray-400 hover:text-white hover:bg-gray-800 transition"
          aria-label="Toggle sidebar"
          title={isOpen ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>
    </>
  );
}
