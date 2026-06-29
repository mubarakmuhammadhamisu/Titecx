'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LogOut, LogIn } from 'lucide-react';

interface User {
  role: string;
  [key: string]: any;
}

interface RoleSwitcherButtonProps {
  user: User;
}

export default function RoleSwitcherButton({ user }: RoleSwitcherButtonProps) {
  const pathname = usePathname();

  // Return null for non-admin users
  if (user.role !== 'admin') {
    return null;
  }

  // Determine target route based on current path
  const isAdminRoute = pathname.startsWith('/admin');
  const targetHref = isAdminRoute ? '/dashboard' : '/admin';
  const isGoingToDashboard = isAdminRoute;

  return (
    <Link href={targetHref}>
      <motion.div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl transition relative
          text-gray-400 hover:text-gray-200 hover:bg-gray-800/50"
        whileHover={{ x: 3 }}
        whileTap={{ scale: 0.97 }}
      >
        {isGoingToDashboard ? (
          <>
            <LogOut size={18} />
            <span className="font-medium text-sm">Back to Dashboard</span>
          </>
        ) : (
          <>
            <LogIn size={18} />
            <span className="font-medium text-sm">Go to Admin</span>
          </>
        )}
      </motion.div>
    </Link>
  );
}
