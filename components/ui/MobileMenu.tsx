"use client";

import { useState } from "react";
import Link from "next/link";

export default function MobileMenu() {
  const [open, setOpen] = useState(false);

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
        <div className="absolute left-0 top-16 w-full bg-gray-950 border-t border-white/10">
          <nav className="flex flex-col gap-4 p-6 text-sm">
            <Link href="/courses" onClick={() => setOpen(false)}>
              Courses
            </Link>
            <Link href="/pricing" onClick={() => setOpen(false)}>
              Pricing
            </Link>
            <Link href="/about" onClick={() => setOpen(false)}>
              About
            </Link>
            <Link href="/login" onClick={() => setOpen(false)}>
              Login
            </Link>
            <Link
              href="/register"
              onClick={() => setOpen(false)}
              className="mt-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-4 py-2 text-center text-white"
            >
              Get Started
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
