'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { Eye, EyeOff, AlertCircle, MailCheck, RefreshCw } from 'lucide-react';

// ── Resend verification panel ─────────────────────────────────────────────────
// Shown only when Supabase returns an "Email not confirmed" error.
// Lets the user request a fresh link without re-registering.
function ResendPanel({ email, onBack }: { email: string; onBack: () => void }) {
  const [status, setStatus] = useState<'idle' | 'sending' | 'sent' | 'error'>('idle');

  const handleResend = async () => {
    setStatus('sending');
    const { error } = await supabase.auth.resend({ type: 'signup', email });
    setStatus(error ? 'error' : 'sent');
  };

  return (
    <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)] p-8 text-center">
      <div className="w-14 h-14 rounded-full bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center mx-auto mb-4">
        <MailCheck size={26} className="text-indigo-400" />
      </div>
      <h2 className="text-xl font-bold text-white mb-2">Email not verified</h2>
      <p className="text-gray-400 text-sm leading-relaxed mb-1">
        Your account exists but the confirmation link hasn&apos;t been clicked yet.
      </p>
      <p className="text-gray-400 text-sm leading-relaxed mb-6">
        We&apos;ll send a fresh link to{' '}
        <span className="text-white font-medium">{email}</span>.
      </p>

      {status === 'sent' ? (
        <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm mb-5">
          ✓ New link sent — check your inbox (and spam folder).
        </div>
      ) : status === 'error' ? (
        <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm mb-5">
          <AlertCircle size={14} className="shrink-0" />
          Could not send the link. Please try again in a minute.
        </div>
      ) : null}

      <button
        onClick={handleResend}
        disabled={status === 'sending' || status === 'sent'}
        className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm transition disabled:opacity-60 flex items-center justify-center gap-2"
      >
        {status === 'sending'
          ? <><RefreshCw size={15} className="animate-spin" /> Sending…</>
          : status === 'sent'
          ? 'Link sent!'
          : 'Resend verification email'}
      </button>

      <button
        onClick={onBack}
        className="mt-4 text-sm text-gray-500 hover:text-gray-300 transition"
      >
        ← Back to login
      </button>
    </div>
  );
}

const LoginContent = () => {
  const { login, user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Sanitise: only allow relative paths starting with /  — reject absolute
  // URLs like https://evil.com and protocol-relative URLs like //evil.com.
  const raw = searchParams.get('redirect') ?? '/dashboard';
  const redirect = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';

  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw]     = useState(false);
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);
  // When true, show the resend panel instead of the login form
  const [showResend, setShowResend] = useState(false);

  // Refs for Enter-key focus chaining.
  // Email → Password → (Enter submits — password is the last field)
  const passwordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && user) router.replace(redirect);
  }, [user, isLoading, redirect, router]);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please enter your email and password.'); return; }
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.error) {
      // Supabase returns this exact string when email confirmation is pending.
      // Detect it and show the resend panel instead of a raw error message.
      if (
        result.error.toLowerCase().includes('email not confirmed') ||
        result.error.toLowerCase().includes('not confirmed')
      ) {
        setShowResend(true);
        return;
      }
      setError(result.error);
    } else {
      router.replace(redirect);
    }
  }

  // Move focus to the next field on Enter instead of submitting.
  // Called only on non-final fields — final field (password) lets the
  // form's onSubmit handle Enter naturally.
  function focusNext(
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | null>
  ) {
    if (e.key === 'Enter') {
      e.preventDefault(); // stop form submission
      nextRef.current?.focus();
    }
  }

  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <Link href="/" className="text-2xl font-extrabold text-white mb-8 hover:text-indigo-300 transition">
        TITECX
      </Link>

      {/* Show resend panel when email not confirmed, otherwise show login form */}
      {showResend ? (
        <ResendPanel email={email} onBack={() => { setShowResend(false); setError(''); }} />
      ) : (
        <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)] p-8">
          <h1 className="text-2xl font-bold text-white">Welcome back</h1>
          <p className="text-gray-400 text-sm mt-1">Log in to continue learning</p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">

            {/* Email — Enter moves focus to Password */}
            <div>
              <label className="text-sm font-medium text-gray-300">Email</label>
              <input
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => focusNext(e, passwordRef)}
                className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition"
              />
            </div>

            {/* Password — last field, Enter submits the form */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-300">Password</label>
                <Link href="/reset-password" className="text-xs text-indigo-400 hover:text-indigo-300 transition">
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  ref={passwordRef}
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

            {error && (
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                <AlertCircle size={15} className="shrink-0" />
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm transition disabled:opacity-60"
            >
              {loading ? 'Signing in...' : 'Log In'}
            </button>
          </form>

          <p className="text-sm text-gray-400 text-center mt-5">
            Don&apos;t have an account?{' '}
            <Link href="/register" className="text-indigo-400 hover:text-indigo-300 transition font-medium">
              Sign up
            </Link>
          </p>
        </div>
      )}
    </div>
  );
};

export default function LoginPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 animate-pulse" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <LoginContent />
    </Suspense>
  );
}
