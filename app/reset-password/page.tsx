'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { AlertCircle, CheckCircle2, Eye, EyeOff } from 'lucide-react';

// ─────────────────────────────────────────────────────────────────────────────
// This page handles TWO cases:
//
// Case 1 — User lands from the "Forgot password?" link: enter email to send link.
//
// Case 2 — User lands from the email link (has a recovery token).
//   Supabase may deliver the token as:
//     a) Query param:  /reset-password?type=recovery&...
//     b) Hash fragment: /reset-password#access_token=...&type=recovery
//   We check both to guarantee the "Set new password" form always shows.
// ─────────────────────────────────────────────────────────────────────────────

// ── Password strength ─────────────────────────────────────────────────────────
// Returns 0–4. Scoring goes beyond length: requires a number or symbol to
// reach green, so "aaaaaaaaaaaa" stays yellow even at 12 chars.
function getStrength(pw: string): number {
  if (!pw) return 0;
  const hasMinLength  = pw.length >= 8;
  const hasGoodLength = pw.length >= 12;
  const hasMix        = /[0-9]/.test(pw) || /[^a-zA-Z0-9]/.test(pw);
  // Evaluate most-specific condition first so level 4 is reachable.
  // Mirror the safe ternary used on the registration page.
  return !hasMinLength        ? 1   // red    — too short
       : !hasMix              ? 2   // yellow — no numbers/symbols
       : hasGoodLength        ? 4   // green  — 12+ chars + mix (most specific)
       :                        3;  // blue   — 8–11 chars + mix
}

const STRENGTH_COLORS = ['', 'bg-red-500', 'bg-yellow-500', 'bg-blue-500', 'bg-emerald-500'];
const STRENGTH_LABELS = ['', 'Too simple', 'Add numbers or symbols', 'Good', 'Strong'];

