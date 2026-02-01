'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, Home, BookOpen, User, BarChart3, Award } from 'lucide-react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: Home },
  { href: '/dashboard/my-courses', label: 'My Courses', icon: BookOpen },
  { href: '/dashboard/profile', label: 'Profile', icon: User },
  { href: '/dashboard/progress', label: 'Progress', icon: BarChart3 },
  { href: '/dashboard/achievements', label: 'Achievements', icon: Award },
];

export default function AppShellSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isActive = (href: string) => pathname === href;

  return (
    <>
      {/* Mobile Hamburger Button */}
      {isMobile && (
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="fixed top-6 right-6 z-50 p-2 rounded-xl bg-gray-900 border border-indigo-500/30 hover:border-indigo-500/60 transition"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      )}

      {/* Mobile Overlay */}
      <AnimatePresence>
        {isMobile && isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 bg-black/50 z-30"
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <motion.aside
        initial={isMobile ? { x: -280 } : false}
        animate={isMobile ? (isOpen ? { x: 0 } : { x: -280 }) : { x: 0 }}
        transition={{ type: 'spring', damping: 20, stiffness: 300 }}
        className={`fixed left-4 top-4 bottom-4 w-64 z-40 md:relative md:left-0 md:top-0 md:bottom-0 md:h-auto 
          bg-gray-950/40 backdrop-blur-md rounded-3xl border border-indigo-500/20 
          shadow-[0_0_40px_rgba(99,102,241,0.15)]
          p-6 overflow-y-auto`}
      >
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/50">
            M
          </div>
          <span className="text-lg font-bold text-white">Learnify</span>
        </Link>

        {/* Navigation */}
        <nav className="space-y-2">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={href} onClick={() => isMobile && setIsOpen(false)}>
                <motion.div
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition relative group
                    ${
                      active
                        ? 'bg-gray-900 text-indigo-400'
                        : 'text-gray-400 hover:text-gray-300'
                    }`}
                  whileHover={{ x: 4 }}
                  whileTap={{ scale: 0.98 }}
                >
                  {/* Active indicator glow */}
                  {active && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-indigo-500/10 to-purple-500/10 -z-10"
                      transition={{ type: 'spring', damping: 20 }}
                    />
                  )}

                  <Icon size={20} />
                  <span className="font-medium text-sm">{label}</span>
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="absolute bottom-6 left-6 right-6 pt-6 border-t border-indigo-500/10">
          <Link
            href="/"
            className="flex items-center gap-2 text-xs text-gray-400 hover:text-gray-300 transition"
          >
            ← Back to Site
          </Link>
        </div>
      </motion.aside>

      {/* Desktop spacer */}
      {!isMobile && <div className="hidden md:block w-80" />}
    </>
  );
}
