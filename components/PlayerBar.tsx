'use client';

import React from 'react';
import { usePlayer } from '@/lib/playerContext';
import { Play, Pause, Zap, FastForward, RotateCcw } from 'lucide-react';

export default function PlayerBar() {
  const {
    currentEpisode,
    isPlaying,
    currentTime,
    duration,
    togglePlay,
    skipAdNow,
    skipForward,
    skipBackward,
    openFullPlayer,
  } = usePlayer();

  if (!currentEpisode) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/95 backdrop-blur-md border-t border-slate-800 shadow-2xl">
      {/* BARRE DE PROGRESSION MINCE */}
      <div className="w-full h-1 bg-slate-800 cursor-pointer">
        <div
          className="h-full bg-gradient-to-r from-purple-500 to-amber-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-2.5 flex items-center justify-between gap-3">
        {/* INFOS DE L'ÉPISODE (CLIC POUR AGRANDIR) */}
        <div
          onClick={openFullPlayer}
          className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer group"
        >
          <div className="w-11 h-11 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/60 shadow-xs relative">
            {currentEpisode.podcastArtwork ? (
              <img
                src={currentEpisode.podcastArtwork}
                alt=""
                className="w-full h-full object-cover group-hover:scale-105 transition"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-800 to-indigo-900" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-purple-300 transition">
              {currentEpisode.title}
            </h4>
            <p className="text-[11px] text-slate-400 truncate">
              {currentEpisode.podcastTitle}
            </p>
          </div>
        </div>

        {/* CONTRÔLES DE LECTURE & ANTI-PUB EN 1 CLIC */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* BOUTON SAUTER LA PUB IMMÉDIATEMENT */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipAdNow(30);
            }}
            className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-500/15 to-orange-500/15 text-amber-300 hover:text-amber-200 border border-amber-500/30 text-xs font-bold transition flex items-center gap-1 active:scale-95"
            title="Sauter la pub (+30s)"
          >
            <Zap className="w-3.5 h-3.5 text-amber-400" />
            <span className="hidden sm:inline">Sauter pub</span>
            <span className="text-[10px] font-mono">+30s</span>
          </button>

          {/* RECULER DE 10S */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipBackward(10);
            }}
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
            title="Reculer de 10s"
          >
            <RotateCcw className="w-4 h-4" />
          </button>

          {/* PLAY / PAUSE */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl shadow-md shadow-purple-600/30 transition active:scale-95"
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
          </button>
        </div>
      </div>
    </div>
  );
}
