'use client';

import React from 'react';
import { ReadingContent } from '@/lib/Course';
import GlowCard from '@/components/AppShell/GlowCard';

interface ReaderProps {
  content: ReadingContent;
  title: string;
}

export default function Reader({ content, title }: ReaderProps) {
  // Simple markdown to HTML converter
  const parseMarkdown = (md: string) => {
    return md
      .split('\n')
      .map((line, idx) => {
        // Headers
        if (line.startsWith('# ')) {
          return (
            <h1 key={idx} className="text-3xl font-bold text-white mt-6 mb-4">
              {line.replace('# ', '')}
            </h1>
          );
        }
        if (line.startsWith('## ')) {
          return (
            <h2 key={idx} className="text-2xl font-bold text-white mt-5 mb-3">
              {line.replace('## ', '')}
            </h2>
          );
        }
        if (line.startsWith('### ')) {
          return (
            <h3 key={idx} className="text-xl font-bold text-white mt-4 mb-2">
              {line.replace('### ', '')}
            </h3>
          );
        }
        // Code blocks
        if (line.startsWith('```')) {
          return null;
        }
        // Bold text
        if (line.includes('**')) {
          const parts = line.split(/\*\*([^*]+)\*\*/g);
          return (
            <p key={idx} className="text-gray-200 leading-relaxed mb-3">
              {parts.map((part, i) => (
                i % 2 === 1 ? (
                  <strong key={i} className="font-semibold text-white">
                    {part}
                  </strong>
                ) : (
                  part
                )
              ))}
            </p>
          );
        }
        // Regular paragraphs
        if (line.trim()) {
          return (
            <p key={idx} className="text-gray-200 leading-relaxed mb-3">
              {line}
            </p>
          );
        }
        return <div key={idx} className="mb-2" />;
      });
  };

  return (
    <GlowCard className="space-y-6">
      {/* Title */}
      <div className="space-y-2 pb-6 border-b border-indigo-500/20">
        <h2 className="text-3xl font-bold text-white">{title}</h2>
        <p className="text-gray-400 text-sm">Reading Material</p>
      </div>

      {/* Content */}
      <div className="prose prose-invert max-w-none space-y-4">
        {parseMarkdown(content.markdownBody)}
      </div>

      {/* Topics Section */}
      {content.topics && content.topics.length > 0 && (
        <div className="space-y-3 mt-8 pt-6 border-t border-indigo-500/20">
          <h3 className="text-lg font-semibold text-white">Key Topics</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {content.topics.map((topic, idx) => (
              <div
                key={idx}
                className="flex items-center gap-3 p-3 bg-purple-500/10 border border-purple-500/20 rounded-lg hover:bg-purple-500/20 transition"
              >
                <div className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-gray-100 text-sm">{topic}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </GlowCard>
  );
}
