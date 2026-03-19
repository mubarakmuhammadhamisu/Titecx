'use client'; // Error components must be Client Components

import React, { useEffect } from 'react';
import { RefreshCcw, ShieldX, Home } from 'lucide-react';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service like Sentry or Supabase
    console.error('TITECX_RUNTIME_ERROR:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-[#0D0B21] text-white font-sans flex items-center justify-center p-6 selection:bg-purple-500/30">
      
      {/* Dynamic Background Glow */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-red-500/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-2xl w-full">
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-16 text-center shadow-2xl relative z-10">
          
          {/* Critical Error Icon */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-red-500/20 to-orange-500/20 border border-red-500/20 mb-8">
            <ShieldX size={40} className="text-red-400" />
          </div>

          <h1 className="text-5xl md:text-7xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-linear-to-b from-white to-white/20">
            System Breach
          </h1>
          
          <h2 className="text-xl md:text-2xl font-bold mb-6 text-red-400/80">
            A runtime exception has occurred.
          </h2>
          
          <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            Our neural network encountered an unexpected block while processing this request. This has been logged for our engineers.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            {/* The Reset Button - Attempt to recover */}
            <button 
              onClick={() => reset()}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-red-600 to-orange-600 rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-red-500/20"
            >
              <RefreshCcw size={20} /> Attempt Recovery
            </button>
            
            <Link 
              href="/dashboard"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
            >
              <Home size={20} /> Return to Safety
            </Link>
          </div>

          {/* Technical Metadata for your Debugging */}
          <div className="mt-12 pt-8 border-t border-white/5 text-left">
             <p className="text-[10px] font-mono text-gray-600 uppercase tracking-widest mb-2">Diagnostic Data:</p>
             <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                <code className="text-[10px] text-red-300/60 break-all font-mono">
                   {error.message || "Unknown execution error sequence."}
                   {error.digest && <span className="block mt-1 opacity-50">Digest ID: {error.digest}</span>}
                </code>
             </div>
          </div>
        </div>

        <div className="mt-6 flex justify-center gap-6 text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em]">
          <span>Status: FAIL_SAFE_ACTIVE</span>
          <span>Node: {typeof window !== 'undefined' ? window.location.hostname : 'Server'}</span>
        </div>
      </div>
    </div>
  );
}