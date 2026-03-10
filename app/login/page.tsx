'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { demoUsers } from '@/lib/users';

export default function LoginPage() {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get('redirect') ?? '/dashboard';

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // If already logged in, go straight to dashboard
  useEffect(() => {
    if (!isLoading && user) router.replace(redirect);
  }, [user, isLoading, redirect, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Please enter your email and password.');
      return;
    }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      setError(result.error);
    } else {
      router.replace(redirect);
    }
  }

  // Quick-fill a demo user
  const fillDemo = (u: typeof demoUsers[0]) => {
    setEmail(u.email);
    setPassword(u.password);
    setError('');
  };

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      {/* Logo */}
      <Link href="/" className="text-2xl font-extrabold text-white mb-8 hover:text-indigo-300 transition">
        Learnify
      </Link>

      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)] p-8">
        <h1 className="text-2xl font-bold text-white">Welcome back</h1>
        <p className="text-gray-400 text-sm mt-1">Log in to continue learning</p>

        {/* Demo accounts */}
        <div className="mt-5 p-4 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
          <p className="text-xs font-semibold text-indigo-300 mb-3 uppercase tracking-wide">
            Demo Accounts — click to fill
          </p>
          <div className="space-y-2">
            {demoUsers.map((u) => (
              <button
                key={u.id}
                type="button"
                onClick={() => fillDemo(u)}
                className="w-full flex items-center justify-between px-3 py-2 rounded-lg bg-gray-900/60 border border-indigo-500/20 hover:border-indigo-500/50 transition text-left group"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {u.avatar}
                  </div>
                  <div>
                    <p className="text-xs font-medium text-gray-200 group-hover:text-white transition">{u.name}</p>
                    <p className="text-xs text-gray-500">{u.email}</p>
                  </div>
                </div>
                <span className="text-xs text-gray-600 group-hover:text-indigo-400 transition font-mono">{u.password}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleLogin} className="mt-6 space-y-4">
          {/* Email */}
          <div>
            <label className="text-sm font-medium text-gray-300">Email</label>
            <input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition"
            />
          </div>

          {/* Password */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-sm font-medium text-gray-300">Password</label>
              <Link href="/reset-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={15} className="flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm transition disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Log In'}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-5">
          Don't have an account?{' '}
          <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition font-medium">
            Sign up
          </Link>
        </p>
      </div>
    </div>
  );
}
