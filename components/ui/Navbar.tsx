import Link from "next/link";
import MobileMenu from "./MobileMenu";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-50 bg-gray-950/80 backdrop-blur border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
        {/* Logo */}
        <Link href="/"/*dashboard*/ className="text-xl font-bold text-white">
          Learnify
        </Link>

        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-gray-300">
          <Link href="/courses" className="hover:text-white">
            Courses
          </Link>
          <Link href="/pricing" className="hover:text-white">
            Pricing
          </Link>
          <Link href="/about" className="hover:text-white">
            About
          </Link>
          <Link href="/login" className="hover:text-white">
            Login
          </Link>
          <Link
            href="/register"
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg"
          >
            Get Started
          </Link>
        </nav>

        {/* Mobile menu */}
        <MobileMenu />
      </div>
    </header>
  );
}
