'use client';

// ─────────────────────────────────────────────────────────────────────────────
// CopyLinkButton — client-side certificate share button.
//
// Shows the exact URL in a tooltip on hover so the user knows what
// they are about to copy. Falls back gracefully when window is unavailable.
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);
  const [hovered, setHovered] = useState(false);
  // currentUrl is null on the server (window unavailable) and populated
  // on the client via useEffect — prevents SSR hydration mismatch.
  const [currentUrl, setCurrentUrl] = useState<string | null>(null);

  useEffect(() => {
    // Only runs in the browser — safe access to window.location.
    if (typeof window !== 'undefined') {
      setCurrentUrl(window.location.href);
    }
  }, []);

  const handleCopy = async () => {
    const url = currentUrl ?? (typeof window !== 'undefined' ? window.location.href : '');
    if (!url) return;

    try {
      await navigator.clipboard.writeText(url);
    } catch {
      // Fallback for browsers that block the Clipboard API (e.g. old Android WebView).
      const el = document.createElement('textarea');
      el.value = url;
      el.style.position = 'fixed';
      el.style.opacity = '0';
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
    }

    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <button
        onClick={handleCopy}
        className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl
                   border border-indigo-500/30 hover:border-indigo-500/60
                   text-gray-300 hover:text-white text-sm font-semibold
                   transition text-center"
      >
        {copied ? (
          <>
            <CheckCircle2 size={15} className="text-emerald-400" />
            Link Copied!
          </>
        ) : (
          <>
            <Copy size={15} />
            Copy Certificate Link
          </>
        )}
      </button>

      {/* Tooltip — shows the URL being copied, only on hover and when URL is known */}
      {hovered && currentUrl && !copied && (
        <div
          role="tooltip"
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 z-10
                     max-w-xs w-max px-3 py-2 rounded-lg
                     bg-gray-800 border border-indigo-500/20
                     text-xs text-gray-400 break-all text-center
                     pointer-events-none select-none"
        >
          {currentUrl}
          {/* Arrow */}
          <span className="absolute top-full left-1/2 -translate-x-1/2
                           border-4 border-transparent border-t-gray-800" />
        </div>
      )}
    </div>
  );
}
