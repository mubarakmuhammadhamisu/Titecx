'use client';

import React, { use, useState, useMemo, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';

import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Clock,
  BookOpen,
  Users,
  ChevronRight,
  CheckCircle2,
  Tag,
  ArrowLeft,
  Zap,
  Award,
  RefreshCw,
  Lock,
  AlertCircle,
} from 'lucide-react';

// ─── Paystack types ───────────────────────────────────────────────────────────
declare global {
  interface Window {
    PaystackPop: {
      setup(options: PaystackOptions): { openIframe(): void };
    };
  }
}
interface PaystackOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  metadata?: object;
  callback(response: { reference: string }): void;
  onClose(): void;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
function generateRef(slug: string) {
  return `LRN-${slug.slice(0, 6).toUpperCase()}-${Date.now()}`;
}

const PAYSTACK_PUBLIC_KEY = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? '';

// ─── Fetch /api/enroll with a 20-second timeout ───────────────────────────────
// Without a timeout, the fetch hangs forever on slow connections (e.g. 26 K/s).
// AbortController cancels the request after 20 seconds and throws 'TIMEOUT'
// so we can show a specific message telling the user their payment went through
// even if the enrollment confirmation timed out.
async function enrollWithTimeout(
  body: object
): Promise<{ enrolled?: boolean; alreadyExisted?: boolean; error?: string }> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 20_000);

  try {
    const res = await fetch('/api/enroll', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timeoutId);

    // Always try to parse JSON; if the server returned an HTML error page
    // (e.g. a Vercel 500 page), catch the JSON parse failure gracefully
    // instead of letting it bubble up to the outer catch as "Network error".
    const data = await res.json().catch(() => ({
      error: `Server error (HTTP ${res.status}). Please try again.`,
    }));
    return data;
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('TIMEOUT');
    }
    throw err;
  }
}

