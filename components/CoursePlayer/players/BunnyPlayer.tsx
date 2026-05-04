'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface BunnyPlayerProps {
  /**
   * Bunny Stream video reference.
   * Format:  "{libraryId}/{videoId}"
   * Example: "98765/abc1def2-3456-7890-abcd-ef1234567890"
   *
   * You can also paste the full Bunny embed URL — the ID will be extracted.
   */
  videoUrl: string;
  title:    string;
  onEnd:    () => void;
}

// ── Helper ────────────────────────────────────────────────────────────────────

/**
 * Normalises the videoUrl value to a "{libraryId}/{videoId}" string.
 * Accepts:
 *   - Plain "libraryId/videoId"
 *   - Full Bunny embed URL: https://iframe.mediadelivery.net/embed/{libraryId}/{videoId}
 */
function extractBunnyRef(raw: string): string {
  try {
    const u = new URL(raw);
    if (u.hostname.includes('mediadelivery.net')) {
      // pathname = /embed/{libraryId}/{videoId}
      const parts = u.pathname.split('/').filter(Boolean);
      // parts[0] = "embed", parts[1] = libraryId, parts[2] = videoId
      if (parts.length >= 3) return `${parts[1]}/${parts[2]}`;
    }
  } catch {
    // not a URL — treat as raw "{libraryId}/{videoId}"
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

// ── Inner embed ───────────────────────────────────────────────────────────────

interface BunnyEmbedProps {
  bunnyRef:  string; // "{libraryId}/{videoId}"
  title:     string;
  iframeId:  string;
  onEnd:     () => void;
  className?: string;
}

function BunnyEmbed({ bunnyRef, title, iframeId, onEnd, className = '' }: BunnyEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Bunny Stream player sends postMessage events.
  // Docs: https://docs.bunny.net/docs/stream-player-js-api
  // The player dispatches: { event: "play" | "pause" | "ended" | "timeupdate", ... }
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      if (!event.origin.includes('mediadelivery.net')) return;

      try {
        const data: unknown =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (
          data !== null &&
          typeof data === 'object' &&
          'event' in data &&
          (data as Record<string, unknown>).event === 'ended'
        ) {
          if (iframeRef.current && event.source === iframeRef.current.contentWindow) {
            onEnd();
          }
        }
      } catch {
        // ignore malformed messages
      }
    };

    window.addEventListener('message', handler);
    return () => window.removeEventListener('message', handler);
  }, [onEnd]);

  const src = `https://iframe.mediadelivery.net/embed/${bunnyRef}?autoplay=false&responsive=true`;

  return (
    <iframe
      ref={iframeRef}
      id={iframeId}
      src={src}
      title={title}
      loading="lazy"
      allow="accelerometer; gyroscope; autoplay; encrypted-media; picture-in-picture; fullscreen"
      allowFullScreen
      className={`w-full h-full border-0 ${className}`}
    />
  );
}

// ── Public component ──────────────────────────────────────────────────────────

/**
 * Renders a Bunny Stream video with:
 *  - Inline player on desktop (sm+)
 *  - Tap-to-fullscreen modal on mobile
 *  - Auto-fires onEnd via postMessage when video finishes
 */
export default function BunnyPlayer({ videoUrl, title, onEnd }: BunnyPlayerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const iframeId      = useUniqueId('bunny');
  const modalIframeId = useUniqueId('bunny_modal');

  const bunnyRef = extractBunnyRef(videoUrl);

  const handleEnd = useCallback(() => {
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
            <BunnyEmbed bunnyRef={bunnyRef} title={title} iframeId={modalIframeId} onEnd={handleEnd} />
          </div>
        </div>
      )}

      {/* ── Video slot content ── */}
      {/* Desktop: inline player */}
      <div className="absolute inset-0 hidden sm:block">
        <BunnyEmbed bunnyRef={bunnyRef} title={title} iframeId={iframeId} onEnd={handleEnd} />
      </div>

      {/* Mobile: generic placeholder + tap-to-expand */}
      <div className="absolute inset-0 sm:hidden">
        <div className="w-full h-full bg-gradient-to-br from-orange-900/60 to-gray-900" />
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center flex-col gap-3">
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
