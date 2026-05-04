/**
 * Gumlet mock data — mirrors the real API response shapes exactly.
 *
 * ─── TO GO LIVE ────────────────────────────────────────────────────────────
 *
 * 1.  Store accounts in Supabase:
 *       create table gumlet_accounts (
 *         id          uuid primary key default gen_random_uuid(),
 *         name        text not null,
 *         api_key     text not null,   -- encrypt at rest (pgcrypto)
 *         workspace_id text not null,
 *         created_at  timestamptz default now()
 *       );
 *
 * 2.  Replace each mock function below with these real fetch calls:
 *
 *     List assets:
 *       GET https://api.gumlet.com/v1/video/assets/list/{workspaceId}
 *       Authorization: Bearer {apiKey}
 *       → { assets: GumletVideo[], page, total }
 *
 *     Analytics (views, bandwidth, storage):
 *       POST https://api.gumlet.com/v1/video/analytics
 *       Authorization: Bearer {apiKey}
 *       Body: {
 *         workspace_id: string,
 *         metrics: ["views","bandwidth","storage","transcoding"],
 *         start_date: "YYYY-MM-DD",
 *         end_date:   "YYYY-MM-DD",
 *         granularity: "daily"
 *       }
 *       → { data: { date, views, bandwidth, storage, transcoding }[] }
 *
 *     Upload from URL:
 *       POST https://api.gumlet.com/v1/video/assets
 *       Authorization: Bearer {apiKey}
 *       Body: { source_url, source_id: workspaceId, format: "hls",
 *               resolution: ["240p","360p","720p","1080p"] }
 *
 *     Update profile / player settings:
 *       POST https://api.gumlet.com/v1/video/profiles/{profileId}
 *       Authorization: Bearer {apiKey}
 *       Body: { resolution, image_overlay, subtitle_languages, mp4_access }
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GumletDayMetric {
  date:      string; // "Apr 5"
  views:     number;
  bandwidth: number; // GB
}

export interface GumletVideo {
  asset_id:      string;
  title:         string;
  duration:      string; // "mm:ss"
  views:         number;
  status:        'ready' | 'processing' | 'queued' | 'error';
  created_at:    string; // ISO date string
  thumbnail_url: string;
}

export interface GumletAccountSettings {
  resolutions:        ('240p' | '360p' | '480p' | '720p' | '1080p')[];
  watermarkUrl:       string;
  watermarkPosition:  'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  watermarkWidth:     number; // % of video width
  watermarkHeight:    number; // % of video height
  autoSubtitles:      boolean;
  mp4Access:          boolean;
}

export interface GumletAccountStats {
  totalVideos:     number;
  totalViews:      number;
  bandwidthGb:     number;
  storageGb:       number;
  transcodingMins: number;
}

export interface GumletAccount {
  id:          string; // internal UUID
  name:        string; // friendly label
  apiKey:      string; // masked for display: "gml_****...****"
  workspaceId: string;
  addedAt:     string; // ISO date string
  stats:       GumletAccountStats;
  dailyMetrics: GumletDayMetric[];
  topVideos:   GumletVideo[];
  settings:    GumletAccountSettings;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function lastNDays(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (n - 1 - i));
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  });
}

const DATES = lastNDays(30);

function mockMetrics(
  baseViews: number,
  baseBW: number,
  seed: number,
): GumletDayMetric[] {
  return DATES.map((date, i) => {
    const v = 0.55 + ((seed * 7 + i * 17) % 45) / 100;
    return {
      date,
      views:     Math.round(baseViews * v),
      bandwidth: parseFloat((baseBW * v).toFixed(2)),
    };
  });
}

// ── Mock accounts ─────────────────────────────────────────────────────────────

export const INITIAL_GUMLET_ACCOUNTS: GumletAccount[] = [
  {
    id:          'gum-acc-001',
    name:        'TITECX Primary',
    apiKey:      'gml_****...****3a9f',
    workspaceId: '5fc7765de648a029e1e62edf',
    addedAt:     '2025-01-12T10:00:00Z',
    stats: {
      totalVideos:     48,
      totalViews:      12_840,
      bandwidthGb:     94.6,
      storageGb:       22.3,
      transcodingMins: 384,
    },
    dailyMetrics: mockMetrics(480, 3.2, 3),
    settings: {
      resolutions:       ['360p', '720p', '1080p'],
      watermarkUrl:      'https://assets.gumlet.io/assets/logo.svg',
      watermarkPosition: 'top-right',
      watermarkWidth:    10,
      watermarkHeight:   10,
      autoSubtitles:     true,
      mp4Access:         false,
    },
    topVideos: [
      { asset_id: 'a1b2c3', title: 'Introduction to Next.js 15', duration: '14:31', views: 2140, status: 'ready', created_at: '2025-03-01T08:00:00Z', thumbnail_url: '' },
      { asset_id: 'd4e5f6', title: 'Supabase Auth Deep Dive',    duration: '22:15', views: 1890, status: 'ready', created_at: '2025-03-08T09:00:00Z', thumbnail_url: '' },
      { asset_id: 'g7h8i9', title: 'Paystack Integration Guide', duration: '18:44', views: 1650, status: 'ready', created_at: '2025-03-15T10:00:00Z', thumbnail_url: '' },
      { asset_id: 'j0k1l2', title: 'TypeScript Generics Explained', duration: '11:22', views: 1420, status: 'ready', created_at: '2025-03-22T11:00:00Z', thumbnail_url: '' },
      { asset_id: 'm3n4o5', title: 'TailwindCSS 4 — What is New', duration: '9:05',  views: 1200, status: 'ready', created_at: '2025-04-01T12:00:00Z', thumbnail_url: '' },
    ],
  },
  {
    id:          'gum-acc-002',
    name:        'TITECX Backup',
    apiKey:      'gml_****...****7c2b',
    workspaceId: '5fc8896de748b130f2f73fef',
    addedAt:     '2025-02-20T14:30:00Z',
    stats: {
      totalVideos:     19,
      totalViews:      4_210,
      bandwidthGb:     31.8,
      storageGb:       9.1,
      transcodingMins: 145,
    },
    dailyMetrics: mockMetrics(160, 1.1, 11),
    settings: {
      resolutions:       ['360p', '720p'],
      watermarkUrl:      '',
      watermarkPosition: 'bottom-right',
      watermarkWidth:    8,
      watermarkHeight:   8,
      autoSubtitles:     false,
      mp4Access:         true,
    },
    topVideos: [
      { asset_id: 'p6q7r8', title: 'React Server Components',  duration: '16:50', views: 980,  status: 'ready', created_at: '2025-03-05T08:00:00Z', thumbnail_url: '' },
      { asset_id: 's9t0u1', title: 'Prisma ORM Masterclass',   duration: '28:10', views: 810,  status: 'ready', created_at: '2025-03-12T09:00:00Z', thumbnail_url: '' },
      { asset_id: 'v2w3x4', title: 'Docker for JS Developers', duration: '19:33', views: 670,  status: 'processing', created_at: '2025-04-10T10:00:00Z', thumbnail_url: '' },
    ],
  },
];

// ── Default settings used when adding a new account ──────────────────────────

export const DEFAULT_GUMLET_SETTINGS: GumletAccountSettings = {
  resolutions:       ['360p', '720p', '1080p'],
  watermarkUrl:      '',
  watermarkPosition: 'top-right',
  watermarkWidth:    10,
  watermarkHeight:   10,
  autoSubtitles:     false,
  mp4Access:         false,
};