// ─── Component ────────────────────────────────────────────────────────────────
export default function CheckoutPage({ params }: { params: Promise<{ slug: string }> }) {
  const unwrapped = use(params);
  const { user, enroll, courses } = useAuth();

  const course = useMemo(
    () => courses.find((c) => c.slug === unwrapped.slug),
    [courses, unwrapped.slug]
  );

  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  // Tracks whether the Paystack inline script has finished loading.
  // We load it in a useEffect so we can detect when it's ready and
  // disable the Pay button until then — preventing the "PaystackPop
  // is not defined" error on slow connections.
  const [paystackReady, setPaystackReady] = useState(false);
  const [paystackLoadError, setPaystackLoadError] = useState(false);

  // Inline error shown below the Pay / Enroll button instead of alert().
  // Native alert() is blocking, unstyled, and on Android looks like a scam popup.
  const [paymentError, setPaymentError] = useState('');

  // Load the Paystack script once when the checkout page mounts.
  useEffect(() => {
    // Already loaded from a previous page visit — no need to add another tag.
    if (typeof window !== 'undefined' && window.PaystackPop) {
      setPaystackReady(true);
      return;
    }

    // Check if a script tag was already added (e.g. by a previous render).
    const existing = document.querySelector<HTMLScriptElement>(
      'script[src*="paystack"]'
    );
    if (existing) {
      const onLoad = () => setPaystackReady(true);
      const onError = () => setPaystackLoadError(true);
      existing.addEventListener('load', onLoad);
      existing.addEventListener('error', onError);
      return () => {
        existing.removeEventListener('load', onLoad);
        existing.removeEventListener('error', onError);
      };
    }

    const script = document.createElement('script');
    script.src = 'https://js.paystack.co/v1/inline.js';
    script.async = true;
    script.onload = () => setPaystackReady(true);
    script.onerror = () => setPaystackLoadError(true);
    document.body.appendChild(script);
    // Do not remove the script on unmount — PaystackPop stays in window scope.
  }, []);

  if (!course) {
    return (
      <div className="flex items-center justify-center min-h-[60vh] flex-col gap-4">
        <p className="text-gray-400 text-lg">Course not found.</p>
        <Link href="/dashboard/my-courses" className="text-indigo-400 hover:text-indigo-300 transition text-sm">
          ← Back to Courses
        </Link>
      </div>
    );
  }

  // ── Price calculation ────────────────────────────────────────────────────
  const isFree = course.price === 'Free';
  const rawPrice = course.price.replace(/[^\d]/g, '');
  const numericPrice = rawPrice ? parseInt(rawPrice, 10) : 0;
  const discount = couponApplied ? Math.floor(numericPrice * 0.1) : 0;
  const total = numericPrice - discount;
  const totalKobo = total * 100;

  const applyCoupon = async () => {
    setCouponError('');
    if (!coupon.trim()) { setCouponError('Please enter a coupon code.'); return; }

    // Validate server-side — the real coupon code lives in a server-only
    // env var (COUPON_CODE) and is never sent to the browser. This replaces
    // the old btoa() comparison which exposed the code in the client bundle.
    try {
      const res = await fetch('/api/validate-coupon', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coupon }),
      });
      const data = await res.json() as { valid: boolean };
      if (data.valid) {
        setCouponApplied(true);
      } else {
        setCouponError('Invalid coupon code.');
        setCouponApplied(false);
      }
    } catch {
      setCouponError('Could not validate coupon. Please try again.');
    }
  };

  // ── Free course enrollment ───────────────────────────────────────────────
  const handleFreeEnroll = async () => {
    if (!agreed || !user) return;
    setProcessing(true);
    setPaymentError('');

    try {
      const data = await enrollWithTimeout({
        courseSlug: course.slug,
        isFree: true,
      });

      if (data.enrolled) {
        enroll(course.slug);
        setDone(true);
      } else {
        setPaymentError(
          data.error ?? 'Enrollment failed. Please try again.'
        );
      }
    } catch (err: unknown) {
      const isTimeout = err instanceof Error && err.message === 'TIMEOUT';
      setPaymentError(
        isTimeout
          ? 'The request timed out — your internet connection may be slow. Please try again.'
          : 'A network error occurred. Please check your connection and try again.'
      );
    } finally {
      setProcessing(false);
    }
  };

  // ── Paid course — Paystack popup ─────────────────────────────────────────
  const handlePaystackPay = () => {
    if (!agreed || !user) return;
    setPaymentError('');

    // Guard: script not ready yet
    if (!window.PaystackPop) {
      setPaymentError(
        'The payment system is still loading. Please wait a moment and try again.'
      );
      return;
    }

    // Guard: public key missing
    if (!PAYSTACK_PUBLIC_KEY) {
      setPaymentError(
        'Payment is not configured on this server. Please contact support@TITECX.com.'
      );
      return;
    }

    const ref = generateRef(course.slug);

    const handler = window.PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: user.email,
      amount: totalKobo,
      currency: 'NGN',
      ref,
      metadata: {
        course_slug: course.slug,
        custom_fields: [
          { display_name: 'Course', variable_name: 'course', value: course.title },
          { display_name: 'Student', variable_name: 'student', value: user.name },
        ],
      },

      // Paystack calls this after a successful payment on their side.
      // We then call our own server to verify the reference and write
      // the enrollment to the database. Using .then()/.catch() (not async/await)
      // because Paystack's code doesn't await the return value of this callback.
      callback(response: { reference: string }) {
        setProcessing(true);
        setPaymentError('');

        enrollWithTimeout({
          reference: response.reference,
          courseSlug: course.slug,
        })
          .then((data) => {
            if (data.enrolled) {
              enroll(course.slug);
              setDone(true);
            } else {
              // Server responded but enrollment was rejected — show inline error.
              setPaymentError(
                `Enrollment failed: ${data.error ?? 'Unknown error'}. ` +
                `Your payment reference is ${response.reference}. ` +
                `Email support@TITECX.com with this reference and we will enroll you.`
              );
            }
          })
          .catch((err: unknown) => {
            // Network failure or timeout — payment likely went through on Paystack's
            // side but we couldn't confirm it. Show the reference prominently.
            const isTimeout = err instanceof Error && err.message === 'TIMEOUT';
            setPaymentError(
              isTimeout
                ? `Request timed out on your current connection. ` +
                  `Your payment reference is ${response.reference} — ` +
                  `your money was received by Paystack. ` +
                  `Email support@TITECX.com with this reference and we will complete your enrollment.`
                : `Network error after payment. ` +
                  `Your payment reference is ${response.reference}. ` +
                  `Email support@TITECX.com with this reference and we will enroll you manually.`
            );
          })
          .finally(() => {
            setProcessing(false);
          });
      },

      onClose() {
        setProcessing(false);
      },
    });

    handler.openIframe();
  };

  // ── Success screen ───────────────────────────────────────────────────────
  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-linear-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40">
            <CheckCircle2 size={44} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">You&apos;re enrolled!</h1>
          <p className="text-gray-400 mb-2">
            Welcome to <span className="text-indigo-300 font-semibold">{course.title}</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-8">
            <Link
              href={`/dashboard/courses/${course.slug}`}
              className="px-6 py-3 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition shadow-lg shadow-indigo-500/20"
            >
              Start Learning →
            </Link>
            <Link
              href="/dashboard"
              className="px-6 py-3 rounded-xl bg-gray-800 border border-indigo-500/20 hover:border-indigo-500/50 text-white font-medium transition"
            >
              Go to Dashboard
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-5xl mx-auto space-y-6">

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <Link href="/dashboard/my-courses" className="hover:text-gray-300 transition flex items-center gap-1">
          <ArrowLeft size={14} /> Courses
        </Link>
        <ChevronRight size={14} />
        <Link href={`/courses/${course.slug}`} className="hover:text-gray-300 transition truncate max-w-[160px]">
          {course.title}
        </Link>
        <ChevronRight size={14} />
        <span className="text-gray-300 font-medium">Checkout</span>
      </div>

      {/* Title */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Complete Your Enrollment</h1>
        <p className="text-gray-400 text-sm mt-1">You&apos;re one step away from unlocking this course.</p>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ── LEFT — Payment section ── */}
        <div className="lg:col-span-3 space-y-5">

          {isFree ? (
            /* FREE COURSE */
            <div className="rounded-2xl bg-gray-900 border border-emerald-500/30 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                  <Zap size={18} className="text-emerald-400" />
                </div>
                <div>
                  <p className="font-bold text-white">This course is completely free</p>
                  <p className="text-gray-400 text-xs">No payment information required.</p>
                </div>
              </div>

              <label className="flex items-start gap-3 cursor-pointer group mt-2">
                <div
                  onClick={() => setAgreed(!agreed)}
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition shrink-0 cursor-pointer ${agreed ? 'bg-indigo-600 border-indigo-500' : 'border-gray-600 group-hover:border-indigo-500/50'}`}
                >
                  {agreed && <CheckCircle2 size={12} className="text-white" />}
                </div>
                <span className="text-sm text-gray-400 leading-snug">
                  I agree to the{' '}
                  <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link>
                  {' '}and{' '}
                  <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
                </span>
              </label>

              {/* Inline error for free enrollment */}
              {paymentError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              <button
                onClick={handleFreeEnroll}
                disabled={!agreed || processing}
                className="w-full py-3.5 rounded-xl bg-linear-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                {processing ? 'Enrolling...' : 'Enroll for Free'}
              </button>
            </div>

          ) : (
            /* PAID COURSE — Paystack popup */
            <div className="space-y-5">

              {/* What Paystack handles */}
              <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-5 space-y-4">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Lock size={15} className="text-indigo-400" />
                  Secure Payment via Paystack
                </h2>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Clicking &quot;Pay Now&quot; opens a secure Paystack popup. Your card details are entered directly
                  on Paystack&apos;s encrypted form — we never see or store your card information.
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {['Credit / Debit Card', 'Bank Transfer', 'USSD', 'Mobile Money'].map((method) => (
                    <div key={method} className="flex items-center gap-2 text-xs text-gray-300 bg-gray-800/60 rounded-lg px-3 py-2 border border-indigo-500/10">
                      <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                      {method}
                    </div>
                  ))}
                </div>
              </div>

              {/* Paystack script load error */}
              {paystackLoadError && (
                <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm">
                  <AlertCircle size={15} className="shrink-0 mt-0.5" />
                  <span>
                    Payment system failed to load. This is often caused by an ad blocker.
                    Please disable your ad blocker or try a different browser.
                  </span>
                </div>
              )}

              {/* Coupon */}
              <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-5 space-y-3">
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Tag size={16} className="text-indigo-400" /> Coupon Code
                </h2>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter promo code"
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(''); setCouponApplied(false); }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition"
                  />
                  <button
                    onClick={applyCoupon}
                    className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> 10% discount applied!
                  </p>
                )}
                {couponError && <p className="text-xs text-red-400">{couponError}</p>}
              </div>

              {/* Terms + Pay button */}
              <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-5 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setAgreed(!agreed)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition shrink-0 cursor-pointer ${agreed ? 'bg-indigo-600 border-indigo-500' : 'border-gray-600 group-hover:border-indigo-500/50'}`}
                  >
                    {agreed && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-400 leading-snug">
                    I agree to the{' '}
                    <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
                  </span>
                </label>

                {/* Inline error — shown instead of alert() */}
                {paymentError && (
                  <div className="flex items-start gap-2 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
                    <AlertCircle size={15} className="shrink-0 mt-0.5" />
                    <span className="leading-relaxed">{paymentError}</span>
                  </div>
                )}

                <button
                  onClick={handlePaystackPay}
                  disabled={!agreed || !paystackReady || processing}
                  className="w-full py-4 rounded-xl bg-linear-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  <Lock size={16} />
                  {processing
                    ? 'Processing...'
                    : !paystackReady
                    ? 'Loading payment system...'
                    : `Pay ₦${total.toLocaleString()} — Secure Checkout`}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck size={13} className="text-indigo-400" />
                  Powered by Paystack · 256-bit SSL encryption
                </div>
              </div>
            </div>
          )}
        </div>

        {/* ── RIGHT — Order summary ── */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">

          {/* Course card */}
          <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 overflow-hidden">
            <div className={`h-40 bg-linear-to-br ${course.gradientFrom} ${course.gradientTo} relative`}>
              <Image src={course.thumbnail} alt={course.title} fill sizes="(max-width: 1024px) 100vw, 40vw" className="object-cover" />
              <div className="absolute inset-0 bg-linear-to-t from-gray-900/80 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="bg-gray-900/80 backdrop-blur text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  {course.level}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-bold text-white leading-snug">{course.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{course.shortDescription}</p>

              <div className="grid grid-cols-3 gap-2 pt-1">
                {[
                  { icon: Clock, text: course.duration },
                  { icon: BookOpen, text: `${course.curriculum.length} lessons` },
                  { icon: Users, text: course.instructor },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex flex-col items-center gap-1 p-2 rounded-lg bg-gray-800/60 border border-indigo-500/10">
                    <Icon size={13} className="text-indigo-400" />
                    <span className="text-xs text-gray-400 text-center leading-tight">{text}</span>
                  </div>
                ))}
              </div>

              <div className="pt-1 space-y-1.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Included</p>
                {[
                  'Lifetime access',
                  'Certificate of completion',
                  ...course.features.slice(0, 2),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 size={13} className="text-emerald-400 shrink-0" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Price breakdown */}
          {!isFree && (
            <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-4 space-y-2.5">
              <h3 className="text-sm font-bold text-white mb-3">Order Summary</h3>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Course Price</span>
                <span className="text-white">₦{numericPrice.toLocaleString()}</span>
              </div>
              {couponApplied && (
                <div className="flex justify-between text-sm">
                  <span className="text-emerald-400 flex items-center gap-1"><Tag size={12} /> Promo Code Applied</span>
                  <span className="text-emerald-400">−₦{discount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t border-indigo-500/20 pt-2.5 flex justify-between items-center">
                <span className="text-white font-bold">Total</span>
                <span className="text-2xl font-extrabold text-indigo-400">₦{total.toLocaleString()}</span>
              </div>
            </div>
          )}

          {/* Trust badges */}
          <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-4 space-y-2.5">
            {[
              { icon: Award,      text: 'Certificate of completion' },
              { icon: ShieldCheck, text: 'Secure & encrypted payment' },
              { icon: Zap,         text: 'Instant access after payment' },
              { icon: RefreshCw,   text: '24-hour refund policy' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-gray-400">
                <Icon size={14} className="text-indigo-400 shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
