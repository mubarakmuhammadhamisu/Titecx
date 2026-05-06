'use client';

import React, { useState, useEffect } from 'react';
import { Save, AlertCircle, CheckCircle2, Loader2, Clock } from 'lucide-react';

// ── "Not yet active" badge ────────────────────────────────────────────────────
function PendingBadge() {
  return (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-[10px] font-semibold tracking-wide">
      <Clock size={9} />
      NOT YET ACTIVE
    </span>
  );
}

// ── Section wrapper ───────────────────────────────────────────────────────────
function Section({
  title,
  description,
  children,
  pending = false,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  pending?: boolean;
}) {
  return (
    <div className="border-b border-indigo-500/10 pb-8 last:border-0 last:pb-0">
      <div className="flex items-center gap-3 mb-1">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {pending && <PendingBadge />}
      </div>
      {description && <p className="text-sm text-gray-500 mb-6">{description}</p>}
      {!description && <div className="mb-6" />}
      <div className={`space-y-5 ${pending ? 'opacity-50 pointer-events-none select-none' : ''}`}>
        {children}
      </div>
      {pending && (
        <p className="mt-4 text-xs text-amber-500/60">
          These fields are not yet connected to the backend. They have no effect until backend support is added.
        </p>
      )}
    </div>
  );
}

const inputCls =
  'w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-4 py-2 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500/60 transition';

