'use client';

import React from 'react';
import { VideoContent } from '@/lib/Course';
import GlowCard from '@/components/AppShell/GlowCard';

interface VideoPlayerProps {
  content: VideoContent;
  title: string;
}

/**
 * Sanitises any YouTube URL format into an embed URL with params that
 * suppress recommendations, branding, and annotations — keeping learners
 * inside Learnify instead of being pulled away by YouTube's algorithm.
 *
 *  rel=0            → no related videos from other channels at the end
 *  modestbranding=1 → hides the YouTube logo in the control bar
 *  iv_load_policy=3 → disables pop-up video annotations
 */
function buildEmbedUrl(raw: string): string {
  try {
    const url = new URL(raw);
    // Already an embed URL — just add params
    if (url.pathname.startsWith('/embed/')) {
      url.searchParams.set('rel', '0');
      url.searchParams.set('modestbranding', '1');
      url.searchParams.set('iv_load_policy', '3');
      return url.toString();
    }
    // Standard watch URL: youtube.com/watch?v=ID
    const v = url.searchParams.get('v');
    if (v) return `https://www.youtube.com/embed/${v}?rel=0&modestbranding=1&iv_load_policy=3`;
    // Short URL: youtu.be/ID
    if (url.hostname === 'youtu.be') {
      return `https://www.youtube.com/embed/${url.pathname.slice(1)}?rel=0&modestbranding=1&iv_load_policy=3`;
    }
  } catch { /* not a parseable URL — fall through */ }
  // Fallback: append params to whatever string was passed
  const sep = raw.includes('?') ? '&' : '?';
  return `${raw}${sep}rel=0&modestbranding=1&iv_load_policy=3`;
}

export default function VideoPlayer({ content, title }: VideoPlayerProps) {
  const embedUrl = buildEmbedUrl(content.videoUrl);

  return (
    <GlowCard className="space-y-6">
      {/* Video Container */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-indigo-500/20">
          <iframe
            src={embedUrl}
            title={title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="w-full h-full"
          />
        </div>
        <p className="text-sm text-gray-400">Duration: {content.duration}</p>
      </div>

      {/* Topics Section */}
      {content.topics && content.topics.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-white">Topics Covered</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {content.topics.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/20 transition"
              >
                <div className="w-2 h-2 rounded-full bg-indigo-400" />
                <span className="text-gray-100 text-sm">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlowCard>
  );
}
