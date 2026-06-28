'use client';

import React, { useState, useCallback, useMemo } from 'react';
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts';
import {
  Plus, Trash2, X, Check, ChevronDown, ChevronUp,
  Upload, Globe, Settings2, BarChart2, Film,
  AlertTriangle, Eye, EyeOff,
} from 'lucide-react';

import {
  INITIAL_GUMLET_ACCOUNTS, DEFAULT_GUMLET_SETTINGS,
  type GumletAccount, type GumletAccountSettings,
} from '@/lib/videoProviders/gumletMock';
import {
  INITIAL_BUNNY_LIBRARIES, DEFAULT_BUNNY_SETTINGS,
  type BunnyLibrary, type BunnyLibrarySettings,
} from '@/lib/videoProviders/bunnyMock';

// ─── Palette ──────────────────────────────────────────────────────────────────

const ACCOUNT_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#06b6d4', '#10b981'];

// ─── Shared UI primitives ─────────────────────────────────────────────────────

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`rounded-xl border border-indigo-500/20 bg-gradient-to-br from-gray-900/80 to-gray-800/40 backdrop-blur-md p-5 ${className}`}>
      {children}
    </div>
  );
}

function StatCard({
  label, value, sub, color = 'indigo',
}: {
  label: string; value: string; sub?: string; color?: 'indigo' | 'purple' | 'emerald' | 'blue' | 'orange';
}) {
  const ring: Record<string, string> = {
    indigo: 'from-indigo-500/10 to-indigo-600/5 border-indigo-500/20',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20',
    emerald: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20',
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20',
    orange: 'from-orange-500/10 to-orange-600/5 border-orange-500/20',
  };
  const text: Record<string, string> = {
    indigo: 'text-indigo-400', purple: 'text-purple-400',
    emerald: 'text-emerald-400', blue: 'text-blue-400', orange: 'text-orange-400',
  };
  return (
    <div className={`rounded-xl bg-gradient-to-br ${ring[color]} border p-4`}>
      <p className="text-xs uppercase tracking-wider text-gray-500 font-semibold">{label}</p>
      <p className={`mt-2 text-2xl font-bold ${text[color]}`}>{value}</p>
      {sub && <p className="text-xs text-gray-500 mt-0.5">{sub}</p>}
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return <h3 className="text-sm font-semibold text-white mb-3">{children}</h3>;
}

function inputCls(extra = '') {
  return `w-full rounded-lg bg-gray-800 border border-indigo-500/20 px-3 py-2 text-white placeholder:text-gray-500 outline-none focus:border-indigo-500/60 transition text-sm ${extra}`;
}

function ToggleSwitch({
  checked, onChange, label,
}: {
  checked: boolean; onChange: (v: boolean) => void; label: string;
}) {
  return (
    <label className="flex items-center justify-between cursor-pointer group">
      <span className="text-sm text-gray-300 group-hover:text-white transition">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${checked ? 'bg-indigo-500' : 'bg-gray-700'}`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : ''}`}
        />
      </button>
    </label>
  );
}

function ConfirmModal({
  open, onClose, onConfirm, title, children,
}: {
  open: boolean; onClose: () => void; onConfirm: () => void;
  title: string; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md mx-4 rounded-2xl border border-indigo-500/20 bg-gray-900 p-6 shadow-2xl space-y-4">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <div className="text-sm text-gray-300">{children}</div>
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="flex-1 rounded-lg border border-gray-600 py-2 text-gray-300 hover:bg-gray-800 transition text-sm font-medium">
            Cancel
          </button>
          <button onClick={() => { onConfirm(); onClose(); }} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2 text-white transition text-sm font-medium">
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    ready:      'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    finished:   'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    processing: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
    queued:     'bg-yellow-500/10 text-yellow-400 border-yellow-500/30',
    error:      'bg-red-500/10 text-red-400 border-red-500/30',
    failed:     'bg-red-500/10 text-red-400 border-red-500/30',
  };
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium border ${map[status] ?? 'bg-gray-700 text-gray-400 border-gray-600'}`}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

function fmtBytes(bytes: number): string {
  if (bytes === 0) return '—';
  const gb = bytes / 1_073_741_824;
  return gb >= 1 ? `${gb.toFixed(1)} GB` : `${(bytes / 1_048_576).toFixed(0)} MB`;
}

function fmtSeconds(s: number): string {
  if (!s) return '—';
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${String(sec).padStart(2, '0')}`;
}

// ─── GUMLET SECTION ───────────────────────────────────────────────────────────

// ── Gumlet stat cards ─────────────────────────────────────────────────────────

function GumletStatCards({ accounts }: { accounts: GumletAccount[] }) {
  const totals = useMemo(() => accounts.reduce(
    (acc, a) => ({
      videos:    acc.videos    + a.stats.totalVideos,
      views:     acc.views     + a.stats.totalViews,
      bw:        acc.bw        + a.stats.bandwidthGb,
      storage:   acc.storage   + a.stats.storageGb,
      transcode: acc.transcode + a.stats.transcodingMins,
    }),
    { videos: 0, views: 0, bw: 0, storage: 0, transcode: 0 },
  ), [accounts]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatCard label="Total Videos"    value={totals.videos.toLocaleString()}                      color="indigo"  />
      <StatCard label="Total Views"     value={totals.views.toLocaleString()}                       color="purple"  />
      <StatCard label="Bandwidth"       value={`${totals.bw.toFixed(1)} GB`}                        color="blue"    />
      <StatCard label="Storage"         value={`${totals.storage.toFixed(1)} GB`}                   color="emerald" />
      <StatCard label="Transcoding"     value={`${totals.transcode.toLocaleString()} min`}          color="orange"  />
    </div>
  );
}

// ── Gumlet single-account stat cards ─────────────────────────────────────────

function GumletAccountStatCards({ account }: { account: GumletAccount }) {
  const s = account.stats;
  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatCard label="Total Videos"    value={s.totalVideos.toLocaleString()}               color="indigo"  />
      <StatCard label="Total Views"     value={s.totalViews.toLocaleString()}                color="purple"  />
      <StatCard label="Bandwidth"       value={`${s.bandwidthGb.toFixed(1)} GB`}             color="blue"    />
      <StatCard label="Storage"         value={`${s.storageGb.toFixed(1)} GB`}              color="emerald" />
      <StatCard label="Transcoding"     value={`${s.transcodingMins.toLocaleString()} min`} color="orange"  />
    </div>
  );
}

// ── Gumlet views chart ────────────────────────────────────────────────────────

