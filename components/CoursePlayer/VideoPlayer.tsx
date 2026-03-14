'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { VideoContent } from '@/lib/Course';
import GlowCard from '@/components/AppShell/GlowCard';
import { CheckCircle2, Maximize2, X } from 'lucide-react';

interface VideoPlayerProps {
  content: VideoContent;
  title: string;
  isCompleted: boolean;
  onVideoEnd: () => void;
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
            onReady?: (e: unknown) => void;
          };
        }
      ) => YTPlayerInstance;
      PlayerState: { ENDED: number };
    };
    onYouTubeIframeAPIReady: () => void;
  }
}

// Singleton YT API loader — only loads once regardless of how many players render
let _ytLoading = false;
let _ytReady = false;
const _ytCallbacks: Array<() => void> = [];

function loadYTApi(cb: () => void): void {
  if (_ytReady) { cb(); return; }
  _ytCallbacks.push(cb);
  if (_ytLoading) return;
  _ytLoading = true;
  const tag = document.createElement('script');
  tag.src = 'https://www.youtube.com/iframe_api';
  document.head.appendChild(tag);
  window.onYouTubeIframeAPIReady = () => {
    _ytReady = true;
    _ytCallbacks.forEach((fn) => fn());
    _ytCallbacks.length = 0;
  };
}

function buildEmbedUrl(raw: string): string {
  const base =
    typeof window !== 'undefined'
      ? `?enablejsapi=1&origin=${encodeURIComponent(window.location.origin)}&rel=0&modestbranding=1`
      : '?enablejsapi=1&rel=0&modestbranding=1';
  try {
    const u = new URL(raw);
    if (u.pathname.startsWith('/embed/')) return `${u.origin}${u.pathname}${base}`;
    const v = u.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${v}${base}`;
    if (u.hostname === 'youtu.be') return `https://www.youtube.com/embed/${u.pathname.slice(1)}${base}`;
  } catch { /* not a valid URL, fall through */ }
  // strip existing query, add ours
  return `${raw.split('?')[0]}${base}`;
}

// Stable unique id hook
function useId(prefix: string): string {
  const ref = useRef<string | null>(null);
  if (ref.current === null) {
    ref.current = `${prefix}_${Math.random().toString(36).slice(2, 9)}`;
  }
  return ref.current;
}

interface EmbedProps {
  embedUrl: string;
  title: string;
  iframeId: string;
  onEnd: () => void;
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
            // 0 = ENDED
            if (e.data === 0) onEnd();
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

export default function VideoPlayer({ content, title, isCompleted, onVideoEnd }: VideoPlayerProps) {
  const [modalOpen, setModalOpen] = useState(false);
  const iframeId = useId('yt');
  const modalIframeId = useId('yt_modal');
  const embedUrl = buildEmbedUrl(content.videoUrl);

  const handleEnd = useCallback(() => {
    onVideoEnd();
    setModalOpen(false);
  }, [onVideoEnd]);

  // Close modal on Escape
  useEffect(() => {
    if (!modalOpen) return;
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') setModalOpen(false); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [modalOpen]);

  // Prevent body scroll when modal open
  useEffect(() => {
    document.body.style.overflow = modalOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [modalOpen]);

  return (
    <>
      {/* ── Fullscreen modal (mobile tap) ── */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 bg-black flex items-center justify-center"
          onClick={() => setModalOpen(false)}
        >
          {/* Close button */}
          <button
            onClick={() => setModalOpen(false)}
            className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition"
            aria-label="Close video"
          >
            <X size={20} />
          </button>

          {/* Landscape-optimised video — stops click propagation so tapping video doesn't close */}
          <div
            className="w-full max-h-screen"
            style={{ aspectRatio: '16/9', maxWidth: 'min(100vw, 177.78vh)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <YoutubeEmbed
              embedUrl={embedUrl}
              title={title}
              iframeId={modalIframeId}
              onEnd={handleEnd}
            />
          </div>
        </div>
      )}

      {/* ── Inline card ── */}
      <GlowCard className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold text-white leading-snug">{title}</h2>
          {isCompleted && (
            <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full whitespace-nowrap">
              <CheckCircle2 size={14} /> Completed
            </span>
          )}
        </div>

        {/* Video wrapper */}
        <div className="relative w-full rounded-xl overflow-hidden border border-indigo-500/20 bg-black"
          style={{ aspectRatio: '16/9' }}>

          {/* Desktop: inline player */}
          <div className="absolute inset-0 hidden sm:block">
            <YoutubeEmbed
              embedUrl={embedUrl}
              title={title}
              iframeId={iframeId}
              onEnd={handleEnd}
            />
          </div>

          {/* Mobile: tap-to-expand overlay */}
          <div className="absolute inset-0 sm:hidden">
            {/* Thumbnail preview via YouTube */}
            <img
              src={`https://img.youtube.com/vi/${extractVideoId(content.videoUrl)}/hqdefault.jpg`}
              alt={title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center flex-col gap-3">
              <button
                onClick={() => setModalOpen(true)}
                className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm border-2 border-white/60 flex items-center justify-center hover:bg-white/30 transition active:scale-95"
                aria-label="Play video"
              >
                <svg viewBox="0 0 24 24" className="w-7 h-7 text-white fill-current ml-1">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </button>
              <span className="text-white/80 text-xs flex items-center gap-1.5">
                <Maximize2 size={12} /> Tap to play fullscreen
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-400">
          <span>Duration: {content.duration}</span>
          {!isCompleted && (
            <span className="text-xs text-indigo-400 hidden sm:block">Watch to the end to mark complete</span>
          )}
        </div>

        {content.topics && content.topics.length > 0 && (
          <div className="space-y-3 pt-2 border-t border-indigo-500/10">
            <h3 className="text-sm font-semibold text-white">Topics Covered</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {content.topics.map((topic, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg">
                  <div className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
                  <span className="text-gray-100 text-sm">{topic}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </GlowCard>
    </>
  );
}

function extractVideoId(url: string): string {
  try {
    const u = new URL(url);
    if (u.hostname === 'youtu.be') return u.pathname.slice(1);
    const v = u.searchParams.get('v');
    if (v) return v;
    const embedMatch = u.pathname.match(/\/embed\/([^/?]+)/);
    if (embedMatch) return embedMatch[1];
  } catch { /* ignore */ }
  return '';
}
