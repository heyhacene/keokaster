'use client';

import React from 'react';
import { usePlayer } from '@/lib/playerContext';
import { Zap, ShieldCheck } from 'lucide-react';

export default function AdSkipBanner() {
  const { lastSkippedAd } = usePlayer();

  if (!lastSkippedAd) return null;

  return (
    <div className="fixed top-16 left-4 right-4 max-w-sm mx-auto z-50 animate-in slide-in-from-top duration-300 pointer-events-none">
      <div className="bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white px-3.5 py-2.5 rounded-2xl shadow-xl shadow-emerald-950/40 border border-emerald-400/30 flex items-center gap-2.5">
        <div className="p-1.5 bg-white/20 rounded-xl shrink-0">
          <Zap className="w-4 h-4 text-emerald-200 animate-pulse" />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-200 flex items-center gap-1">
              <span>⚡ Moteur IA ZeroPub</span>
            </span>
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-300" />
          </div>
          <p className="text-xs font-bold text-white truncate">
            {lastSkippedAd.label}
          </p>
        </div>
      </div>
    </div>
  );
}