function GumletViewsChart({
  accounts, aggregated,
}: {
  accounts: GumletAccount[]; aggregated: boolean;
}) {
  const data = useMemo(() => {
    if (!accounts[0]) return [];
    return accounts[0].dailyMetrics.map((_, i) => {
      const point: Record<string, string | number> = { date: accounts[0].dailyMetrics[i].date };
      if (aggregated) {
        accounts.forEach((acc) => { point[acc.name] = acc.dailyMetrics[i]?.views ?? 0; });
        point['Combined'] = accounts.reduce((s, acc) => s + (acc.dailyMetrics[i]?.views ?? 0), 0);
      } else {
        point['Views'] = accounts[0].dailyMetrics[i].views;
      }
      return point;
    });
  }, [accounts, aggregated]);

  const lines = aggregated
    ? [...accounts.map((a, idx) => ({ key: a.name, color: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] })),
       { key: 'Combined', color: '#f59e0b' }]
    : [{ key: 'Views', color: '#6366f1' }];

  return (
    <Card>
      <SectionTitle>Views — Last 30 Days</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false}
            interval={Math.floor(data.length / 5)} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
          {aggregated && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />}
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color}
              strokeWidth={l.key === 'Combined' ? 2 : 1.5}
              dot={false} strokeDasharray={l.key === 'Combined' ? '4 2' : undefined} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Gumlet bandwidth chart ────────────────────────────────────────────────────

