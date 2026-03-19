"use client"
import React from 'react';
import Link from "next/link"
import { Home, ArrowLeft, ShieldAlert } from 'lucide-react';

const NotFound = () => {
  return (
    <div className="min-h-screen bg-linear-to-br from-indigo-600/20 via-purple-600/10 to-transparent text-white font-sans flex items-center justify-center p-6">
      
      {/* Background Decorative Glows */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full" />
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full" />
      </div>

      <div className="relative max-w-2xl w-full">
        {/* Main Glassmorphism Card */}
        <div className="bg-white/5 backdrop-blur-2xl border border-white/10 rounded-[2.5rem] p-8 md:p-16 text-center shadow-2xl relative z-10">
          
          {/* Error Icon / Graphic */}
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl bg-linear-to-br from-purple-500/20 to-blue-500/20 border border-white/10 mb-8">
            <ShieldAlert size={40} className="text-purple-400" />
          </div>

          <h1 className="text-8xl font-black tracking-tighter mb-4 bg-clip-text text-transparent bg-linear-to-b from-white to-white/20">
            404
          </h1>
          
          <h2 className="text-2xl md:text-3xl font-bold mb-6 tracking-tight">
            Knowledge Base <span className="text-blue-400 text-transparent bg-clip-text bg-linear-to-r from-blue-400 to-purple-400">Disconnected</span>
          </h2>
          
          <p className="text-gray-400 text-lg mb-10 max-w-md mx-auto leading-relaxed">
            The module or page you are looking for has been moved or doesn't exist in the current TITECX curriculum.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button 
              onClick={() => window.history.back()}
              className="flex items-center justify-center gap-2 px-8 py-4 bg-white/5 border border-white/10 rounded-2xl font-bold hover:bg-white/10 transition-all"
            >
              <ArrowLeft size={20} /> Go Back
            </button>
            
            <Link 
              href="/"
              className="flex items-center justify-center gap-2 px-8 py-4 bg-linear-to-r from-[#6366F1] to-[#A855F7] rounded-2xl font-bold hover:opacity-90 transition-all shadow-lg shadow-purple-500/20"
            >
              <Home size={20} /> Return Home
            </Link>
          </div>
        </div>

        {/* Cyber-style Footer detail */}
        <div className="mt-6 flex justify-center gap-6 text-[10px] font-mono text-gray-600 uppercase tracking-[0.2em]">
          <span>Error_Code: 0x404_NOT_FOUND</span>
          <span>System: TITECX_CORE_v1.0.0</span>
        </div>
      </div>
    </div>
  );
};

export default NotFound;