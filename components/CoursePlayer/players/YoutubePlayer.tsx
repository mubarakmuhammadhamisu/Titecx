'use client';

import React, { useEffect, useRef } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface YoutubePlayerProps {
  videoUrl: string;
  title:    string;
  onEnd:    () => void;
}

// The instance returned by `new window.YT.Player(...)`
interface YTPlayerInstance {
  destroy(): void;
}

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement | string,
        opts: {
          events: {
            onStateChange?: (e: { data: number }) => void;
            onReady?:       (e: unknown) => void;
          };
        },
      ) => YTPlayerInstance;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

// ── YT API singleton loader ───────────────────────────────────────────────────
// Only injects the script once regardless of how many players are mounted.

let _ytLoading = false;
let _ytReady   = false;
const _ytCallbacks: Array<() => void> = [];

function loadYTApi(cb: () => void): void {
  if (_ytReady)  { cb(); return; }
  _ytCallbacks.push(cb);
  if (_ytLoading) return;
  _ytLoading = true;
  const tag  = document.createElement('script');
  tag.src    = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  window.onYouTubeIframeAPIReady = () => {
    _ytReady = true;
    _ytCallbacks.forEach((fn) => fn());
    _ytCallbacks.length = 0;
  };
}

// ── URL helpers ───────────────────────────────────────────────────────────────

function buildEmbedUrl(raw: string): string {
  const qs =
    typeof window !== 'undefined'
      ? `?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1`
      : '?enablejsapi=1&rel=0&modestbranding=1';

  try {
    const u = new URL(raw);
    if (u.pathname.startsWith('/embed/')) return `${u.origin}${u.pathname}${qs}`;
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${v}${qs}`;
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}${qs}`;
  } catch { /* not a valid URL, fall through */ }

  return `${raw.split('?')[0]}${qs}`;
}

export function extractYoutubeVideoId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    const v = u.searchParams.get('v');
    if (v) return v;
    const m = u.pathname.match(/\/embed\/([^/?]+)/);
    if (m) return m[1];
  } catch { /* ignore */ }
  return '';
}

// ── Stable unique id hook ─────────────────────────────────────────────────────

function useUniqueId(prefix: string): string {
  const ref = useRef<string | null>(null);
  if (ref.current === null) {
    ref.current = `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }
  return ref.current;
}

// ── Inner embed (reused for inline + modal) ───────────────────────────────────

interface EmbedProps {
  embedUrl:  string;
  title:     string;
  iframeId:  string;
  onEnd:     () => void;
  className?: string;
}

function YoutubeEmbed({ embedUrl, title, iframeId, onEnd, className = '' }: EmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const playerRef = useRef<YTPlayerInstance | null>(null);

  useEffect(() => {
    loadYTApi(() => {
      if (!iframeRef.current) return;
      playerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onStateChange: (e) => {
            if (e.data === 0) onEnd(); // 0 = ENDED
          },
        },
      });
    });

    return () => {
      try { playerRef.current?.destroy(); } catch { /* ignore */ }
      playerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [embedUrl]);

  return (
    <iframe
      ref={iframeRef}
      id={iframeId}
      src={embedUrl}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      className={`w-full h-full border-0 ${className}`}
    />
  );
}

// ── Public component ──────────────────────────────────────────────────────────

/**
 * Renders a YouTube video with:
 *  - Inline player on desktop (sm+)
 *  - Tap-to-fullscreen modal on mobile
 *  - Auto-fires onEnd when video finishes
 */
export default function YoutubePlayer({ videoUrl, title, onEnd }: YoutubePlayerProps) {
  const [modalOpen, setModalOpen] = React.useState(false);
  const iframeId       = useUniqueId('yt');
  const modalIframeId  = useUniqueId('yt_modal');

  const embedUrl = buildEmbedUrl(videoUrl);
  const thumbId  = extractYoutubeVideoId(videoUrl);

  const handleEnd = React.useCallback(() => {
    onEnd();
    setModalOpen(false);
  }, [onEnd]);

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  // Prevent body scroll when modal is open
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  return (
    <>
      {/* ── Fullscreen modal (mobile) ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setModalOpen(false)}
        >
          <button
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="Close video"
          >
            <svg viewBox="0 0 24 24" className="w-5 h-5 fill-none stroke-current stroke-2">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
          <div
            className="w-full max-h-screen"
            style={{ aspectRatio: '16/9', maxWidth: 'min(100vw, 177.78vh)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <YoutubeEmbed embedUrl={embedUrl} title={title} iframeId={modalIframeId} onEnd={handleEnd} />
          </div>
        </div>
      )}

      {/* ── Video slot content ── */}
      {/* Desktop: inline player */}
      <div className="absolute inset-0 hidden sm:block">
        <YoutubeEmbed embedUrl={embedUrl} title={title} iframeId={iframeId} onEnd={handleEnd} />
      </div>

      {/* Mobile: thumbnail + tap-to-expand */}
      <div className="absolute inset-0 sm:hidden">
        {thumbId && (
          <img
            src={`https://img.youtube.com/vi/${thumbId}/hqdefault.jpg`}
            alt={title}
            className="w-full h-full object-cover"
          />
        )}
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center flex-col gap-3">
          <button
            onClick={() => setModalOpen(true)}
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center hover:bg-white/30 transition active:scale-95"
            aria-label="Play video"
          >
            <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current ml-1">
              <path d="M8 5v14l11-7z" />
            </svg>
          </button>
          <span className="text-white/80 text-xs flex items-center gap-1.5">
            <svg viewBox="0 0 24 24" className="w-3 h-3 fill-none stroke-current stroke-2">
              <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
            </svg>
            Tap to play fullscreen
          </span>
        </div>
      </div>
    </>
  );
}
