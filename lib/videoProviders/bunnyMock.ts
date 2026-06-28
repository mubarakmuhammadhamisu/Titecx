/**
 * Bunny Stream mock data — mirrors the real API response shapes exactly.
 *
 * ─── TO GO LIVE ────────────────────────────────────────────────────────────
 *
 * 1.  Store libraries in Supabase:
 *       create table bunny_libraries (
 *         id          uuid primary key default gen_random_uuid(),
 *         name        text not null,
 *         library_id  text not null,
 *         api_key     text not null,   -- encrypt at rest
 *         created_at  timestamptz default now()
 *       );
 *
 * 2.  Replace each mock function below with these real fetch calls:
 *
 *     Library statistics (views, watchtime, countries, engagement):
 *       GET https://video.bunnycdn.com/library/{libraryId}/statistics
 *         ?dateFrom=YYYY-MM-DD&dateTo=YYYY-MM-DD
 *       AccessKey: {apiKey}
 *       → { viewsChart: Record<string,number>, watchTimeChart: Record<string,number>,
 *           countryViewCounts: Record<string,number>,
 *           countryWatchTime: Record<string,number>,
 *           engagementScore: number }
 *
 *     List videos:
 *       GET https://video.bunnycdn.com/library/{libraryId}/videos
 *         ?page=1&itemsPerPage=100&orderBy=date
 *       AccessKey: {apiKey}
 *       → { items: BunnyVideo[], totalItems, currentPage, itemsPerPage }
 *
 *     List collections:
 *       GET https://video.bunnycdn.com/library/{libraryId}/collections
 *       AccessKey: {apiKey}
 *       → { items: BunnyCollection[], totalItems }
 *
 *     Upload from URL:
 *       POST https://video.bunnycdn.com/library/{libraryId}/videos
 *       AccessKey: {apiKey}
 *       Body: { title: string, collectionId?: string }
 *       → { videoId: string, ... }
 *       Then: POST https://video.bunnycdn.com/library/{libraryId}/videos/fetch
 *       Body: { url: string }
 *
 *     Update library settings (player color, resolutions, token auth, etc.):
 *       POST https://api.bunny.net/videolibrary/{libraryId}
 *       AccessKey: {BUNNY_ACCOUNT_API_KEY}   ← account-level key, not stream key
 *       Body: {
 *         PlayerKeyColor, EnableTokenAuthentication,
 *         WatermarkPositionLeft, WatermarkPositionTop,
 *         WatermarkWidth, WatermarkHeight,
 *         EnabledResolutions, CustomHTML
 *       }
 *
 *     Note: Bunny has two API keys:
 *       - Stream API key  (per-library) → video.bunnycdn.com  → upload/manage videos
 *       - Account API key (global)      → api.bunny.net       → library settings
 * ────────────────────────────────────────────────────────────────────────────
 */

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BunnyDayMetric {
  date:             string; // "Apr 5"
  views:            number;
  watchTimeMinutes: number;
}

export interface BunnyVideo {
  videoId:      string;
  title:        string;
  status:       'finished' | 'processing' | 'failed' | 'queued';
  views:        number;
  storageSize:  number; // bytes
  dateUploaded: string; // ISO date string
  length:       number; // seconds
}

export interface BunnyCountryStat {
  country:          string;
  code:             string; // ISO 2-letter
  views:            number;
  watchTimeMinutes: number;
}

export interface BunnyCollection {
  collectionId: string;
  name:         string;
  videoCount:   number;
}

export interface BunnyLibrarySettings {
  playerKeyColor:           string;  // hex, e.g. "#6366f1"
  enableTokenAuthentication: boolean;
  watermarkPositionLeft:    number;  // 0–100 %
  watermarkPositionTop:     number;  // 0–100 %
  watermarkWidth:           number;  // 0–100 %
  watermarkHeight:          number;  // 0–100 %
  enabledResolutions:       string;  // "240p,360p,480p,720p,1080p"
  customHTML:               string;
  watchTimeHeatmapEnabled:  boolean;
}

export interface BunnyLibraryStats {
  totalVideos:           number;
  totalViews:            number;
  totalWatchTimeMinutes: number;
  engagementScore:       number; // 0–100
  storageSizeGb:         number;
}

export interface BunnyLibrary {
  id:          string; // internal UUID for our app
  name:        string; // friendly label
  libraryId:   string; // Bunny numeric library ID
  apiKey:      string; // masked: "****...****"
  addedAt:     string;
  stats:       BunnyLibraryStats;
  dailyMetrics: BunnyDayMetric[];
  countryStats: BunnyCountryStat[];
  videos:      BunnyVideo[];
  collections: BunnyCollection[];
  settings:    BunnyLibrarySettings;
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
  baseWatch: number,
  seed: number,
): BunnyDayMetric[] {
  return DATES.map((date, i) => {
    const v = 0.55 + ((seed * 9 + i * 13) % 45) / 100;
    return {
      date,
      views:            Math.round(baseViews * v),
      watchTimeMinutes: Math.round(baseWatch * v),
    };
  });
}

// ── Mock libraries ────────────────────────────────────────────────────────────

