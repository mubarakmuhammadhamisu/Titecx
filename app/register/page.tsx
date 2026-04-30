'use client';

import React, { Suspense, useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';

// ── Password strength ─────────────────────────────────────────────────────────
function getStrength(pw: string): number {
  if (!pw) return 0;
  const hasMin  = pw.length >= 8;
  const hasGood = pw.length >= 12;
  const hasMix  = /[0-9]/.test(pw) || /[^a-zA-Z0-9]/.test(pw);
  return !hasMin ? 1 : !hasMix ? 2 : hasGood ? 4 : 3;
}
const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];
const STRENGTH_LABELS = ['', 'Too simple', 'Add numbers or symbols', 'Good', 'Strong'];
const STRENGTH_TEXT   = ['', 'text-red-400', 'text-yellow-400', 'text-blue-400', 'text-emerald-400'];

// ── Main content ──────────────────────────────────────────────────────────────
const RegisterContent = () => {
  const { register, user, isLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  // Sanitise: only allow relative paths starting with /  — reject absolute
  // URLs like https://evil.com and protocol-relative URLs like //evil.com.
  const raw = searchParams.get('redirect') ?? '/dashboard';
  const refCode = (searchParams.get('ref') ?? '').trim().toUpperCase().replace(/[^A-Z0-9-]/g, '');
  const redirect = raw.startsWith('/') && !raw.startsWith('//') ? raw : '/dashboard';

  const [name, setName]                   = useState('');
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPw, setShowPw]               = useState(false);
  const [showConfirmPw, setShowConfirmPw] = useState(false);
  const [error, setError]                 = useState('');
  const [success, setSuccess]             = useState(false);
  const [loading, setLoading]             = useState(false);

  // Refs for Enter-key focus chaining:
  // Name → Email → Password → Confirm Password → (Enter submits)
  const emailRef          = useRef<HTMLInputElement>(null);
  const passwordRef       = useRef<HTMLInputElement>(null);
  const confirmPasswordRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isLoading && user) router.replace(redirect);
  }, [user, isLoading, redirect, router]);

  const strength = getStrength(password);

  // Confirm password match indicator — only shown once the user starts typing
  const confirmMismatch = confirmPassword.length > 0 && confirmPassword !== password;
  const confirmMatch    = confirmPassword.length > 0 && confirmPassword === password;

  // Move focus to the next field on Enter instead of submitting.
  // Only called on non-final fields.
  function focusNext(
    e: React.KeyboardEvent<HTMLInputElement>,
    nextRef: React.RefObject<HTMLInputElement | null>
  ) {
    if (e.key === 'Enter') {
      e.preventDefault();
      nextRef.current?.focus();
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    // Client-side validation — in this order so the user gets the most
    // actionable error first
    if (!name.trim())          { setError('Please enter your full name.'); return; }
    if (!email)                { setError('Please enter your email.'); return; }
    if (password.length < 8)   { setError('Password must be at least 8 characters.'); return; }
    if (!confirmPassword)      { setError('Please confirm your password.'); return; }

    // Confirm password is validated CLIENT-SIDE only — only the real password
    // is sent to Supabase. This field never touches the server.
    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);
    const result = await register(name.trim(), email, password, refCode || undefined);
    setLoading(false);
    if (result.error) { setError(result.error); } else { setSuccess(true); }
  }

  // ── Success screen ──────────────────────────────────────────────────────────
  if (success) {
    return (
      <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
        <Link href="/" className="text-2xl font-extrabold text-white mb-8 hover:text-indigo-300 transition">
          TITECX
        </Link>
        <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-emerald-500/30 shadow-[0_0_40px_rgba(99,102,241,0.1)] p-8 text-center">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 size={32} className="text-emerald-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 text-sm leading-relaxed">
            We sent a confirmation link to{' '}
            <span className="text-white font-medium">{email}</span>.
            Click the link to activate your account, then log in.
          </p>
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="mt-6 inline-block px-6 py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  // ── Registration form ───────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <Link href="/" className="text-2xl font-extrabold text-white mb-8 hover:text-indigo-300 transition">
        TITECX
      </Link>

      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)] p-8">
        <h1 className="text-2xl font-bold text-white">Create your account</h1>
        <p className="text-gray-400 text-sm mt-1">Start learning in minutes</p>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">

          {/* Full Name — Enter moves to Email */}
          <div>
            <label className="text-sm font-medium text-gray-300">Full Name</label>
            <input
              type="text"
              placeholder="Your full name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => focusNext(e, emailRef)}
              className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition"
            />
          </div>

          {/* Email — Enter moves to Password */}
          <div>
            <label className="text-sm font-medium text-gray-300">Email</label>
            <input
              ref={emailRef}
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => focusNext(e, passwordRef)}
              className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition"
            />
          </div>

          {/* Password — Enter moves to Confirm Password */}
          <div>
            <label className="text-sm font-medium text-gray-300">Password</label>
            <div className="relative mt-1.5">
              <input
                ref={passwordRef}
                type={showPw ? 'text' : 'password'}
                placeholder="At least 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => focusNext(e, confirmPasswordRef)}
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
            {/* Strength meter */}
            {password && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${
                        i <= strength ? STRENGTH_COLORS[strength] : 'bg-gray-700'
                      }`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${STRENGTH_TEXT[strength]}`}>
                  {STRENGTH_LABELS[strength]}
                </p>
              </div>
            )}
          </div>

          {/* Confirm Password — last field, Enter submits */}
          <div>
            <label className="text-sm font-medium text-gray-300">Confirm Password</label>
            <div className="relative mt-1.5">
              <input
                ref={confirmPasswordRef}
                type={showConfirmPw ? 'text' : 'password'}
                placeholder="Re-enter your password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                // No onKeyDown — Enter on this final field submits the form
                className={`w-full px-4 py-3 pr-10 rounded-lg bg-gray-800 border text-white text-sm placeholder-gray-500 focus:outline-none transition ${
                  confirmMismatch
                    ? 'border-red-500/60 focus:border-red-500'
                    : confirmMatch
                    ? 'border-emerald-500/60 focus:border-emerald-500'
                    : 'border-indigo-500/20 focus:border-indigo-500/60'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowConfirmPw(!showConfirmPw)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition"
              >
                {showConfirmPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Real-time feedback below the confirm field */}
            {confirmMismatch && (
              <p className="text-xs text-red-400 mt-1">Passwords do not match</p>
            )}
            {confirmMatch && (
              <p className="text-xs text-emerald-400 mt-1 flex items-center gap-1">
                <CheckCircle2 size={11} /> Passwords match
              </p>
            )}
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0" />
              {error}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold text-sm transition disabled:opacity-60"
          >
            {loading ? 'Creating account...' : 'Create Account'}
          </button>
        </form>

        <p className="text-sm text-gray-400 text-center mt-5">
          Already have an account?{' '}
          <Link
            href={`/login?redirect=${encodeURIComponent(redirect)}`}
            className="text-indigo-400 hover:text-indigo-300 transition font-medium"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
};

export default function RegisterPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 animate-pulse" />
          <p className="text-gray-400 text-sm">Loading...</p>
        </div>
      </div>
    }>
      <RegisterContent />
    </Suspense>
  );
}
