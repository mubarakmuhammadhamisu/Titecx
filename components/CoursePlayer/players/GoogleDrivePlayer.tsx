'use client';

import React, { useRef } from 'react';
import { CheckCircle2 } from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GoogleDrivePlayerProps {
  /**
   * Google Drive file ID, e.g. "1BxiMVmTkclm5IlLd2zs_RheturHfaBDp"
   *
   * Also accepts the full share or preview URL — the ID is extracted automatically.
   * e.g. https://drive.google.com/file/d/{fileId}/view
   *      https://drive.google.com/file/d/{fileId}/preview
   */
  videoUrl:    string;
  title:       string;
  /**
   * Google Drive's player cannot emit a "video ended" event, so this callback
   * is wired to a manual "Mark as Complete" button below the player.
   */
  onEnd:       () => void;
  isCompleted: boolean;
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Extracts just the file ID from any Google Drive URL,
 * or returns the raw string if it looks like a bare ID already.
 */
function extractDriveFileId(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname === 'drive.google.com') {
      // /file/d/{fileId}/view  or  /file/d/{fileId}/preview
      const m = u.pathname.match(/\/file\/d\/([^/]+)/);
      if (m?.[1]) return m[1];
      // /open?id={fileId}
      const id = u.searchParams.get('id');
      if (id) return id;
    }
  } catch {
    // not a URL — assume it's a raw file ID
  }
  return raw.trim();
}

// ── Stable unique id hook ─────────────────────────────────────────────────────

function useUniqueId(prefix: string): string {
  const ref = useRef<string | null>(null);
  if (ref.current === null) {
    ref.current = `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }
  return ref.current;
}

// ── Public component ──────────────────────────────────────────────────────────

/**
 * Renders a Google Drive video.
 *
 * ⚠️  Google Drive's embed does NOT expose any "video ended" JavaScript event.
 * Completion is therefore triggered by a manual "Mark as Complete" button.
 *
 * The player renders inline on all screen sizes — no modal is used because
 * Google Drive's embed is already mobile-friendly and supports native fullscreen.
 */
export default function GoogleDrivePlayer({
  videoUrl,
  title,
  onEnd,
  isCompleted,
}: GoogleDrivePlayerProps) {
  const iframeId = useUniqueId('gdrive');
  const fileId   = extractDriveFileId(videoUrl);
  const src      = `https://drive.google.com/file/d/${fileId}/preview`;

  return (
    <div className="space-y-3">
      {/* Player — full width on all breakpoints */}
      <div className="relative w-full rounded-xl overflow-hidden" style={{ aspectRatio: '16/9' }}>
        <iframe
          id={iframeId}
          src={src}
          title={title}
          allow="autoplay; fullscreen"
          allowFullScreen
          className="absolute inset-0 w-full h-full border-0"
        />
      </div>

      {/* Manual completion row */}
      {!isCompleted ? (
        <div className="flex items-center justify-between px-1">
          <p className="text-xs text-gray-400">
            Finished watching? Mark this lesson complete.
          </p>
          <button
            onClick={onEnd}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition active:scale-95"
          >
            <CheckCircle2 size={14} />
            Mark Complete
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-1.5 px-1 text-emerald-400 text-xs font-medium">
          <CheckCircle2 size={14} />
          Lesson completed
        </div>
      )}
    </div>
  );
}
