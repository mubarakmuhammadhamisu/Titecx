'use client';

// ─────────────────────────────────────────────────────────────────────────────
// CopyLinkButton — a tiny 'use client' island for the certificate share action.
//
// The certificate page is an async Server Component, so onClick handlers cannot
// live there directly — they are silently ignored during server rendering.
// This component handles the clipboard interaction and shows brief feedback.
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { CheckCircle2, Copy } from 'lucide-react';

export default function CopyLinkButton() {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch {
      // Fallback for browsers / contexts that block the Clipboard API
      const el = document.createElement('textarea');
      el.value = window.location.href;
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
  );
}
