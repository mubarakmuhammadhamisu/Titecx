'use client';

import React, { useState, useEffect } from 'react';
import type { PlatformSetting } from '@/components/admin/adminTypes';
import { Save, CheckCircle } from 'lucide-react';

const SECTIONS: { key: string; label: string; description: string; type: 'text' | 'number' | 'toggle' | 'textarea' }[] = [
  { key: 'site_name',            label: 'Site Name',              description: 'The name displayed across the platform',    type: 'text' },
  { key: 'site_tagline',         label: 'Site Tagline',           description: 'Short subtitle shown on the landing page',  type: 'text' },
  { key: 'support_email',        label: 'Support Email',          description: 'Email students contact for help',            type: 'text' },
  { key: 'referral_commission',  label: 'Referral Commission (₦)','description': 'Credit awarded per successful referral',  type: 'number' },
  { key: 'points_per_lesson',    label: 'Points per Lesson',      description: 'Points awarded on lesson completion',        type: 'number' },
  { key: 'points_per_quiz',      label: 'Points per Quiz Pass',   description: 'Points awarded on passing a quiz',           type: 'number' },
  { key: 'mystery_box_threshold',label: 'Mystery Box Threshold',  description: 'Days to complete premium course for box',    type: 'number' },
  { key: 'paystack_public_key',  label: 'Paystack Public Key',    description: 'Your Paystack public key (pk_...)',          type: 'text' },
  { key: 'maintenance_mode',     label: 'Maintenance Mode',       description: 'Show maintenance page to students',          type: 'toggle' },
  { key: 'announcement_banner',  label: 'Announcement Banner',    description: 'Text shown on a top banner (leave blank to hide)', type: 'textarea' },
];

const inp = 'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 transition';

export default function SettingsPage() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState<string | null>(null);
  const [saved, setSaved]       = useState<string | null>(null);
  const [errors, setErrors]     = useState<Record<string, string>>({});

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        const map: Record<string, string> = {};
        for (const s of (d.settings ?? []) as PlatformSetting[]) map[s.key] = s.value;
        setSettings(map);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async (key: string) => {
    setSaving(key);
    setErrors((e) => ({ ...e, [key]: '' }));
    const res = await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ key, value: settings[key] ?? '' }),
    });
    setSaving(null);
    if (!res.ok) {
      const d = await res.json();
      setErrors((e) => ({ ...e, [key]: d.error ?? 'Failed to save' }));
    } else {
      setSaved(key);
      setTimeout(() => setSaved(null), 2500);
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading settings…</div></div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Settings</h1>
        <p className="mt-2 text-gray-400">All changes save directly to the database.</p>
      </div>

      {SECTIONS.map(({ key, label, description, type }) => (
        <div key={key} className="rounded-xl border border-gray-800 bg-gray-900/50 p-6 space-y-4">
          <div>
            <h3 className="text-white font-semibold text-sm">{label}</h3>
            <p className="text-xs text-gray-500 mt-0.5">{description}</p>
          </div>

          {type === 'toggle' ? (
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const next = settings[key] === 'true' ? 'false' : 'true';
                  setSettings((s) => ({ ...s, [key]: next }));
                }}
                className={`relative w-11 h-6 rounded-full transition-colors ${settings[key] === 'true' ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${settings[key] === 'true' ? 'translate-x-5' : ''}`} />
              </button>
              <span className="text-sm text-gray-300">{settings[key] === 'true' ? 'Enabled' : 'Disabled'}</span>
            </div>
          ) : type === 'textarea' ? (
            <textarea
              value={settings[key] ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
              rows={3}
              className={`${inp} resize-none`}
              placeholder="Leave blank to hide"
            />
          ) : (
            <input
              type={type}
              value={settings[key] ?? ''}
              onChange={(e) => setSettings((s) => ({ ...s, [key]: e.target.value }))}
              className={inp}
              placeholder={`Enter ${label.toLowerCase()}…`}
            />
          )}

          {errors[key] && <p className="text-red-400 text-xs">{errors[key]}</p>}

          <button
            onClick={() => handleSave(key)}
            disabled={saving === key}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition
              bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-60 shadow shadow-indigo-500/20"
          >
            {saved === key
              ? <><CheckCircle size={14} /> Saved!</>
              : saving === key
              ? <><Save size={14} /> Saving…</>
              : <><Save size={14} /> Save</>
            }
          </button>
        </div>
      ))}
    </div>
  );
}
