'use client';

import React, { useState, useEffect } from 'react';
import { Save, CheckCircle, Youtube, HardDrive } from 'lucide-react';

interface ProviderConfig { enabled: boolean; apiKey?: string; libraryId?: string; cdnUrl?: string; workspaceId?: string; }
type Providers = { youtube: ProviderConfig; bunny: ProviderConfig; gumlet: ProviderConfig; gdrive: ProviderConfig; };

const DEFAULT: Providers = {
  youtube: { enabled: true },
  bunny:   { enabled: false, libraryId: '', cdnUrl: '' },
  gumlet:  { enabled: false, workspaceId: '' },
  gdrive:  { enabled: true },
};

const inp = 'w-full rounded-lg bg-gray-800 border border-gray-700 px-3 py-2.5 text-white text-sm outline-none focus:border-indigo-500/60 transition';

const PROVIDER_META = [
  {
    key: 'youtube' as const,
    label: 'YouTube',
    icon: '▶️',
    description: 'Embed YouTube videos by URL or video ID. Free, no configuration required.',
    fields: [] as { key: string; label: string; placeholder: string }[],
  },
  {
    key: 'gdrive' as const,
    label: 'Google Drive',
    icon: '📂',
    description: 'Embed Google Drive videos. Set sharing to "Anyone with link" for each file.',
    fields: [],
  },
  {
    key: 'bunny' as const,
    label: 'Bunny.net Stream',
    icon: '🐇',
    description: 'High-performance video CDN. Requires a Bunny Stream library.',
    fields: [
      { key: 'libraryId', label: 'Library ID',   placeholder: 'e.g. 123456' },
      { key: 'cdnUrl',    label: 'CDN Hostname',  placeholder: 'e.g. vz-abc.b-cdn.net' },
    ],
  },
  {
    key: 'gumlet' as const,
    label: 'Gumlet',
    icon: '🎬',
    description: 'Optimized video delivery with adaptive bitrate. Paste Gumlet asset IDs in lessons.',
    fields: [
      { key: 'workspaceId', label: 'Workspace ID', placeholder: 'e.g. abc123xyz' },
    ],
  },
];

export default function VideoProvidersPage() {
  const [providers, setProviders]   = useState<Providers>(DEFAULT);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState<string | null>(null);
  const [saved, setSaved]           = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/settings')
      .then((r) => r.json())
      .then((d) => {
        const raw = (d.settings ?? []).find((s: any) => s.key === 'video_providers');
        if (raw?.value) {
          try { setProviders({ ...DEFAULT, ...JSON.parse(raw.value) }); } catch {}
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const toggleEnabled = (pk: keyof Providers) =>
    setProviders((p) => ({ ...p, [pk]: { ...p[pk], enabled: !p[pk].enabled } }));

  const updateField = (pk: keyof Providers, field: string, val: string) =>
    setProviders((p) => ({ ...p, [pk]: { ...p[pk], [field]: val } }));

  const handleSave = async (pk: keyof Providers) => {
    setSaving(pk);
    await fetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', 'x-csrf-protection': '1' },
      body: JSON.stringify({ key: 'video_providers', value: JSON.stringify(providers) }),
    });
    setSaving(null);
    setSaved(pk);
    setTimeout(() => setSaved(null), 2500);
  };

  if (loading) return <div className="flex items-center justify-center min-h-[400px]"><div className="text-gray-400 text-sm animate-pulse">Loading…</div></div>;

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-3xl font-bold text-white">Video Providers</h1>
        <p className="mt-2 text-gray-400">Configure which video platforms are available when creating lessons.</p>
      </div>

      {PROVIDER_META.map(({ key, label, icon, description, fields }) => {
        const cfg = providers[key];
        return (
          <div key={key} className={`rounded-xl border p-6 space-y-4 transition
            ${cfg.enabled ? 'border-indigo-500/30 bg-gradient-to-br from-indigo-500/5 to-transparent' : 'border-gray-800 bg-gray-900/50'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{icon}</span>
                <div>
                  <h3 className="text-white font-semibold">{label}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{description}</p>
                </div>
              </div>
              <button onClick={() => toggleEnabled(key)}
                className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${cfg.enabled ? 'bg-indigo-500' : 'bg-gray-700'}`}>
                <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${cfg.enabled ? 'translate-x-5' : ''}`} />
              </button>
            </div>

            {cfg.enabled && fields.length > 0 && (
              <div className="space-y-3 pt-2 border-t border-gray-800">
                {fields.map(({ key: fk, label: fl, placeholder }) => (
                  <div key={fk}>
                    <label className="block text-xs text-gray-400 mb-1.5">{fl}</label>
                    <input
                      value={(cfg as any)[fk] ?? ''}
                      onChange={(e) => updateField(key, fk, e.target.value)}
                      placeholder={placeholder}
                      className={inp}
                    />
                  </div>
                ))}
              </div>
            )}

            {cfg.enabled && (
              <button onClick={() => handleSave(key)} disabled={saving === key}
                className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-60 shadow shadow-indigo-500/20">
                {saved === key ? <><CheckCircle size={14} /> Saved!</> : saving === key ? 'Saving…' : <><Save size={14} /> Save</>}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}