export const INITIAL_BUNNY_LIBRARIES: BunnyLibrary[] = [
  {
    id:        'bun-lib-001',
    name:      'TITECX Main Library',
    libraryId: '234567',
    apiKey:    '****...****a1b2',
    addedAt:   '2025-01-15T10:00:00Z',
    stats: {
      totalVideos:           61,
      totalViews:            18_920,
      totalWatchTimeMinutes: 142_400,
      engagementScore:       74,
      storageSizeGb:         38.5,
    },
    dailyMetrics: mockMetrics(680, 5_120, 5),
    countryStats: [
      { country: 'Nigeria',        code: 'NG', views: 8_400, watchTimeMinutes: 62_400 },
      { country: 'United States',  code: 'US', views: 3_200, watchTimeMinutes: 24_100 },
      { country: 'United Kingdom', code: 'GB', views: 2_100, watchTimeMinutes: 15_800 },
      { country: 'Ghana',          code: 'GH', views: 1_850, watchTimeMinutes: 14_000 },
      { country: 'Kenya',          code: 'KE', views: 1_420, watchTimeMinutes: 10_700 },
      { country: 'Canada',         code: 'CA', views:   980, watchTimeMinutes:  7_380 },
    ],
    videos: [
      { videoId: 'bv-001', title: 'Next.js 15 App Router Deep Dive', status: 'finished',   views: 3_210, storageSize: 524_288_000, dateUploaded: '2025-03-01T08:00:00Z', length: 872 },
      { videoId: 'bv-002', title: 'Supabase RLS Masterclass',        status: 'finished',   views: 2_840, storageSize: 419_430_400, dateUploaded: '2025-03-08T09:00:00Z', length: 1335 },
      { videoId: 'bv-003', title: 'TypeScript for React Devs',       status: 'finished',   views: 2_480, storageSize: 367_001_600, dateUploaded: '2025-03-15T10:00:00Z', length: 682 },
      { videoId: 'bv-004', title: 'Building a Paystack Integration',  status: 'finished',   views: 2_100, storageSize: 471_859_200, dateUploaded: '2025-03-22T11:00:00Z', length: 1124 },
      { videoId: 'bv-005', title: 'TailwindCSS 4 — New Features',    status: 'processing', views:     0, storageSize:          0,   dateUploaded: '2025-04-28T12:00:00Z', length: 543 },
    ],
    collections: [
      { collectionId: 'col-001', name: 'Next.js Course',     videoCount: 24 },
      { collectionId: 'col-002', name: 'Supabase Bootcamp',  videoCount: 18 },
      { collectionId: 'col-003', name: 'TypeScript Series',  videoCount: 12 },
      { collectionId: 'col-004', name: 'Miscellaneous',      videoCount:  7 },
    ],
    settings: {
      playerKeyColor:           '#6366f1',
      enableTokenAuthentication: false,
      watermarkPositionLeft:    85,
      watermarkPositionTop:     5,
      watermarkWidth:           12,
      watermarkHeight:          12,
      enabledResolutions:       '360p,480p,720p,1080p',
      customHTML:               '',
      watchTimeHeatmapEnabled:  true,
    },
  },
  {
    id:        'bun-lib-002',
    name:      'TITECX Overflow',
    libraryId: '345678',
    apiKey:    '****...****c3d4',
    addedAt:   '2025-03-05T14:00:00Z',
    stats: {
      totalVideos:           14,
      totalViews:            3_740,
      totalWatchTimeMinutes: 28_050,
      engagementScore:       61,
      storageSizeGb:         8.2,
    },
    dailyMetrics: mockMetrics(140, 1_050, 13),
    countryStats: [
      { country: 'Nigeria',        code: 'NG', views: 1_800, watchTimeMinutes: 13_500 },
      { country: 'United States',  code: 'US', views:   820, watchTimeMinutes:  6_150 },
      { country: 'Ghana',          code: 'GH', views:   640, watchTimeMinutes:  4_800 },
      { country: 'South Africa',   code: 'ZA', views:   480, watchTimeMinutes:  3_600 },
    ],
    videos: [
      { videoId: 'bv-101', title: 'Docker for Node Developers', status: 'finished',   views: 1_240, storageSize: 262_144_000, dateUploaded: '2025-03-10T08:00:00Z', length: 1192 },
      { videoId: 'bv-102', title: 'CI/CD with GitHub Actions',  status: 'finished',   views:   980, storageSize: 209_715_200, dateUploaded: '2025-03-18T09:00:00Z', length: 874 },
      { videoId: 'bv-103', title: 'Redis Caching Strategies',   status: 'processing', views:     0, storageSize:           0, dateUploaded: '2025-04-29T10:00:00Z', length: 0   },
    ],
    collections: [
      { collectionId: 'col-101', name: 'DevOps Series',   videoCount: 8  },
      { collectionId: 'col-102', name: 'Backend Extras',  videoCount: 6  },
    ],
    settings: {
      playerKeyColor:           '#8b5cf6',
      enableTokenAuthentication: true,
      watermarkPositionLeft:    5,
      watermarkPositionTop:     5,
      watermarkWidth:           10,
      watermarkHeight:          10,
      enabledResolutions:       '360p,720p',
      customHTML:               '',
      watchTimeHeatmapEnabled:  false,
    },
  },
];

// ── Default settings for a newly added library ────────────────────────────────

export const DEFAULT_BUNNY_SETTINGS: BunnyLibrarySettings = {
  playerKeyColor:           '#6366f1',
  enableTokenAuthentication: false,
  watermarkPositionLeft:    85,
  watermarkPositionTop:     5,
  watermarkWidth:           10,
  watermarkHeight:          10,
  enabledResolutions:       '360p,720p,1080p',
  customHTML:               '',
  watchTimeHeatmapEnabled:  false,
};
