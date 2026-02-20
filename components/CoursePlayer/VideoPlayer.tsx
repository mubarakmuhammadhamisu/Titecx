'use client';

import React from 'react';
import { VideoContent } from '@/lib/Course';
import GlowCard from '@/components/AppShell/GlowCard';

interface VideoPlayerProps {
  content: VideoContent;
  title: string;
}

export default function VideoPlayer({ content, title }: VideoPlayerProps) {
  return (
    <GlowCard className="space-y-6">
      {/* Video Container */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">{title}</h2>
        <div className="relative w-full aspect-video bg-gray-900 rounded-lg overflow-hidden border border-indigo-500/20">
          <iframe
            src={content.videoUrl}
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
