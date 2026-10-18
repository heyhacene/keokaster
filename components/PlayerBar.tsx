'use client';

import React, { useState } from 'react';
import { usePlayer } from '@/lib/playerContext';
import { Play, Pause, Zap, FastForward, RotateCcw, RotateCw, Loader2, Car } from 'lucide-react';
import CarModeModal from '@/components/CarModeModal';

export default function PlayerBar() {
  const {
    currentEpisode,
    isPlaying,
    isLoadingAudio,
    currentTime,
    duration,
    queue,
    togglePlay,
    skipAdNow,
    skipForward,
    skipBackward,
    openFullPlayer,
  } = usePlayer();

  const [showCarMode, setShowCarMode] = useState(false);

  if (!currentEpisode) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 backdrop-blur-xl border-t border-slate-800 shadow-2xl">
      {/* BARRE DE PROGRESSION */}
      <div className="w-full h-1.5 bg-slate-800 cursor-pointer">
        <div
          className="h-full bg-gradient-to-r from-purple-500 via-indigo-500 to-amber-500 transition-all duration-200"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      <div className="max-w-4xl mx-auto px-3 sm:px-4 py-3 flex items-center justify-between gap-3">
        {/* INFOS DE L'ÉPISODE (CLIC POUR AGRANDIR) */}
        <div
          onClick={openFullPlayer}
          className="flex items-center gap-3.5 min-w-0 flex-1 cursor-pointer group select-none"
        >
          <div
            style={{ width: '52px', height: '52px', minWidth: '52px', minHeight: '52px' }}
            className="rounded-2xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/80 shadow-md relative"
          >
            {currentEpisode.podcastArtwork ? (
              <img
                src={currentEpisode.podcastArtwork}
                alt={currentEpisode.title}
                width={52}
                height={52}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-800 to-indigo-900" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <h4 className="text-sm font-bold text-white truncate group-hover:text-purple-300 transition">
              {currentEpisode.title}
            </h4>
            <div className="flex items-center gap-2 mt-0.5">
              <p className="text-xs text-slate-400 truncate">
                {currentEpisode.podcastTitle}
              </p>
              {queue.length > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-500/25 text-purple-300 border border-purple-500/35 shrink-0 flex items-center gap-1">
                  <span>+{queue.length} en attente</span>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* CONTRÔLES DE LECTURE & ANTI-PUB - GROS BOUTONS ACCESSIBLES */}
        <div className="flex items-center gap-2 shrink-0">
          {/* BOUTON SAUTER LA PUB IMMÉDIATEMENT */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipAdNow(60);
            }}
            className="px-3 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 hover:text-amber-100 border border-amber-500/40 text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-sm"
            title="Sauter la pub (+60s)"
          >
            <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
            <span className="hidden sm:inline">Sauter pub</span>
            <span className="font-mono">+60s</span>
          </button>

          {/* ACCÈS DIRECT MODE VOITURE */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowCarMode(true);
            }}
            className="p-3 text-amber-400 hover:text-amber-300 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 rounded-2xl transition active:scale-90"
            title="Ouvrir le Mode Voiture (Boutons géants conduite)"
          >
            <Car className="w-5 h-5 text-amber-400" />
          </button>

          {/* RECULER DE 10S */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              skipBackward(10);
            }}
            className="p-3 text-slate-300 hover:text-white rounded-2xl hover:bg-slate-800 transition active:scale-90"
            title="Reculer de 10s"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          {/* GROS BOUTON PLAY / PAUSE */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
            className="w-12 h-12 sm:w-14 sm:h-14 flex items-center justify-center bg-gradient-to-tr from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-2xl shadow-lg shadow-purple-600/40 transition active:scale-90"
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isLoadingAudio ? (
              <Loader2 className="w-6 h-6 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-6 h-6 fill-white" />
            ) : (
              <Play className="w-6 h-6 fill-white ml-0.5" />
            )}
          </button>
        </div>
      </div>

      {/* MODALE DU MODE VOITURE */}
      <CarModeModal isOpen={showCarMode} onClose={() => setShowCarMode(false)} />
    </div>
  );
}
