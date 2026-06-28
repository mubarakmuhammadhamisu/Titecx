'use client';

import React, { useCallback } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { VideoContent, VideoProvider } from '@/lib/Course';
import GlowCard from '@/components/AppShell/GlowCard';
import YoutubePlayer from '@/components/CoursePlayer/players/YoutubePlayer';
import GumletPlayer  from '@/components/CoursePlayer/players/GumletPlayer';
import BunnyPlayer   from '@/components/CoursePlayer/players/BunnyPlayer';
import GoogleDrivePlayer from '@/components/CoursePlayer/players/GoogleDrivePlayer';

// ── Props — identical to the original; no call-site changes needed ─────────────

interface VideoPlayerProps {
  content:     VideoContent;
  title:       string;
  isCompleted: boolean;
  onVideoEnd:  () => void;
}

// ── Empty-video placeholder ───────────────────────────────────────────────────

function VideoPlaceholder({ title, isCompleted }: { title: string; isCompleted: boolean }) {
  return (
    <GlowCard className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white leading-snug">{title}</h2>
        {isCompleted && (
          <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full whitespace-nowrap">
            <CheckCircle2 size={14} /> Completed
          </span>
        )}
      </div>
      <div
        className="relative w-full rounded-xl overflow-hidden border border-indigo-500/20 bg-gray-800 flex items-center justify-center"
        style={{ aspectRatio: '16/9' }}
      >
        <div className="text-center space-y-2 px-6">
          <div className="w-12 h-12 rounded-full bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center mx-auto">
            <svg viewBox="0 0 24 24" className="w-6 h-6 text-indigo-400 fill-current ml-0.5">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <p className="text-white font-semibold text-sm">Video coming soon</p>
          <p className="text-gray-400 text-xs">This lesson&apos;s video is being prepared.</p>
        </div>
      </div>
    </GlowCard>
  );
}

// ── Main router ───────────────────────────────────────────────────────────────

/**
 * VideoPlayer — routes to the correct sub-player based on content.videoProvider.
 *
 * | videoProvider | Player used         | onVideoEnd trigger         |
 * |---------------|---------------------|----------------------------|
 * | 'youtube'     | YoutubePlayer       | YT IFrame API (state = 0)  |
 * | 'gumlet'      | GumletPlayer        | postMessage "video:ended"  |
 * | 'bunny'       | BunnyPlayer         | postMessage "ended"        |
 * | 'gdrive'      | GoogleDrivePlayer   | Manual "Mark Complete" btn |
 * | (absent)      | YoutubePlayer       | Same as 'youtube'          |
 */
export default function VideoPlayer({
  content,
  title,
  isCompleted,
  onVideoEnd,
}: VideoPlayerProps) {
  // ── Guard: no video URL yet ───────────────────────────────────────────────
  if (!content.videoUrl || content.videoUrl.trim() === '') {
    return <VideoPlaceholder title={title} isCompleted={isCompleted} />;
  }

  // ── Derive provider — default to 'youtube' for legacy rows ───────────────
  const provider: VideoProvider = content.videoProvider ?? 'youtube';

  return (
    <VideoPlayerShell
      content={content}
      title={title}
      isCompleted={isCompleted}
      onVideoEnd={onVideoEnd}
      provider={provider}
    />
  );
}

// ── Shell — separated so hooks run unconditionally ────────────────────────────

interface ShellProps extends VideoPlayerProps {
  provider: VideoProvider;
}

function VideoPlayerShell({
  content,
  title,
  isCompleted,
  onVideoEnd,
  provider,
}: ShellProps) {
  const handleEnd = useCallback(() => {
    onVideoEnd();
  }, [onVideoEnd]);

  // Google Drive renders its own aspect-ratio container + completion button,
  // so it gets a slightly different shell (no fixed 16/9 slot wrapper).
  if (provider === 'gdrive') {
    return (
      <GlowCard className="space-y-4">
        <TitleRow title={title} isCompleted={isCompleted} />
        <GoogleDrivePlayer
          videoUrl={content.videoUrl}
          title={title}
          onEnd={handleEnd}
          isCompleted={isCompleted}
        />
        <MetaRow content={content} isCompleted={isCompleted} hideHint />
        <TopicsGrid topics={content.topics} />
      </GlowCard>
    );
  }

  // All other providers share the same 16/9 slot shell.
  return (
    <GlowCard className="space-y-4">
      <TitleRow title={title} isCompleted={isCompleted} />

      {/* 16/9 video slot */}
      <div
        className="relative w-full rounded-xl overflow-hidden border border-indigo-500/20 bg-black"
        style={{ aspectRatio: '16/9' }}
      >
        {provider === 'youtube' && (
          <YoutubePlayer videoUrl={content.videoUrl} title={title} onEnd={handleEnd} />
        )}
        {provider === 'gumlet' && (
          <GumletPlayer videoUrl={content.videoUrl} title={title} onEnd={handleEnd} />
        )}
        {provider === 'bunny' && (
          <BunnyPlayer videoUrl={content.videoUrl} title={title} onEnd={handleEnd} />
        )}
      </div>

      <MetaRow content={content} isCompleted={isCompleted} />
      <TopicsGrid topics={content.topics} />
    </GlowCard>
  );
}

// ── Shared sub-components ─────────────────────────────────────────────────────

function TitleRow({ title, isCompleted }: { title: string; isCompleted: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-xl font-bold text-white leading-snug">{title}</h2>
      {isCompleted && (
        <span className="flex items-center gap-1.5 text-emerald-400 text-sm font-medium bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 rounded-full whitespace-nowrap">
          <CheckCircle2 size={14} /> Completed
        </span>
      )}
    </div>
  );
}

function MetaRow({ content, isCompleted, hideHint = false }: { content: VideoContent; isCompleted: boolean; hideHint?: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm text-gray-400">
      <span>Duration: {content.duration}</span>
      {!isCompleted && !hideHint && (
        <span className="text-xs text-indigo-400 hidden sm:block">
          Watch to the end to mark complete
        </span>
      )}
    </div>
  );
}

function TopicsGrid({ topics }: { topics?: string[] }) {
  if (!topics || topics.length === 0) return null;

  return (
    <div className="space-y-3 pt-2 border-t border-indigo-500/10">
      <h3 className="text-sm font-semibold text-white">Topics Covered</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {topics.map((topic, idx) => (
          <div
            key={idx}
            className="flex items-center gap-3 p-3 bg-indigo-500/10 border border-indigo-500/20 rounded-lg"
          >
            <div className="w-2 h-2 rounded-full bg-indigo-400 shrink-0" />
            <span className="text-gray-100 text-sm">{topic}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
