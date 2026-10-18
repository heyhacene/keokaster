'use client';

import React from 'react';
import { usePlayer } from '@/lib/playerContext';
import {
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Zap,
  SkipForward,
  X,
  Radio,
  Loader2,
  ShieldCheck,
  ListPlus,
} from 'lucide-react';

interface CarModeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function formatTime(seconds: number): string {
  if (isNaN(seconds) || seconds < 0) return '00:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export default function CarModeModal({ isOpen, onClose }: CarModeModalProps) {
  const {
    currentEpisode,
    isPlaying,
    isLoadingAudio,
    currentTime,
    duration,
    togglePlay,
    skipForward,
    skipBackward,
    skipAdNow,
    playNextInQueue,
    queue,
  } = usePlayer();

  if (!isOpen || !currentEpisode) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remainingSec = Math.max(0, duration - currentTime);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col justify-between p-4 sm:p-6 select-none animate-in fade-in duration-200">
      {/* HEADER MODE VOITURE */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <div className="px-2.5 py-1 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5">
            <span>🚗 Mode Voiture</span>
          </div>
          <span className="text-xs font-bold text-slate-400">
            Interface Sécurité Conduite
          </span>
        </div>

        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-extrabold flex items-center gap-2 active:scale-95"
        >
          <X className="w-4 h-4" />
          <span>Quitter</span>
        </button>
      </div>

      {/* TITRE ET ÉMISSION EN TRÈS GRAND CARACTÈRE */}
      <div className="text-center my-auto py-2 space-y-3">
        <p className="text-base sm:text-lg font-black text-purple-400 uppercase tracking-wide truncate max-w-xl mx-auto flex items-center justify-center gap-2">
          <Radio className="w-5 h-5 text-purple-400 shrink-0" />
          <span>{currentEpisode.podcastTitle || 'Podcast'}</span>
        </p>

        <h1 className="text-xl sm:text-3xl font-black text-white leading-tight line-clamp-2 max-w-xl mx-auto">
          {currentEpisode.title}
        </h1>

        {/* TEMPS ÉCOULÉ / RESTANT */}
        <div className="flex items-center justify-center gap-4 text-sm sm:text-base font-mono font-bold text-slate-400 pt-1">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-600">•</span>
          <span className="text-purple-300">-{formatTime(remainingSec)}</span>
        </div>

        {/* BARRE DE PROGRESSION ÉPAISSE */}
        <div className="w-full max-w-xl mx-auto h-3 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* GROS BOUTONS DE COMMANDE SÉCURISÉS */}
      <div className="max-w-xl w-full mx-auto space-y-4 pb-2">
        {/* BOUTON SAUT DE PUB GÉANT */}
        <button
          type="button"
          onClick={() => skipAdNow(60)}
          className="w-full py-5 rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-lg sm:text-xl font-black flex items-center justify-center gap-3 shadow-2xl shadow-amber-500/40 active:scale-95 transition"
        >
          <Zap className="w-7 h-7 fill-slate-950" />
          <span>SAUTER LA PUB (+60s)</span>
        </button>

        {/* RANGÉE CENTRALE : -15s / PLAY GÉANT / +30s */}
        <div className="grid grid-cols-3 gap-3 items-center">
          {/* -15s */}
          <button
            type="button"
            onClick={() => skipBackward(15)}
            className="h-20 sm:h-24 rounded-3xl bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 text-white flex flex-col items-center justify-center active:scale-95 transition"
          >
            <RotateCcw className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-xs sm:text-sm font-mono font-bold mt-1">-15s</span>
          </button>

          {/* GROS BOUTON PLAY/PAUSE */}
          <button
            type="button"
            onClick={togglePlay}
            className={`h-24 sm:h-28 rounded-3xl text-white flex items-center justify-center shadow-2xl active:scale-90 transition ${
              isPlaying
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-600/50'
                : 'bg-purple-700 shadow-purple-700/40'
            }`}
          >
            {isLoadingAudio ? (
              <Loader2 className="w-12 h-12 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-12 h-12 fill-white" />
            ) : (
              <Play className="w-12 h-12 fill-white ml-1.5" />
            )}
          </button>

          {/* +30s */}
          <button
            type="button"
            onClick={() => skipForward(30)}
            className="h-20 sm:h-24 rounded-3xl bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 text-white flex flex-col items-center justify-center active:scale-95 transition"
          >
            <RotateCw className="w-7 h-7 sm:w-8 sm:h-8" />
            <span className="text-xs sm:text-sm font-mono font-bold mt-1">+30s</span>
          </button>
        </div>

        {/* SUIVANT EN ATTENTE */}
        {queue.length > 0 && (
          <button
            type="button"
            onClick={playNextInQueue}
            className="w-full py-3.5 px-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white text-xs sm:text-sm font-bold flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <SkipForward className="w-4 h-4 text-purple-400" />
            <span>Épisode suivant en file ({queue.length} restant{queue.length > 1 ? 's' : ''})</span>
          </button>
        )}
      </div>
    </div>
  );
}