function GumletBandwidthChart({
  accounts, aggregated,
}: {
  accounts: GumletAccount[]; aggregated: boolean;
}) {
  const data = useMemo(() => {
    if (!accounts[0]) return [];
    return accounts[0].dailyMetrics.map((_, i) => {
      const point: Record<string, string | number> = { date: accounts[0].dailyMetrics[i].date };
      if (aggregated) {
        accounts.forEach((acc) => { point[acc.name] = acc.dailyMetrics[i]?.bandwidth ?? 0; });
      } else {
        point['Bandwidth (GB)'] = accounts[0].dailyMetrics[i].bandwidth;
      }
      return point;
    });
  }, [accounts, aggregated]);

  const bars = aggregated
    ? accounts.map((a, idx) => ({ key: a.name, color: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] }))
    : [{ key: 'Bandwidth (GB)', color: '#8b5cf6' }];

  return (
    <Card>
      <SectionTitle>Bandwidth (GB) — Last 30 Days</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false}
            interval={Math.floor(data.length / 5)} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
          {aggregated && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />}
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} fill={b.color} stackId={aggregated ? 'stack' : undefined} radius={aggregated ? undefined : [2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Gumlet top videos table ───────────────────────────────────────────────────

function GumletTopVideos({
  accounts, aggregated,
}: {
  accounts: GumletAccount[]; aggregated: boolean;
}) {
  const videos = useMemo(() => {
    if (aggregated) {
      return accounts
        .flatMap((a) => a.topVideos.map((v) => ({ ...v, accountName: a.name })))
        .sort((a, b) => b.views - a.views)
        .slice(0, 10);
    }
    return accounts[0]?.topVideos.map((v) => ({ ...v, accountName: accounts[0].name })) ?? [];
  }, [accounts, aggregated]);

  return (
    <Card>
      <SectionTitle>Top Videos {aggregated ? '(All Accounts)' : ''}</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
              <th className="text-left pb-2 font-medium">Title</th>
              {aggregated && <th className="text-left pb-2 font-medium">Account</th>}
              <th className="text-right pb-2 font-medium">Views</th>
              <th className="text-right pb-2 font-medium">Duration</th>
              <th className="text-right pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {videos.map((v) => (
              <tr key={v.asset_id} className="text-gray-300 hover:bg-gray-800/30 transition">
                <td className="py-2.5 pr-4 max-w-[200px] truncate">{v.title}</td>
                {aggregated && (
                  <td className="py-2.5 pr-4 text-xs text-indigo-400 whitespace-nowrap">{v.accountName}</td>
                )}
                <td className="py-2.5 text-right font-medium">{v.views.toLocaleString()}</td>
                <td className="py-2.5 text-right text-gray-400">{v.duration}</td>
                <td className="py-2.5 text-right"><StatusBadge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Gumlet settings form ──────────────────────────────────────────────────────

const ALL_GUMLET_RESOLUTIONS = ['240p', '360p', '480p', '720p', '1080p'] as const;
const GUMLET_POSITIONS = ['top-left', 'top-right', 'bottom-left', 'bottom-right'] as const;

function GumletSettingsForm({
  settings,
  onSave,
  applyAllLabel = 'Save Settings',
}: {
  settings: GumletAccountSettings;
  onSave: (s: GumletAccountSettings) => void;
  applyAllLabel?: string;
}) {
  const [draft, setDraft] = useState<GumletAccountSettings>({ ...settings });
  const [confirmOpen, setConfirmOpen] = useState(false);

  const toggleRes = (r: string) =>
    setDraft((d) => ({
      ...d,
      resolutions: d.resolutions.includes(r as never)
        ? d.resolutions.filter((x) => x !== r)
        : [...d.resolutions, r as never],
    }));

  return (
    <Card className="space-y-5">
      <SectionTitle>Player &amp; Profile Settings</SectionTitle>

      {/* Resolutions */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Output Resolutions</label>
        <div className="flex flex-wrap gap-2">
          {ALL_GUMLET_RESOLUTIONS.map((r) => (
            <button
              key={r} type="button"
              onClick={() => toggleRes(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                draft.resolutions.includes(r)
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Watermark */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Watermark Logo URL</label>
          <input
            value={draft.watermarkUrl}
            onChange={(e) => setDraft((d) => ({ ...d, watermarkUrl: e.target.value }))}
            placeholder="https://..."
            className={inputCls()}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Watermark Position</label>
          <select
            value={draft.watermarkPosition}
            onChange={(e) => setDraft((d) => ({ ...d, watermarkPosition: e.target.value as typeof GUMLET_POSITIONS[number] }))}
            className={inputCls()}
          >
            {GUMLET_POSITIONS.map((p) => (
              <option key={p} value={p}>{p.replace('-', ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Watermark Width (%)</label>
          <input
            type="number" min={1} max={50}
            value={draft.watermarkWidth}
            onChange={(e) => setDraft((d) => ({ ...d, watermarkWidth: Number(e.target.value) }))}
            className={inputCls()}
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Watermark Height (%)</label>
          <input
            type="number" min={1} max={50}
            value={draft.watermarkHeight}
            onChange={(e) => setDraft((d) => ({ ...d, watermarkHeight: Number(e.target.value) }))}
            className={inputCls()}
          />
        </div>
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <ToggleSwitch
          checked={draft.autoSubtitles}
          onChange={(v) => setDraft((d) => ({ ...d, autoSubtitles: v }))}
          label="AI Auto-Subtitles"
        />
        <ToggleSwitch
          checked={draft.mp4Access}
          onChange={(v) => setDraft((d) => ({ ...d, mp4Access: v }))}
          label="MP4 Download Access"
        />
      </div>

      <button
        onClick={() => setConfirmOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
      >
        <Check size={14} /> {applyAllLabel}
      </button>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => onSave(draft)}
        title="Apply Settings"
      >
        {applyAllLabel.includes('All')
          ? 'This will apply these player and profile settings to ALL connected Gumlet accounts. Continue?'
          : 'Save these player and profile settings for this account?'}
      </ConfirmModal>
    </Card>
  );
}

// ── Gumlet upload form ────────────────────────────────────────────────────────

function GumletUploadForm({
  accounts,
  fixedAccountId,
}: {
  accounts: GumletAccount[];
  fixedAccountId?: string;
}) {
  const [selectedId, setSelectedId] = useState<string>(fixedAccountId ?? accounts[0]?.id ?? '');
  const [title, setTitle]           = useState('');
  const [url, setUrl]               = useState('');
  const [status, setStatus]         = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  const handleUpload = () => {
    if (!title.trim() || !url.trim() || !selectedId) return;
    setStatus('uploading');

    // TO GO LIVE:
    //   1. POST https://api.gumlet.com/v1/video/assets
    //      Authorization: Bearer {account.apiKey}
    //      Body: { source_url: url, source_id: account.workspaceId,
    //              title, format: "hls", resolution: account.settings.resolutions }
    //   2. Poll GET https://api.gumlet.com/v1/video/assets/{asset_id} until status === "ready"
    setTimeout(() => { setStatus('done'); setTitle(''); setUrl(''); }, 1800);
  };

  return (
    <Card className="space-y-4">
      <SectionTitle>Upload Video</SectionTitle>

      {!fixedAccountId && (
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Upload To Account</label>
          <select
            value={selectedId}
            onChange={(e) => setSelectedId(e.target.value)}
            className={inputCls()}
          >
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>{a.name}</option>
            ))}
          </select>
        </div>
      )}

      {fixedAccountId && (
        <div className="text-xs text-gray-400 px-1">
          Uploading to: <span className="text-indigo-300 font-medium">
            {accounts.find((a) => a.id === fixedAccountId)?.name ?? '—'}
          </span>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Video Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Introduction to React Hooks"
          className={inputCls()} />
      </div>

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Source URL *</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/video.mp4"
          className={inputCls()} />
        <p className="text-xs text-gray-500 mt-1">Gumlet will fetch and process the video from this URL.</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleUpload}
          disabled={status === 'uploading' || !title.trim() || !url.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
        >
          <Upload size={14} />
          {status === 'uploading' ? 'Uploading…' : 'Upload'}
        </button>
        {status === 'done' && (
          <span className="flex items-center gap-1.5 text-emerald-400 text-sm">
            <Check size={14} /> Queued for processing
          </span>
        )}
        {status === 'error' && (
          <span className="flex items-center gap-1.5 text-red-400 text-sm">
            <AlertTriangle size={14} /> Upload failed
          </span>
        )}
      </div>
    </Card>
  );
}

// ── Add Gumlet account inline form ────────────────────────────────────────────

function AddGumletAccountForm({
  onAdd, onCancel,
}: {
  onAdd: (a: GumletAccount) => void;
  onCancel: () => void;
}) {
  const [name, setName]             = useState('');
  const [apiKey, setApiKey]         = useState('');
  const [workspaceId, setWsId]      = useState('');
  const [showKey, setShowKey]       = useState(false);
  const [errors, setErrors]         = useState<string[]>([]);

  const handleAdd = () => {
    const errs: string[] = [];
    if (!name.trim())        errs.push('Account name is required.');
    if (!apiKey.trim())      errs.push('API key is required.');
    if (!workspaceId.trim()) errs.push('Workspace / Collection ID is required.');
    if (errs.length) { setErrors(errs); return; }

    // Mask the key for display
    const masked = apiKey.length > 8
      ? `${apiKey.slice(0, 4)}****...****${apiKey.slice(-4)}`
      : '****';

    // Generate 30-day flat metrics as placeholder until real API is connected
    const days: import('@/lib/videoProviders/gumletMock').GumletDayMetric[] =
      Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i));
        return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), views: 0, bandwidth: 0 };
      });

    const newAccount: GumletAccount = {
      id:          `gum-acc-${Date.now()}`,
      name:        name.trim(),
      apiKey:      masked,
      workspaceId: workspaceId.trim(),
      addedAt:     new Date().toISOString(),
      stats:       { totalVideos: 0, totalViews: 0, bandwidthGb: 0, storageGb: 0, transcodingMins: 0 },
      dailyMetrics: days,
      topVideos:   [],
      settings:    { ...DEFAULT_GUMLET_SETTINGS },
    };

    // TO GO LIVE:
    //   await supabase.from('gumlet_accounts').insert({
    //     name, api_key: encrypt(apiKey), workspace_id: workspaceId
    //   });
    //   Then fetch real stats from the API.

    onAdd(newAccount);
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-gray-900/80 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Add Gumlet Account</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-200 transition">
          <X size={16} />
        </button>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">
          {errors.map((e, i) => <p key={i} className="text-xs text-red-400">• {e}</p>)}
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Account Label *</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. TITECX Primary" className={inputCls()} />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">API Key *</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder="gml_..."
            className={inputCls('pr-10')}
          />
          <button
            type="button"
            onClick={() => setShowKey((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200"
          >
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Found in your Gumlet dashboard under API Keys.</p>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Workspace / Collection ID *</label>
        <input value={workspaceId} onChange={(e) => setWsId(e.target.value)}
          placeholder="5fc7765de648a029e1e62edf" className={inputCls()} />
        <p className="text-xs text-gray-500 mt-1">Found in your Gumlet Collections URL.</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-600 py-2 text-gray-300 hover:bg-gray-800 text-sm font-medium transition">
          Cancel
        </button>
        <button onClick={handleAdd} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2 text-white text-sm font-medium transition">
          Add Account
        </button>
      </div>
    </div>
  );
}

// ── Gumlet Aggregated View ────────────────────────────────────────────────────

function GumletAggregatedView({
  accounts,
  onUpdateAllSettings,
}: {
  accounts: GumletAccount[];
  onUpdateAllSettings: (s: GumletAccountSettings) => void;
}) {
  const firstSettings = accounts[0]?.settings ?? DEFAULT_GUMLET_SETTINGS;

  return (
    <div className="space-y-5">
      <GumletStatCards accounts={accounts} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GumletViewsChart accounts={accounts} aggregated />
        <GumletBandwidthChart accounts={accounts} aggregated />
      </div>
      <GumletTopVideos accounts={accounts} aggregated />
      <GumletSettingsForm
        settings={firstSettings}
        onSave={onUpdateAllSettings}
        applyAllLabel="Apply to All Accounts"
      />
      <GumletUploadForm accounts={accounts} />
    </div>
  );
}

// ── Gumlet Per-Account View ───────────────────────────────────────────────────

function GumletAccountView({
  account,
  allAccounts,
  onUpdateSettings,
  onDelete,
}: {
  account: GumletAccount;
  allAccounts: GumletAccount[];
  onUpdateSettings: (id: string, s: GumletAccountSettings) => void;
  onDelete: (id: string) => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="space-y-5">
      {/* Account info banner */}
      <Card className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-white">{account.name}</p>
          <p className="text-xs text-gray-400">Workspace: <span className="text-gray-300">{account.workspaceId}</span></p>
          <p className="text-xs text-gray-400">API Key: <span className="font-mono text-gray-300">{account.apiKey}</span></p>
          <p className="text-xs text-gray-500">Added {new Date(account.addedAt).toLocaleDateString()}</p>
        </div>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition shrink-0"
        >
          <Trash2 size={12} /> Remove Account
        </button>
      </Card>

      <GumletAccountStatCards account={account} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <GumletViewsChart accounts={[account]} aggregated={false} />
        <GumletBandwidthChart accounts={[account]} aggregated={false} />
      </div>
      <GumletTopVideos accounts={[account]} aggregated={false} />
      <GumletSettingsForm
        settings={account.settings}
        onSave={(s) => onUpdateSettings(account.id, s)}
        applyAllLabel="Save Settings"
      />
      <GumletUploadForm accounts={allAccounts} fixedAccountId={account.id} />

      <ConfirmModal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => onDelete(account.id)}
        title="Remove Account"
      >
        Remove <strong className="text-white">{account.name}</strong> from TITECX? This only removes it from your dashboard — it does not delete the Gumlet account or its videos.
      </ConfirmModal>
    </div>
  );
}

// ─── BUNNY SECTION ────────────────────────────────────────────────────────────

// ── Bunny stat cards ──────────────────────────────────────────────────────────

function BunnyLibraryStatCards({ libs, aggregated }: { libs: BunnyLibrary[]; aggregated: boolean }) {
  const stats = useMemo(() => libs.reduce(
    (acc, l) => ({
      videos:     acc.videos     + l.stats.totalVideos,
      views:      acc.views      + l.stats.totalViews,
      watchTime:  acc.watchTime  + l.stats.totalWatchTimeMinutes,
      engagement: acc.engagement + l.stats.engagementScore,
      storage:    acc.storage    + l.stats.storageSizeGb,
    }),
    { videos: 0, views: 0, watchTime: 0, engagement: 0, storage: 0 },
  ), [libs]);

  const avgEngagement = libs.length > 0 ? Math.round(stats.engagement / libs.length) : 0;
  const watchHours = (stats.watchTime / 60).toFixed(0);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
      <StatCard label="Total Videos"    value={stats.videos.toLocaleString()}               color="indigo"  />
      <StatCard label="Total Views"     value={stats.views.toLocaleString()}                color="purple"  />
      <StatCard label="Watch Time"      value={`${watchHours} hrs`}                          color="blue"    />
      <StatCard label={aggregated ? 'Avg Engagement' : 'Engagement Score'}
                value={`${avgEngagement}/100`}                                               color="emerald" />
      <StatCard label="Storage"         value={`${stats.storage.toFixed(1)} GB`}            color="orange"  />
    </div>
  );
}

// ── Bunny views chart ─────────────────────────────────────────────────────────

function BunnyViewsChart({ libs, aggregated }: { libs: BunnyLibrary[]; aggregated: boolean }) {
  const data = useMemo(() => {
    if (!libs[0]) return [];
    return libs[0].dailyMetrics.map((_, i) => {
      const point: Record<string, string | number> = { date: libs[0].dailyMetrics[i].date };
      if (aggregated) {
        libs.forEach((l) => { point[l.name] = l.dailyMetrics[i]?.views ?? 0; });
        point['Combined'] = libs.reduce((s, l) => s + (l.dailyMetrics[i]?.views ?? 0), 0);
      } else {
        point['Views'] = libs[0].dailyMetrics[i].views;
      }
      return point;
    });
  }, [libs, aggregated]);

  const lines = aggregated
    ? [...libs.map((l, idx) => ({ key: l.name, color: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] })),
       { key: 'Combined', color: '#f59e0b' }]
    : [{ key: 'Views', color: '#6366f1' }];

  return (
    <Card>
      <SectionTitle>Views — Last 30 Days</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <LineChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false}
            interval={Math.floor(data.length / 5)} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
          {aggregated && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />}
          {lines.map((l) => (
            <Line key={l.key} type="monotone" dataKey={l.key} stroke={l.color}
              strokeWidth={l.key === 'Combined' ? 2 : 1.5} dot={false}
              strokeDasharray={l.key === 'Combined' ? '4 2' : undefined} />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Bunny watch-time chart ────────────────────────────────────────────────────

function BunnyWatchTimeChart({ libs, aggregated }: { libs: BunnyLibrary[]; aggregated: boolean }) {
  const data = useMemo(() => {
    if (!libs[0]) return [];
    return libs[0].dailyMetrics.map((_, i) => {
      const point: Record<string, string | number> = { date: libs[0].dailyMetrics[i].date };
      if (aggregated) {
        libs.forEach((l) => { point[l.name] = Math.round((l.dailyMetrics[i]?.watchTimeMinutes ?? 0) / 60); });
      } else {
        point['Watch (hrs)'] = Math.round((libs[0].dailyMetrics[i].watchTimeMinutes) / 60);
      }
      return point;
    });
  }, [libs, aggregated]);

  const bars = aggregated
    ? libs.map((l, idx) => ({ key: l.name, color: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] }))
    : [{ key: 'Watch (hrs)', color: '#8b5cf6' }];

  return (
    <Card>
      <SectionTitle>Watch Time (hrs) — Last 30 Days</SectionTitle>
      <ResponsiveContainer width="100%" height={200}>
        <BarChart data={data} margin={{ top: 4, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1f2937" />
          <XAxis dataKey="date" tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false}
            interval={Math.floor(data.length / 5)} />
          <YAxis tick={{ fill: '#6b7280', fontSize: 10 }} tickLine={false} axisLine={false} />
          <Tooltip contentStyle={{ background: '#111827', border: '1px solid #374151', borderRadius: 8, fontSize: 12 }} />
          {aggregated && <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />}
          {bars.map((b) => (
            <Bar key={b.key} dataKey={b.key} fill={b.color} stackId={aggregated ? 'stack' : undefined}
              radius={aggregated ? undefined : [2, 2, 0, 0]} />
          ))}
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}

// ── Bunny countries table ─────────────────────────────────────────────────────

function BunnyCountriesTable({ libs, aggregated }: { libs: BunnyLibrary[]; aggregated: boolean }) {
  const countries = useMemo(() => {
    const map: Record<string, { country: string; code: string; views: number; watchTimeMinutes: number }> = {};
    libs.forEach((l) => {
      l.countryStats.forEach((c) => {
        if (map[c.code]) {
          map[c.code].views            += c.views;
          map[c.code].watchTimeMinutes += c.watchTimeMinutes;
        } else {
          map[c.code] = { ...c };
        }
      });
    });
    return Object.values(map).sort((a, b) => b.views - a.views).slice(0, 8);
  }, [libs, aggregated]);

  return (
    <Card>
      <SectionTitle>Top Countries {aggregated ? '(All Libraries)' : ''}</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
              <th className="text-left pb-2 font-medium">Country</th>
              <th className="text-right pb-2 font-medium">Views</th>
              <th className="text-right pb-2 font-medium">Watch Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {countries.map((c) => (
              <tr key={c.code} className="text-gray-300 hover:bg-gray-800/30 transition">
                <td className="py-2.5 flex items-center gap-2">
                  <span className="text-gray-500">{c.code}</span> {c.country}
                </td>
                <td className="py-2.5 text-right font-medium">{c.views.toLocaleString()}</td>
                <td className="py-2.5 text-right text-gray-400">{(c.watchTimeMinutes / 60).toFixed(1)} hrs</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Bunny videos table ────────────────────────────────────────────────────────

function BunnyVideosTable({ libs, aggregated }: { libs: BunnyLibrary[]; aggregated: boolean }) {
  const videos = useMemo(() => {
    if (aggregated) {
      return libs
        .flatMap((l) => l.videos.map((v) => ({ ...v, libraryName: l.name })))
        .sort((a, b) => b.views - a.views);
    }
    return libs[0]?.videos.map((v) => ({ ...v, libraryName: libs[0].name })) ?? [];
  }, [libs, aggregated]);

  return (
    <Card>
      <SectionTitle>Videos {aggregated ? '(All Libraries)' : ''}</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b border-gray-800">
              <th className="text-left pb-2 font-medium">Title</th>
              {aggregated && <th className="text-left pb-2 font-medium">Library</th>}
              <th className="text-right pb-2 font-medium">Views</th>
              <th className="text-right pb-2 font-medium">Duration</th>
              <th className="text-right pb-2 font-medium">Size</th>
              <th className="text-right pb-2 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800/60">
            {videos.map((v) => (
              <tr key={v.videoId} className="text-gray-300 hover:bg-gray-800/30 transition">
                <td className="py-2.5 pr-4 max-w-[200px] truncate">{v.title}</td>
                {aggregated && <td className="py-2.5 pr-4 text-xs text-indigo-400 whitespace-nowrap">{v.libraryName}</td>}
                <td className="py-2.5 text-right font-medium">{v.views.toLocaleString()}</td>
                <td className="py-2.5 text-right text-gray-400">{fmtSeconds(v.length)}</td>
                <td className="py-2.5 text-right text-gray-400">{fmtBytes(v.storageSize)}</td>
                <td className="py-2.5 text-right"><StatusBadge status={v.status} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}

// ── Bunny settings form ───────────────────────────────────────────────────────

const ALL_BUNNY_RESOLUTIONS = ['240p', '360p', '480p', '720p', '1080p', '1440p', '2160p'];

function BunnySettingsForm({
  settings,
  onSave,
  applyAllLabel = 'Save Settings',
}: {
  settings: BunnyLibrarySettings;
  onSave: (s: BunnyLibrarySettings) => void;
  applyAllLabel?: string;
}) {
  const [draft, setDraft]         = useState<BunnyLibrarySettings>({ ...settings });
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [showHtml, setShowHtml]   = useState(false);

  const selectedRes = draft.enabledResolutions.split(',').filter(Boolean);
  const toggleRes = (r: string) => {
    const next = selectedRes.includes(r) ? selectedRes.filter((x) => x !== r) : [...selectedRes, r];
    setDraft((d) => ({ ...d, enabledResolutions: next.join(',') }));
  };

  return (
    <Card className="space-y-5">
      <SectionTitle>Player &amp; Library Settings</SectionTitle>

      {/* Player colour */}
      <div className="flex items-center gap-4">
        <div className="flex-1">
          <label className="block text-xs text-gray-400 mb-1.5">Player Accent Color</label>
          <div className="flex items-center gap-3">
            <input
              type="color"
              value={draft.playerKeyColor}
              onChange={(e) => setDraft((d) => ({ ...d, playerKeyColor: e.target.value }))}
              className="w-10 h-9 rounded-lg cursor-pointer bg-transparent border border-gray-700 p-0.5"
            />
            <input
              value={draft.playerKeyColor}
              onChange={(e) => setDraft((d) => ({ ...d, playerKeyColor: e.target.value }))}
              className={inputCls('flex-1')}
              placeholder="#6366f1"
            />
          </div>
        </div>
      </div>

      {/* Resolutions */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Enabled Resolutions</label>
        <div className="flex flex-wrap gap-2">
          {ALL_BUNNY_RESOLUTIONS.map((r) => (
            <button key={r} type="button" onClick={() => toggleRes(r)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border transition ${
                selectedRes.includes(r)
                  ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/50'
                  : 'bg-gray-800 text-gray-400 border-gray-700 hover:border-indigo-500/30'
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Watermark position */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {(['watermarkPositionLeft', 'watermarkPositionTop', 'watermarkWidth', 'watermarkHeight'] as const).map((key) => (
          <div key={key}>
            <label className="block text-xs text-gray-400 mb-1.5 capitalize">
              {key.replace('watermark', '').replace(/([A-Z])/g, ' $1').trim()} (%)
            </label>
            <input
              type="number" min={0} max={100}
              value={draft[key]}
              onChange={(e) => setDraft((d) => ({ ...d, [key]: Number(e.target.value) }))}
              className={inputCls()}
            />
          </div>
        ))}
      </div>

      {/* Toggles */}
      <div className="space-y-3">
        <ToggleSwitch
          checked={draft.enableTokenAuthentication}
          onChange={(v) => setDraft((d) => ({ ...d, enableTokenAuthentication: v }))}
          label="Token Authentication"
        />
        <ToggleSwitch
          checked={draft.watchTimeHeatmapEnabled}
          onChange={(v) => setDraft((d) => ({ ...d, watchTimeHeatmapEnabled: v }))}
          label="Watchtime Heatmap"
        />
      </div>

      {/* Custom HTML */}
      <div>
        <button
          type="button"
          onClick={() => setShowHtml((s) => !s)}
          className="flex items-center gap-1.5 text-xs text-gray-400 hover:text-gray-200 transition mb-2"
        >
          {showHtml ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          Custom Player HTML
        </button>
        {showHtml && (
          <textarea
            rows={4}
            value={draft.customHTML}
            onChange={(e) => setDraft((d) => ({ ...d, customHTML: e.target.value }))}
            placeholder="<!-- Custom HTML injected into the player -->"
            className={inputCls('font-mono text-xs')}
          />
        )}
      </div>

      <button
        onClick={() => setConfirmOpen(true)}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium transition"
      >
        <Check size={14} /> {applyAllLabel}
      </button>

      <ConfirmModal
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => onSave(draft)}
        title="Apply Settings"
      >
        {applyAllLabel.includes('All')
          ? 'This will apply these player settings to ALL connected Bunny libraries. Continue?'
          : 'Save these settings for this library?'}
      </ConfirmModal>
    </Card>
  );
}

// ── Bunny upload form ─────────────────────────────────────────────────────────

function BunnyUploadForm({
  libs, fixedLibraryId,
}: {
  libs: BunnyLibrary[];
  fixedLibraryId?: string;
}) {
  const selectedLib = fixedLibraryId ? libs.find((l) => l.id === fixedLibraryId) : undefined;
  const [selectedId, setSelectedId]         = useState<string>(fixedLibraryId ?? libs[0]?.id ?? '');
  const [title, setTitle]                   = useState('');
  const [url, setUrl]                       = useState('');
  const [collectionId, setCollectionId]     = useState('');
  const [status, setStatus]                 = useState<'idle' | 'uploading' | 'done' | 'error'>('idle');

  const activeLib = fixedLibraryId ? selectedLib : libs.find((l) => l.id === selectedId);

  const handleUpload = () => {
    if (!title.trim() || !selectedId) return;
    setStatus('uploading');

    // TO GO LIVE:
    //   const lib = libs.find(l => l.id === selectedId);
    //   1. POST https://video.bunnycdn.com/library/{lib.libraryId}/videos
    //      AccessKey: {lib.apiKey}
    //      Body: { title, collectionId }
    //      → { videoId }
    //   2. If url provided:
    //      POST https://video.bunnycdn.com/library/{lib.libraryId}/videos/fetch
    //      AccessKey: {lib.apiKey}
    //      Body: { url }
    //   3. Else: PUT binary upload to https://video.bunnycdn.com/library/{lib.libraryId}/videos/{videoId}

    setTimeout(() => { setStatus('done'); setTitle(''); setUrl(''); setCollectionId(''); }, 1800);
  };

  return (
    <Card className="space-y-4">
      <SectionTitle>Upload Video</SectionTitle>

      {!fixedLibraryId && (
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Upload To Library</label>
          <select value={selectedId} onChange={(e) => setSelectedId(e.target.value)} className={inputCls()}>
            {libs.map((l) => <option key={l.id} value={l.id}>{l.name}</option>)}
          </select>
        </div>
      )}

      {fixedLibraryId && activeLib && (
        <p className="text-xs text-gray-400 px-1">
          Uploading to: <span className="text-indigo-300 font-medium">{activeLib.name}</span>
          <span className="text-gray-500 ml-2">(Library ID: {activeLib.libraryId})</span>
        </p>
      )}

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Video Title *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Introduction to React Hooks" className={inputCls()} />
      </div>

      {activeLib && activeLib.collections.length > 0 && (
        <div>
          <label className="block text-xs text-gray-400 mb-1.5">Collection (optional)</label>
          <select value={collectionId} onChange={(e) => setCollectionId(e.target.value)} className={inputCls()}>
            <option value="">— No Collection —</option>
            {activeLib.collections.map((c) => (
              <option key={c.collectionId} value={c.collectionId}>{c.name} ({c.videoCount} videos)</option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Source URL (optional)</label>
        <input value={url} onChange={(e) => setUrl(e.target.value)}
          placeholder="https://example.com/video.mp4" className={inputCls()} />
        <p className="text-xs text-gray-500 mt-1">Leave blank to upload a file (direct upload via Bunny API).</p>
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleUpload}
          disabled={status === 'uploading' || !title.trim()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-medium transition"
        >
          <Upload size={14} />
          {status === 'uploading' ? 'Uploading…' : 'Upload'}
        </button>
        {status === 'done'  && <span className="flex items-center gap-1.5 text-emerald-400 text-sm"><Check size={14} /> Created in Bunny library</span>}
        {status === 'error' && <span className="flex items-center gap-1.5 text-red-400 text-sm"><AlertTriangle size={14} /> Upload failed</span>}
      </div>
    </Card>
  );
}

// ── Add Bunny library inline form ─────────────────────────────────────────────

function AddBunnyLibraryForm({
  onAdd, onCancel,
}: {
  onAdd: (l: BunnyLibrary) => void;
  onCancel: () => void;
}) {
  const [name, setName]             = useState('');
  const [libraryId, setLibraryId]   = useState('');
  const [apiKey, setApiKey]         = useState('');
  const [showKey, setShowKey]       = useState(false);
  const [errors, setErrors]         = useState<string[]>([]);

  const handleAdd = () => {
    const errs: string[] = [];
    if (!name.trim())      errs.push('Library name is required.');
    if (!libraryId.trim()) errs.push('Library ID is required.');
    if (!apiKey.trim())    errs.push('API key is required.');
    if (errs.length) { setErrors(errs); return; }

    const masked = apiKey.length > 8
      ? `${apiKey.slice(0, 4)}****...****${apiKey.slice(-4)}`
      : '****';

    const days: import('@/lib/videoProviders/bunnyMock').BunnyDayMetric[] =
      Array.from({ length: 30 }, (_, i) => {
        const d = new Date(); d.setDate(d.getDate() - (29 - i));
        return { date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }), views: 0, watchTimeMinutes: 0 };
      });

    const newLib: BunnyLibrary = {
      id:          `bun-lib-${Date.now()}`,
      name:        name.trim(),
      libraryId:   libraryId.trim(),
      apiKey:      masked,
      addedAt:     new Date().toISOString(),
      stats:       { totalVideos: 0, totalViews: 0, totalWatchTimeMinutes: 0, engagementScore: 0, storageSizeGb: 0 },
      dailyMetrics: days,
      countryStats: [],
      videos:      [],
      collections: [],
      settings:    { ...DEFAULT_BUNNY_SETTINGS },
    };

    // TO GO LIVE:
    //   await supabase.from('bunny_libraries').insert({
    //     name, library_id: libraryId, api_key: encrypt(apiKey)
    //   });
    //   Then fetch real stats from:
    //   GET https://video.bunnycdn.com/library/{libraryId}/statistics  AccessKey: {apiKey}
    //   GET https://video.bunnycdn.com/library/{libraryId}/videos      AccessKey: {apiKey}

    onAdd(newLib);
  };

  return (
    <div className="rounded-xl border border-indigo-500/30 bg-gray-900/80 p-5 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Add Bunny Library</h3>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-200 transition"><X size={16} /></button>
      </div>

      {errors.length > 0 && (
        <div className="space-y-1">{errors.map((e, i) => <p key={i} className="text-xs text-red-400">• {e}</p>)}</div>
      )}

      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Library Label *</label>
        <input value={name} onChange={(e) => setName(e.target.value)}
          placeholder="e.g. TITECX Main Library" className={inputCls()} />
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Library ID *</label>
        <input value={libraryId} onChange={(e) => setLibraryId(e.target.value)}
          placeholder="234567" className={inputCls()} />
        <p className="text-xs text-gray-500 mt-1">Found in your Bunny Stream dashboard under API.</p>
      </div>
      <div>
        <label className="block text-xs text-gray-400 mb-1.5">Stream API Key *</label>
        <div className="relative">
          <input
            type={showKey ? 'text' : 'password'}
            value={apiKey} onChange={(e) => setApiKey(e.target.value)}
            placeholder="Library API key..."
            className={inputCls('pr-10')}
          />
          <button type="button" onClick={() => setShowKey((s) => !s)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-200">
            {showKey ? <EyeOff size={14} /> : <Eye size={14} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Found in Bunny Stream → Library → API tab.</p>
      </div>

      <div className="flex gap-3">
        <button onClick={onCancel} className="flex-1 rounded-lg border border-gray-600 py-2 text-gray-300 hover:bg-gray-800 text-sm font-medium transition">
          Cancel
        </button>
        <button onClick={handleAdd} className="flex-1 rounded-lg bg-indigo-600 hover:bg-indigo-700 py-2 text-white text-sm font-medium transition">
          Add Library
        </button>
      </div>
    </div>
  );
}

// ── Bunny Aggregated View ─────────────────────────────────────────────────────

function BunnyAggregatedView({
  libs,
  onUpdateAllSettings,
}: {
  libs: BunnyLibrary[];
  onUpdateAllSettings: (s: BunnyLibrarySettings) => void;
}) {
  return (
    <div className="space-y-5">
      <BunnyLibraryStatCards libs={libs} aggregated />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BunnyViewsChart libs={libs} aggregated />
        <BunnyWatchTimeChart libs={libs} aggregated />
      </div>
      <BunnyCountriesTable libs={libs} aggregated />
      <BunnyVideosTable libs={libs} aggregated />
      <BunnySettingsForm
        settings={libs[0]?.settings ?? DEFAULT_BUNNY_SETTINGS}
        onSave={onUpdateAllSettings}
        applyAllLabel="Apply to All Libraries"
      />
      <BunnyUploadForm libs={libs} />
    </div>
  );
}

// ── Bunny Per-Library View ────────────────────────────────────────────────────

function BunnyLibraryView({
  lib,
  allLibs,
  onUpdateSettings,
  onDelete,
}: {
  lib: BunnyLibrary;
  allLibs: BunnyLibrary[];
  onUpdateSettings: (id: string, s: BunnyLibrarySettings) => void;
  onDelete: (id: string) => void;
}) {
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  return (
    <div className="space-y-5">
      <Card className="flex items-center justify-between gap-4">
        <div className="space-y-0.5">
          <p className="text-sm font-semibold text-white">{lib.name}</p>
          <p className="text-xs text-gray-400">Library ID: <span className="text-gray-300">{lib.libraryId}</span></p>
          <p className="text-xs text-gray-400">API Key: <span className="font-mono text-gray-300">{lib.apiKey}</span></p>
          <p className="text-xs text-gray-500">Added {new Date(lib.addedAt).toLocaleDateString()}</p>
        </div>
        <button
          onClick={() => setDeleteConfirm(true)}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-red-500/30 text-red-400 hover:bg-red-500/10 text-xs font-medium transition shrink-0"
        >
          <Trash2 size={12} /> Remove Library
        </button>
      </Card>

      <BunnyLibraryStatCards libs={[lib]} aggregated={false} />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BunnyViewsChart libs={[lib]} aggregated={false} />
        <BunnyWatchTimeChart libs={[lib]} aggregated={false} />
      </div>
      <BunnyCountriesTable libs={[lib]} aggregated={false} />
      <BunnyVideosTable libs={[lib]} aggregated={false} />
      <BunnySettingsForm
        settings={lib.settings}
        onSave={(s) => onUpdateSettings(lib.id, s)}
        applyAllLabel="Save Settings"
      />
      <BunnyUploadForm libs={allLibs} fixedLibraryId={lib.id} />

      <ConfirmModal
        open={deleteConfirm}
        onClose={() => setDeleteConfirm(false)}
        onConfirm={() => onDelete(lib.id)}
        title="Remove Library"
      >
        Remove <strong className="text-white">{lib.name}</strong> from TITECX? This only removes it from your dashboard — it does not delete the Bunny library or its videos.
      </ConfirmModal>
    </div>
  );
}

// ─── MAIN PAGE ────────────────────────────────────────────────────────────────

type ProviderTab = 'gumlet' | 'bunny';

export default function VideoProvidersPage() {
  // ── State ──────────────────────────────────────────────────────────────────
  const [activeProvider, setActiveProvider] = useState<ProviderTab>('gumlet');

  // Gumlet
  const [gumletAccounts, setGumletAccounts] = useState<GumletAccount[]>(INITIAL_GUMLET_ACCOUNTS);
  const [gumletSubTab, setGumletSubTab]     = useState<'aggregated' | string>('aggregated');
  const [showAddGumlet, setShowAddGumlet]   = useState(false);

  // Bunny
  const [bunnyLibraries, setBunnyLibraries] = useState<BunnyLibrary[]>(INITIAL_BUNNY_LIBRARIES);
  const [bunnySubTab, setBunnySubTab]       = useState<'aggregated' | string>('aggregated');
  const [showAddBunny, setShowAddBunny]     = useState(false);

  // ── Gumlet handlers ────────────────────────────────────────────────────────
  const addGumletAccount = useCallback((a: GumletAccount) => {
    setGumletAccounts((prev) => [...prev, a]);
    setGumletSubTab(a.id);
    setShowAddGumlet(false);
  }, []);

  const deleteGumletAccount = useCallback((id: string) => {
    setGumletAccounts((prev) => {
      const next = prev.filter((a) => a.id !== id);
      setGumletSubTab(next.length > 0 ? 'aggregated' : 'aggregated');
      return next;
    });
  }, []);

  const updateGumletSettings = useCallback((id: string, s: GumletAccountSettings) => {
    setGumletAccounts((prev) => prev.map((a) => a.id === id ? { ...a, settings: s } : a));
  }, []);

  const updateAllGumletSettings = useCallback((s: GumletAccountSettings) => {
    setGumletAccounts((prev) => prev.map((a) => ({ ...a, settings: { ...s } })));
  }, []);

  // ── Bunny handlers ─────────────────────────────────────────────────────────
  const addBunnyLibrary = useCallback((l: BunnyLibrary) => {
    setBunnyLibraries((prev) => [...prev, l]);
    setBunnySubTab(l.id);
    setShowAddBunny(false);
  }, []);

  const deleteBunnyLibrary = useCallback((id: string) => {
    setBunnyLibraries((prev) => {
      const next = prev.filter((l) => l.id !== id);
      setBunnySubTab('aggregated');
      return next;
    });
  }, []);

  const updateBunnySettings = useCallback((id: string, s: BunnyLibrarySettings) => {
    setBunnyLibraries((prev) => prev.map((l) => l.id === id ? { ...l, settings: s } : l));
  }, []);

  const updateAllBunnySettings = useCallback((s: BunnyLibrarySettings) => {
    setBunnyLibraries((prev) => prev.map((l) => ({ ...l, settings: { ...s } })));
  }, []);

  // ── Derived ────────────────────────────────────────────────────────────────
  const activeGumletAccount = gumletSubTab !== 'aggregated'
    ? gumletAccounts.find((a) => a.id === gumletSubTab) ?? null
    : null;

  const activeBunnyLibrary = bunnySubTab !== 'aggregated'
    ? bunnyLibraries.find((l) => l.id === bunnySubTab) ?? null
    : null;

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-6">

      {/* Page header */}
      <div>
        <h1 className="text-3xl font-bold text-white">Video Providers</h1>
        <p className="mt-1 text-gray-400 text-sm">Manage Gumlet and Bunny Stream accounts, analytics, and settings.</p>
      </div>

      {/* Provider top-level tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-gray-900/60 border border-indigo-500/15 w-fit">
        {(['gumlet', 'bunny'] as ProviderTab[]).map((p) => (
          <button
            key={p}
            onClick={() => setActiveProvider(p)}
            className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-medium transition ${
              activeProvider === p
                ? 'bg-indigo-500/20 text-white border border-indigo-500/40'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {p === 'gumlet' ? <Film size={15} /> : <BarChart2 size={15} />}
            {p.charAt(0).toUpperCase() + p.slice(1)}
          </button>
        ))}
      </div>

      {/* ── GUMLET PANEL ── */}
      {activeProvider === 'gumlet' && (
        <div className="space-y-5">

          {/* Gumlet sub-tab bar */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Sub-tabs */}
            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-gray-900/60 border border-indigo-500/15">
              <button
                onClick={() => setGumletSubTab('aggregated')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  gumletSubTab === 'aggregated'
                    ? 'bg-indigo-500/25 text-white border border-indigo-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Aggregated
              </button>
              {gumletAccounts.map((acc, idx) => (
                <button
                  key={acc.id}
                  onClick={() => setGumletSubTab(acc.id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                    gumletSubTab === acc.id
                      ? 'bg-indigo-500/25 text-white border border-indigo-500/40'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] }}
                  />
                  {acc.name}
                </button>
              ))}
            </div>

            {/* Add account button */}
            <button
              onClick={() => { setShowAddGumlet((s) => !s); }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs font-medium transition"
            >
              {showAddGumlet ? <X size={13} /> : <Plus size={13} />}
              {showAddGumlet ? 'Cancel' : 'Add Account'}
            </button>
          </div>

          {/* Add account form (inline) */}
          {showAddGumlet && (
            <AddGumletAccountForm
              onAdd={addGumletAccount}
              onCancel={() => setShowAddGumlet(false)}
            />
          )}

          {/* Content */}
          {gumletAccounts.length === 0 ? (
            <Card className="text-center py-16">
              <Globe size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No Gumlet accounts connected</p>
              <p className="text-gray-500 text-sm mt-1">Click "Add Account" to get started.</p>
            </Card>
          ) : gumletSubTab === 'aggregated' ? (
            <GumletAggregatedView
              accounts={gumletAccounts}
              onUpdateAllSettings={updateAllGumletSettings}
            />
          ) : activeGumletAccount ? (
            <GumletAccountView
              account={activeGumletAccount}
              allAccounts={gumletAccounts}
              onUpdateSettings={updateGumletSettings}
              onDelete={deleteGumletAccount}
            />
          ) : null}
        </div>
      )}

      {/* ── BUNNY PANEL ── */}
      {activeProvider === 'bunny' && (
        <div className="space-y-5">

          {/* Bunny sub-tab bar */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex flex-wrap gap-1 p-1 rounded-xl bg-gray-900/60 border border-indigo-500/15">
              <button
                onClick={() => setBunnySubTab('aggregated')}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition ${
                  bunnySubTab === 'aggregated'
                    ? 'bg-indigo-500/25 text-white border border-indigo-500/40'
                    : 'text-gray-400 hover:text-gray-200'
                }`}
              >
                Aggregated
              </button>
              {bunnyLibraries.map((lib, idx) => (
                <button
                  key={lib.id}
                  onClick={() => setBunnySubTab(lib.id)}
                  className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-medium transition ${
                    bunnySubTab === lib.id
                      ? 'bg-indigo-500/25 text-white border border-indigo-500/40'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  <span
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: ACCOUNT_COLORS[idx % ACCOUNT_COLORS.length] }}
                  />
                  {lib.name}
                </button>
              ))}
            </div>

            <button
              onClick={() => setShowAddBunny((s) => !s)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-indigo-500/30 text-indigo-400 hover:bg-indigo-500/10 text-xs font-medium transition"
            >
              {showAddBunny ? <X size={13} /> : <Plus size={13} />}
              {showAddBunny ? 'Cancel' : 'Add Library'}
            </button>
          </div>

          {/* Add library form (inline) */}
          {showAddBunny && (
            <AddBunnyLibraryForm
              onAdd={addBunnyLibrary}
              onCancel={() => setShowAddBunny(false)}
            />
          )}

          {/* Content */}
          {bunnyLibraries.length === 0 ? (
            <Card className="text-center py-16">
              <Globe size={32} className="text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400 font-medium">No Bunny libraries connected</p>
              <p className="text-gray-500 text-sm mt-1">Click "Add Library" to get started.</p>
            </Card>
          ) : bunnySubTab === 'aggregated' ? (
            <BunnyAggregatedView
              libs={bunnyLibraries}
              onUpdateAllSettings={updateAllBunnySettings}
            />
          ) : activeBunnyLibrary ? (
            <BunnyLibraryView
              lib={activeBunnyLibrary}
              allLibs={bunnyLibraries}
              onUpdateSettings={updateBunnySettings}
              onDelete={deleteBunnyLibrary}
            />
          ) : null}
        </div>
      )}
    </div>
  );
}