function FieldRow({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      {children}
      {hint && <p className="text-xs text-gray-500 mt-1">{hint}</p>}
    </div>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-6">
      <div>
        <p className="font-medium text-white">{label}</p>
        {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
      </div>
      <div
        onClick={() => onChange(!checked)}
        className={`relative shrink-0 w-11 h-6 rounded-full cursor-pointer transition-colors duration-200 ${
          checked ? 'bg-indigo-500' : 'bg-gray-700'
        }`}
      >
        <span
          className={`absolute top-1 left-1 w-4 h-4 rounded-full bg-white shadow transition-transform duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
export default function SettingsPage() {
  // ── Live settings (wired to /api/admin/settings) ──────────────────────────
  const [pointsEnabled, setPointsEnabled]           = useState(true);
  const [commissionRate, setCommissionRate]         = useState(10);
  const [referralWindowDays, setReferralWindowDays] = useState(7);

  // ── Pending settings (UI only, not yet wired) ─────────────────────────────
  const [enrollmentsOpen, setEnrollmentsOpen]     = useState(true);
  const [supportEmail, setSupportEmail]           = useState('support@titecx.com');
  const [paystackMode, setPaystackMode]           = useState('test');
  const [referralEnabled, setReferralEnabled]     = useState(true);
  const [completedPoints, setCompletedPoints]     = useState(800);
  const [inProgressPoints, setInProgressPoints]   = useState(200);
  const [creditToNairaRate, setCreditToNairaRate] = useState(1);

  // ── UI state ──────────────────────────────────────────────────────────────
  const [loading, setLoading]     = useState(true);
  const [saving, setSaving]       = useState(false);
  const [saveOk, setSaveOk]       = useState(false);
  const [saveError, setSaveError] = useState('');

  // ── Load real settings on mount ───────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/admin/settings');
        if (!res.ok) throw new Error();
        const { settings } = await res.json();
        for (const row of settings ?? []) {
          if (row.key === 'points_enabled')              setPointsEnabled(row.value === 'true');
          if (row.key === 'referral_commission_percent') setCommissionRate(Number(row.value));
          if (row.key === 'referral_window_days')        setReferralWindowDays(Number(row.value));
        }
      } catch {
        // Non-fatal — defaults remain
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // ── Save live settings ────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setSaveError('');
    setSaveOk(false);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
        body: JSON.stringify({
          points_enabled:              String(pointsEnabled),
          referral_commission_percent: String(commissionRate),
          referral_window_days:        String(referralWindowDays),
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Save failed');
      setSaveOk(true);
      setTimeout(() => setSaveOk(false), 3500);
    } catch (err: any) {
      setSaveError(err.message ?? 'Something went wrong.');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 gap-3 text-gray-400">
        <Loader2 size={20} className="animate-spin" />
        <span className="text-sm">Loading settings…</span>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Platform Settings</h1>
        <p className="mt-2 text-gray-400">
          Live sections are saved to the database. Sections marked{' '}
          <span className="text-amber-400 font-medium">NOT YET ACTIVE</span> are UI-only placeholders.
        </p>
      </div>

      <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 p-8 backdrop-blur-md shadow-lg shadow-indigo-500/10 space-y-8">

        {/* LIVE — Points System */}
        <Section title="Points System" description="Controls whether the credit and learning-points engine is active.">
          <ToggleRow
            label="Enable Points System"
            description="When disabled, no referral credits or learning points are awarded to any student."
            checked={pointsEnabled}
            onChange={setPointsEnabled}
          />
        </Section>

        {/* LIVE — Referral Program */}
        <Section title="Referral Program" description="These values are enforced at checkout when a referral converts.">
          <FieldRow
            label="Commission Rate (%)"
            hint="Percentage of the course price credited to the referrer. Applied by the enroll_after_payment RPC."
          >
            <input
              type="number"
              min={0}
              max={100}
              value={commissionRate}
              onChange={(e) => setCommissionRate(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow
            label="Referral Attribution Window (days)"
            hint="Days after a referral link is clicked during which a purchase still triggers a commission."
          >
            <input
              type="number"
              min={1}
              max={365}
              value={referralWindowDays}
              onChange={(e) => setReferralWindowDays(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
        </Section>

        {/* PENDING — Enrollment Gate */}
        <Section title="Enrollment Gate" description="Globally pause or allow new enrollments." pending>
          <ToggleRow
            label="Accept New Enrollments"
            description="When disabled, students cannot enroll in any course platform-wide."
            checked={enrollmentsOpen}
            onChange={setEnrollmentsOpen}
          />
        </Section>

        {/* PENDING — Paystack Mode */}
        <Section title="Payment Mode" description="Switch Paystack between test and live environments." pending>
          <FieldRow hint="Controlled via the PAYSTACK_SECRET_KEY environment variable. This toggle will update that mapping once backend support is added.">
            <select
              value={paystackMode}
              onChange={(e) => setPaystackMode(e.target.value)}
              className={inputCls}
            >
              <option value="test">Test Mode</option>
              <option value="live">Live Mode</option>
            </select>
          </FieldRow>
        </Section>

        {/* PENDING — Support Email */}
        <Section title="Support Contact" description="The email address shown to students when they need help." pending>
          <FieldRow hint="Will be stored in platform_settings and injected into transactional emails.">
            <input
              type="email"
              value={supportEmail}
              onChange={(e) => setSupportEmail(e.target.value)}
              placeholder="support@titecx.com"
              className={inputCls}
            />
          </FieldRow>
        </Section>

        {/* PENDING — Referral On/Off Toggle */}
        <Section title="Referral On / Off" description="Hard-disable the entire referral programme without removing any data." pending>
          <ToggleRow
            label="Enable Referral Programme"
            description="When off, referral links still work but no commissions are awarded on conversion."
            checked={referralEnabled}
            onChange={setReferralEnabled}
          />
        </Section>

        {/* PENDING — Point Values */}
        <Section title="Learning Point Values" description="How many leaderboard points students earn per course status." pending>
          <FieldRow label="Completed Course Points" hint="Awarded when a student's progress reaches 100%.">
            <input
              type="number"
              min={0}
              value={completedPoints}
              onChange={(e) => setCompletedPoints(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="In-Progress Course Points" hint="Awarded for any course with progress between 1% and 99%.">
            <input
              type="number"
              min={0}
              value={inProgressPoints}
              onChange={(e) => setInProgressPoints(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
          <FieldRow label="Credit to Naira Rate (₦ per credit)" hint="How much 1 credit is worth at checkout. Default: 1 credit = ₦1.">
            <input
              type="number"
              min={1}
              value={creditToNairaRate}
              onChange={(e) => setCreditToNairaRate(Number(e.target.value))}
              className={inputCls}
            />
          </FieldRow>
        </Section>

      </div>

      {/* Save bar */}
      <div className="flex items-center gap-4 flex-wrap">
        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 px-6 py-3 font-medium text-white hover:from-indigo-600 hover:to-indigo-700 transition-all duration-300 shadow-lg shadow-indigo-500/30 disabled:opacity-60 disabled:cursor-not-allowed"
        >
          {saving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
          {saving ? 'Saving…' : 'Save Live Settings'}
        </button>

        {saveOk && (
          <div className="flex items-center gap-2 text-emerald-400 text-sm font-medium">
            <CheckCircle2 size={16} /> Live settings saved to database
          </div>
        )}
        {saveError && (
          <div className="flex items-center gap-2 text-red-400 text-sm">
            <AlertCircle size={16} /> {saveError}
          </div>
        )}
      </div>

      {/* Footer note */}
      <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-4">
        <div className="flex gap-3">
          <Clock size={16} className="text-amber-400 shrink-0 mt-0.5" />
          <p className="text-sm text-amber-200/70">
            Only <strong className="text-white">Points System</strong> and{' '}
            <strong className="text-white">Referral Program</strong> fields are wired to the database.
            All other sections are shown for planning — they will be connected in a future update.
          </p>
        </div>
      </div>
    </div>
  );
}
