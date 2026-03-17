"use client";

import { useState } from "react";
import Link from "next/link";
import { LayoutDashboard, BookOpen, LogOut } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);
  const { user, logout } = useAuth();

  const close = () => setOpen(false);

  const handleLogout = async () => {
    close();
    await logout();
  };

  return (
    <div className="md:hidden">
      {/* Hamburger button */}
      <button
        onClick={() => setOpen(!open)}
        aria-label="Toggle menu"
        className="flex flex-col gap-1"
      >
        <span className="h-0.5 w-6 bg-white" />
        <span className="h-0.5 w-6 bg-white" />
        <span className="h-0.5 w-6 bg-white" />
      </button>

      {open && (
        <>
          {/* Backdrop — clicking it correctly sets open to false */}
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={close}
            aria-hidden="true"
          />

          <div className="absolute left-0 top-16 w-full bg-gray-950 border-t border-white/10 z-50">
            <nav className="flex flex-col gap-1 p-6 text-sm">
              {user ? (
                /* ── Logged-in state ── */
                <>
                  <Link
                    href="/dashboard"
                    onClick={close}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 text-gray-200 hover:text-white transition"
                  >
                    <LayoutDashboard size={16} className="text-indigo-400" />
                    Dashboard
                  </Link>
                  <Link
                    href="/dashboard/my-courses"
                    onClick={close}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-gray-800/60 text-gray-200 hover:text-white transition"
                  >
                    <BookOpen size={16} className="text-indigo-400" />
                    My Courses
                  </Link>
                  <div className="my-2 border-t border-white/10" />
                  <button
                    onClick={handleLogout}
                    className="flex items-center gap-2 px-3 py-2.5 rounded-xl hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition w-full text-left"
                  >
                    <LogOut size={16} />
                    Log out
                  </button>
                </>
              ) : (
                /* ── Guest state ── */
                <>
                  <Link href="/courses" onClick={close} className="px-3 py-2.5 rounded-xl hover:bg-gray-800/60 text-gray-200 hover:text-white transition">
                    Courses
                  </Link>
                  <Link href="/about" onClick={close} className="px-3 py-2.5 rounded-xl hover:bg-gray-800/60 text-gray-200 hover:text-white transition">
                    About
                  </Link>
                  <div className="my-2 border-t border-white/10" />
                  <Link href="/login" onClick={close} className="px-3 py-2.5 rounded-xl hover:bg-gray-800/60 text-gray-200 hover:text-white transition">
                    Login
                  </Link>
                  <Link
                    href="/register"
                    onClick={close}
                    className="mt-1 rounded-xl bg-linear-to-r from-indigo-500 to-purple-500 px-4 py-2.5 text-center text-white font-semibold"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
