'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { courseSchemas } from '@/lib/Course';
import { useAuth } from '@/context/AuthContext';
import {
  ShieldCheck,
  Lock,
  Clock,
  BookOpen,
  Users,
  ChevronRight,
  CheckCircle2,
  CreditCard,
  Smartphone,
  Building2,
  Tag,
  ArrowLeft,
  Zap,
  Award,
  RefreshCw,
} from 'lucide-react';

const PAYMENT_METHODS = [
  { id: 'card', label: 'Credit / Debit Card', icon: CreditCard },
  { id: 'transfer', label: 'Bank Transfer', icon: Building2 },
  { id: 'mobile', label: 'Mobile Money', icon: Smartphone },
];

export default function CheckoutPage({ params }: { params: { slug: string } }) {
  const unwrapped = React.use(params as any) as { slug: string };
  const { user } = useAuth();
  const router = useRouter();

  const course = useMemo(
    () => courseSchemas.find((c) => c.slug === unwrapped.slug),
    [unwrapped.slug]
  );

  const [paymentMethod, setPaymentMethod] = useState('card');
  const [coupon, setCoupon] = useState('');
  const [couponApplied, setCouponApplied] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [agreed, setAgreed] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [done, setDone] = useState(false);

  // Card fields
  const [cardNum, setCardNum] = useState('');
  const [cardName, setCardName] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvv, setCvv] = useState('');

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

  // Parse price
  const isFree = course.price === 'Free';
  const rawPrice = course.price.replace(/[^\d]/g, '');
  const numericPrice = rawPrice ? parseInt(rawPrice, 10) : 0;
  const discount = couponApplied ? Math.floor(numericPrice * 0.1) : 0;
  const total = numericPrice - discount;

  const applyCoupon = () => {
    setCouponError('');
    if (coupon.toUpperCase() === 'LEARN10') {
      setCouponApplied(true);
    } else {
      setCouponError('Invalid coupon code.');
      setCouponApplied(false);
    }
  };

  const formatCard = (v: string) =>
    v.replace(/\D/g, '').slice(0, 16).replace(/(.{4})/g, '$1 ').trim();

  const formatExpiry = (v: string) => {
    const d = v.replace(/\D/g, '').slice(0, 4);
    return d.length >= 3 ? `${d.slice(0, 2)}/${d.slice(2)}` : d;
  };

  const handlePay = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agreed) return;
    setProcessing(true);
    // TODO: call Supabase / payment gateway here
    await new Promise((r) => setTimeout(r, 1800));
    setProcessing(false);
    setDone(true);
  };

  // ── Success screen ──
  if (done) {
    return (
      <div className="flex items-center justify-center min-h-[70vh] px-4">
        <div className="text-center max-w-md">
          {/* Animated check */}
          <div className="mx-auto mb-6 w-24 h-24 rounded-full bg-gradient-to-br from-emerald-500 to-teal-400 flex items-center justify-center shadow-2xl shadow-emerald-500/40 animate-bounce-once">
            <CheckCircle2 size={44} className="text-white" />
          </div>
          <h1 className="text-3xl font-extrabold text-white mb-2">You're enrolled!</h1>
          <p className="text-gray-400 mb-2">
            Welcome to <span className="text-indigo-300 font-semibold">{course.title}</span>.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            A confirmation has been sent to <span className="text-gray-300">{user?.email}</span>.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href={`/dashboard/courses/${course.slug}`}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold transition shadow-lg shadow-indigo-500/20"
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

      {/* ── Breadcrumb header ── */}
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

      {/* ── Page title ── */}
      <div>
        <h1 className="text-2xl font-extrabold text-white">Complete Your Enrollment</h1>
        <p className="text-gray-400 text-sm mt-1">You're one step away from unlocking this course.</p>
      </div>

      {/* ── Two-column layout ── */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 items-start">

        {/* ────────────────── LEFT — Payment form ────────────────── */}
        <div className="lg:col-span-3 space-y-5">

          {isFree ? (
            /* FREE course — no payment needed */
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
                  className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 cursor-pointer ${agreed ? 'bg-indigo-600 border-indigo-500' : 'border-gray-600 group-hover:border-indigo-500/50'}`}
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
              <button
                onClick={handlePay as any}
                disabled={!agreed || processing}
                className="w-full py-3.5 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-bold transition shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              >
                {processing ? <RefreshCw size={18} className="animate-spin" /> : <Zap size={18} />}
                {processing ? 'Enrolling...' : 'Enroll for Free'}
              </button>
            </div>
          ) : (
            /* PAID course */
            <form onSubmit={handlePay} className="space-y-5">

              {/* Payment method selector */}
              <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-5 space-y-4">
                <h2 className="text-base font-bold text-white">Payment Method</h2>
                <div className="grid grid-cols-3 gap-3">
                  {PAYMENT_METHODS.map(({ id, label, icon: Icon }) => (
                    <button
                      key={id}
                      type="button"
                      onClick={() => setPaymentMethod(id)}
                      className={`flex flex-col items-center gap-2 py-3 px-2 rounded-xl border text-xs font-medium transition ${
                        paymentMethod === id
                          ? 'bg-indigo-600/20 border-indigo-500 text-white'
                          : 'bg-gray-800/50 border-gray-700 text-gray-400 hover:border-indigo-500/40 hover:text-gray-200'
                      }`}
                    >
                      <Icon size={20} className={paymentMethod === id ? 'text-indigo-400' : ''} />
                      <span className="text-center leading-tight">{label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Card fields */}
              {paymentMethod === 'card' && (
                <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-5 space-y-4">
                  <h2 className="text-base font-bold text-white">Card Details</h2>

                  {/* Visual card preview */}
                  <div className={`relative h-36 rounded-2xl overflow-hidden bg-gradient-to-br ${course.gradientFrom.replace('/20', '/60')} ${course.gradientTo.replace('/20', '/60')} border border-white/10 p-5 flex flex-col justify-between`}>
                    <div className="flex items-center justify-between">
                      <div className="w-10 h-7 rounded bg-yellow-400/80 flex items-center justify-center">
                        <div className="w-5 h-3.5 rounded-sm bg-yellow-600/60" />
                      </div>
                      <Lock size={14} className="text-white/50" />
                    </div>
                    <div>
                      <p className="font-mono text-white/80 text-sm tracking-widest">
                        {cardNum || '•••• •••• •••• ••••'}
                      </p>
                      <div className="flex items-center justify-between mt-1">
                        <p className="text-white/60 text-xs">{cardName || 'CARDHOLDER NAME'}</p>
                        <p className="text-white/60 text-xs">{expiry || 'MM/YY'}</p>
                      </div>
                    </div>
                  </div>

                  {/* Inputs */}
                  <div className="space-y-3">
                    <div>
                      <label className="text-xs text-gray-400 font-medium">Card Number</label>
                      <input
                        type="text"
                        inputMode="numeric"
                        placeholder="1234 5678 9012 3456"
                        value={cardNum}
                        onChange={(e) => setCardNum(formatCard(e.target.value))}
                        maxLength={19}
                        required
                        className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-400 font-medium">Cardholder Name</label>
                      <input
                        type="text"
                        placeholder="As it appears on your card"
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value.toUpperCase())}
                        required
                        className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm uppercase placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-400 font-medium">Expiry Date</label>
                        <input
                          type="text"
                          placeholder="MM/YY"
                          value={expiry}
                          onChange={(e) => setExpiry(formatExpiry(e.target.value))}
                          maxLength={5}
                          required
                          className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition"
                        />
                      </div>
                      <div>
                        <label className="text-xs text-gray-400 font-medium">CVV</label>
                        <input
                          type="password"
                          placeholder="•••"
                          value={cvv}
                          onChange={(e) => setCvv(e.target.value.replace(/\D/g, '').slice(0, 4))}
                          maxLength={4}
                          required
                          className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm font-mono placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Bank transfer */}
              {paymentMethod === 'transfer' && (
                <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-5 space-y-3">
                  <h2 className="text-base font-bold text-white mb-1">Bank Transfer Details</h2>
                  {[
                    { label: 'Bank Name', value: 'Learnify Finance Bank' },
                    { label: 'Account Number', value: '0123456789' },
                    { label: 'Account Name', value: 'Learnify Technologies Ltd' },
                    { label: 'Reference', value: `LRN-${course.id.slice(-6).toUpperCase()}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                      <span className="text-gray-400 text-sm">{label}</span>
                      <span className="text-white font-mono text-sm font-semibold">{value}</span>
                    </div>
                  ))}
                  <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-2 mt-2">
                    ⚠ Your enrollment will be activated within 24 hours of payment confirmation.
                  </p>
                </div>
              )}

              {/* Mobile money */}
              {paymentMethod === 'mobile' && (
                <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-5 space-y-4">
                  <h2 className="text-base font-bold text-white">Mobile Money</h2>
                  <div>
                    <label className="text-xs text-gray-400 font-medium">Phone Number</label>
                    <input
                      type="tel"
                      placeholder="+234 800 000 0000"
                      required
                      className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition"
                    />
                  </div>
                  <div>
                    <label className="text-xs text-gray-400 font-medium">Network Provider</label>
                    <select
                      required
                      className="mt-1.5 w-full px-4 py-3 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm focus:outline-none focus:border-indigo-500/60 transition"
                    >
                      <option value="">Select provider</option>
                      <option>MTN MoMo</option>
                      <option>Airtel Money</option>
                      <option>Opay</option>
                      <option>Palmpay</option>
                    </select>
                  </div>
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
                    placeholder="e.g. LEARN10"
                    value={coupon}
                    onChange={(e) => { setCoupon(e.target.value.toUpperCase()); setCouponError(''); setCouponApplied(false); }}
                    className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 border border-indigo-500/20 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-indigo-500/60 transition"
                  />
                  <button
                    type="button"
                    onClick={applyCoupon}
                    className="px-4 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold transition whitespace-nowrap"
                  >
                    Apply
                  </button>
                </div>
                {couponApplied && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1.5">
                    <CheckCircle2 size={13} /> 10% discount applied! (Code: LEARN10)
                  </p>
                )}
                {couponError && <p className="text-xs text-red-400">{couponError}</p>}
              </div>

              {/* Terms + Submit */}
              <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 p-5 space-y-4">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div
                    onClick={() => setAgreed(!agreed)}
                    className={`mt-0.5 w-5 h-5 rounded-md border-2 flex items-center justify-center transition flex-shrink-0 cursor-pointer ${agreed ? 'bg-indigo-600 border-indigo-500' : 'border-gray-600 group-hover:border-indigo-500/50'}`}
                  >
                    {agreed && <CheckCircle2 size={12} className="text-white" />}
                  </div>
                  <span className="text-sm text-gray-400 leading-snug">
                    I agree to the{' '}
                    <Link href="/terms" className="text-indigo-400 hover:underline">Terms of Service</Link>
                    {' '}and{' '}
                    <Link href="/privacy" className="text-indigo-400 hover:underline">Privacy Policy</Link>.
                    I understand this is a demo payment.
                  </span>
                </label>

                <button
                  type="submit"
                  disabled={!agreed || processing}
                  className="w-full py-4 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-bold text-base transition shadow-lg shadow-indigo-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {processing ? (
                    <><RefreshCw size={18} className="animate-spin" /> Processing...</>
                  ) : (
                    <><Lock size={16} /> Pay {isFree ? 'Nothing' : `₦${total.toLocaleString()}`}</>
                  )}
                </button>

                <div className="flex items-center justify-center gap-2 text-xs text-gray-500">
                  <ShieldCheck size={13} className="text-indigo-400" />
                  256-bit SSL encryption · Secure checkout
                </div>
              </div>
            </form>
          )}
        </div>

        {/* ────────────────── RIGHT — Order summary ────────────────── */}
        <div className="lg:col-span-2 space-y-4 lg:sticky lg:top-6">

          {/* Course card */}
          <div className="rounded-2xl bg-gray-900 border border-indigo-500/20 overflow-hidden">
            {/* Thumbnail */}
            <div className={`h-40 bg-gradient-to-br ${course.gradientFrom} ${course.gradientTo} relative`}>
              <Image src={course.thumbnail} alt={course.title} fill className="object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/80 to-transparent" />
              <div className="absolute bottom-3 left-3">
                <span className="bg-gray-900/80 backdrop-blur text-indigo-300 text-xs font-semibold px-2 py-0.5 rounded-full border border-indigo-500/30">
                  {course.level}
                </span>
              </div>
            </div>

            <div className="p-4 space-y-3">
              <h3 className="font-bold text-white leading-snug">{course.title}</h3>
              <p className="text-gray-400 text-xs leading-relaxed">{course.shortDescription}</p>

              {/* Course meta */}
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

              {/* What's included */}
              <div className="pt-1 space-y-1.5">
                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide">Included</p>
                {[
                  'Lifetime access',
                  'Certificate of completion',
                  'Downloadable resources',
                  ...course.features.slice(0, 2),
                ].map((item) => (
                  <div key={item} className="flex items-center gap-2 text-xs text-gray-300">
                    <CheckCircle2 size={13} className="text-emerald-400 flex-shrink-0" />
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
                  <span className="text-emerald-400 flex items-center gap-1"><Tag size={12} /> Coupon (LEARN10)</span>
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
              { icon: RefreshCw, text: '30-day money-back guarantee' },
              { icon: Award, text: 'Certificate of completion' },
              { icon: ShieldCheck, text: 'Secure & encrypted payment' },
              { icon: Zap, text: 'Instant access after payment' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-2.5 text-xs text-gray-400">
                <Icon size={14} className="text-indigo-400 flex-shrink-0" />
                {text}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