function ResetPasswordContent() {
  const searchParams = useSearchParams();

  // Detect recovery flow from EITHER query param OR hash fragment.
  // Supabase's behaviour differs across versions and email clients.
  const [isRecoveryFlow, setIsRecoveryFlow] = useState(false);
  // true when the recovery token exists in the URL but is expired or already used.
  // Supabase only validates the token when auth.updateUser() is called, but we
  // can detect expiry earlier by checking whether a valid session exists after
  // Supabase processes the token in the URL hash.
  const [tokenExpired, setTokenExpired] = useState(false);

  useEffect(() => {
    const checkRecovery = async () => {
      const fromQuery = searchParams.get('type') === 'recovery';
      const hash = typeof window !== 'undefined' ? window.location.hash : '';
      const fromHash = hash.includes('type=recovery');

      if (!fromQuery && !fromHash) return;

      // Token exists in URL — check whether Supabase established a valid session
      // from it. getUser() validates the token with Supabase's servers, so an
      // expired or already-used token correctly returns null here instead of
      // being accepted from the local cache.
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setIsRecoveryFlow(true);
      } else {
        setTokenExpired(true);
      }
    };

    checkRecovery();
  }, [searchParams]);

  // ── Case 1: Request reset email ──────────────────────────────────────────
  const [email, setEmail] = useState('');
  const [emailSent, setEmailSent] = useState(false);
  const [emailLoading, setEmailLoading] = useState(false);
  const [emailError, setEmailError] = useState('');

  async function handleRequestReset(e: React.FormEvent) {
    e.preventDefault();
    setEmailError('');
    if (!email) { setEmailError('Please enter your email.'); return; }
    setEmailLoading(true);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?type=recovery`,
    });

    setEmailLoading(false);
    if (error) {
      setEmailError(error.message);
    } else {
      setEmailSent(true);
    }
  }

  // ── Case 2: Set new password ──────────────────────────────────────────────
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [pwLoading, setPwLoading] = useState(false);
  const [pwError, setPwError] = useState('');
  const [pwDone, setPwDone] = useState(false);

  const strength = getStrength(newPw);

  async function handleSetNewPassword(e: React.FormEvent) {
    e.preventDefault();
    setPwError('');
    if (newPw.length < 8) { setPwError('Password must be at least 8 characters.'); return; }
    if (strength < 3) { setPwError('Please add numbers or symbols to strengthen your password.'); return; }
    if (newPw !== confirmPw) { setPwError('Passwords do not match.'); return; }
    setPwLoading(true);

    const { error } = await supabase.auth.updateUser({ password: newPw });
    setPwLoading(false);

    if (error) {
      setPwError(error.message);
    } else {
      setPwDone(true);
    }
  }

  // ── Shared card wrapper ───────────────────────────────────────────────────
  const Card = ({ children }: { children: React.ReactNode }) => (
    <div className="min-h-screen bg-gray-950 text-gray-100 flex flex-col items-center justify-center px-4">
      <Link href="/" className="text-2xl font-extrabold text-white mb-8 hover:text-indigo-300 transition">
        TITECX
      </Link>
      <div className="w-full max-w-md bg-gray-900 rounded-2xl border border-indigo-500/20 shadow-[0_0_40px_rgba(99,102,241,0.1)] p-8">
        {children}
      </div>
    </div>
  );

  // ── Case: reset link is expired or already used ───────────────────────────
  if (tokenExpired) {
    return (
      <Card>
        <div className="text-center">
          <div className="w-14 h-14 rounded-full bg-yellow-500/10 border border-yellow-500/20
                          flex items-center justify-center mx-auto mb-4">
            <AlertCircle size={28} className="text-yellow-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">Link expired</h1>
          <p className="text-gray-400 text-sm mb-6 leading-relaxed">
            This password reset link has expired or has already been used.
            Links are valid for 1 hour. Request a new one below.
          </p>
          <button
            onClick={() => setTokenExpired(false)}
            className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600
                       text-white font-semibold text-sm transition hover:opacity-90"
          >
            Request a New Link
          </button>
          <Link href="/login" className="block mt-4 text-sm text-gray-500 hover:text-gray-300 transition">
            ← Back to login
          </Link>
        </div>
      </Card>
    );
  }

  // ── Case 2: password updated successfully ─────────────────────────────────
  if (isRecoveryFlow && pwDone) {
    return (
      <Card>
        <div className="text-center">
          <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Password updated!</h1>
          <p className="text-gray-400 text-sm mb-6">You can now log in with your new password.</p>
          <Link href="/login" className="inline-block px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition">
            Go to Login
          </Link>
        </div>
      </Card>
    );
  }

  // ── Case 2: set new password form ─────────────────────────────────────────
  if (isRecoveryFlow) {
    return (
      <Card>
        <h1 className="text-2xl font-bold text-white">Set new password</h1>
        <p className="text-gray-400 text-sm mt-1 mb-6">Choose a strong password for your account.</p>
        <form onSubmit={handleSetNewPassword} className="space-y-4">
          <div>
            <label className="text-sm font-medium text-gray-300">New Password</label>
            <div className="relative mt-1.5">
              <input
                type={showNew ? 'text' : 'password'}
                placeholder="At least 8 characters + numbers/symbols"
                value={newPw}
                onChange={(e) => setNewPw(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition"
              />
              <button type="button" onClick={() => setShowNew(!showNew)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
            {/* Strength meter */}
            {newPw && (
              <div className="mt-2 space-y-1">
                <div className="flex gap-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? STRENGTH_COLORS[strength] : 'bg-gray-700'}`}
                    />
                  ))}
                </div>
                <p className={`text-xs ${strength >= 3 ? 'text-emerald-400' : strength === 2 ? 'text-yellow-400' : 'text-red-400'}`}>
                  {STRENGTH_LABELS[strength]}
                </p>
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-gray-300">Confirm Password</label>
            <div className="relative mt-1.5">
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="Re-enter new password"
                value={confirmPw}
                onChange={(e) => setConfirmPw(e.target.value)}
                className="w-full px-4 py-3 pr-10 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-indigo-500/60 transition"
              />
              <button type="button" onClick={() => setShowConfirm(!showConfirm)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition">
                {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          {pwError && (
            <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
              <AlertCircle size={15} className="shrink-0" />{pwError}
            </div>
          )}
          <button type="submit" disabled={pwLoading} className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm transition disabled:opacity-60">
            {pwLoading ? 'Updating...' : 'Update Password'}
          </button>
        </form>
      </Card>
    );
  }

  // ── Case 1: email sent confirmation ──────────────────────────────────────
  if (emailSent) {
    return (
      <Card>
        <div className="text-center">
          <CheckCircle2 size={40} className="text-emerald-400 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white mb-2">Check your email</h1>
          <p className="text-gray-400 text-sm">
            If an account exists for <span className="text-white">{email}</span>, we&apos;ve sent a reset link. Check your inbox.
          </p>
          <Link href="/login" className="mt-6 inline-block text-sm text-indigo-400 hover:text-indigo-300 transition">
            ← Back to login
          </Link>
        </div>
      </Card>
    );
  }

  // ── Case 1: request reset form ────────────────────────────────────────────
  return (
    <Card>
      <h1 className="text-2xl font-bold text-white">Forgot your password?</h1>
      <p className="text-gray-400 text-sm mt-1 mb-6">Enter your email and we&apos;ll send you a reset link.</p>
      <form onSubmit={handleRequestReset} className="space-y-4">
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
        {emailError && (
          <div className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle size={15} className="shrink-0" />{emailError}
          </div>
        )}
        <button type="submit" disabled={emailLoading} className="w-full py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 text-white font-semibold text-sm transition disabled:opacity-60">
          {emailLoading ? 'Sending...' : 'Send Reset Link'}
        </button>
      </form>
      <Link href="/login" className="block text-center text-sm text-gray-500 hover:text-gray-300 transition mt-4">
        ← Back to login
      </Link>
    </Card>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-10 h-10 rounded-full bg-linear-to-br from-indigo-500 to-purple-500 animate-pulse" />
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  );
}
