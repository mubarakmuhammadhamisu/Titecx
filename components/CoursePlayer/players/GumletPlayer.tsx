'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface GumletPlayerProps {
  /**
   * Gumlet video/asset ID, e.g. "64a1b2c3d4e5f6a7b8c9d0e1"
   * Paste only the ID — not the full URL.
   */
  videoUrl: string;
  title:    string;
  onEnd:    () => void;
}

// ── Helper ────────────────────────────────────────────────────────────────────

/** Strips full Gumlet URLs down to just the asset ID. */
function extractGumletId(raw: string): string {
  try {
    const u = new URL(raw);
    // https://play.gumlet.io/embed/{id}  →  grab last path segment
    const parts = u.pathname.split('/').filter(Boolean);
    return parts[parts.length - 1] ?? raw.trim();
  } catch {
    return raw.trim();
  }
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

interface GumletEmbedProps {
  assetId:   string;
  title:     string;
  iframeId:  string;
  onEnd:     () => void;
  className?: string;
}

function GumletEmbed({ assetId, title, iframeId, onEnd, className = '' }: GumletEmbedProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Gumlet sends postMessage events from its player iframe.
  // Docs: https://docs.gumlet.com/reference/video-player-api
  useEffect(() => {
    const handler = (event: MessageEvent) => {
      // Only accept messages from Gumlet's domain
      if (!event.origin.includes('gumlet.io')) return;

      try {
        const data: unknown =
          typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

        if (
          data !== null &&
          typeof data === 'object' &&
          'type' in data &&
          (data as Record<string, unknown>).type === 'gumlet:video:ended'
        ) {
          // Confirm the message came from our specific iframe
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

  const src = `https://play.gumlet.io/embed/${assetId}`;

  return (
    <iframe
      ref={iframeRef}
      id={iframeId}
      src={src}
      title={title}
      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; fullscreen"
      allowFullScreen
      className={`w-full h-full border-0 ${className}`}
    />
  );
}

// ── Public component ──────────────────────────────────────────────────────────

/**
 * Renders a Gumlet video with:
 *  - Inline player on desktop (sm+)
 *  - Tap-to-fullscreen modal on mobile
 *  - Auto-fires onEnd via postMessage when video finishes
 */
export default function GumletPlayer({ videoUrl, title, onEnd }: GumletPlayerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const iframeId      = useUniqueId('gumlet');
  const modalIframeId = useUniqueId('gumlet_modal');

  const assetId = extractGumletId(videoUrl);

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
            <GumletEmbed assetId={assetId} title={title} iframeId={modalIframeId} onEnd={handleEnd} />
          </div>
        </div>
      )}

      {/* ── Video slot content ── */}
      {/* Desktop: inline player */}
      <div className="absolute inset-0 hidden sm:block">
        <GumletEmbed assetId={assetId} title={title} iframeId={iframeId} onEnd={handleEnd} />
      </div>

      {/* Mobile: generic thumbnail + tap-to-expand */}
      <div className="absolute inset-0 sm:hidden">
        {/* Generic gradient placeholder — Gumlet doesn't expose a public thumbnail URL */}
        <div className="w-full h-full bg-gradient-to-br from-indigo-900/60 to-gray-900" />
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
