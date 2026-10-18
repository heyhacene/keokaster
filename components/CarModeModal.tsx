'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
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
  Gauge,
  Sun,
} from 'lucide-react';

interface CarModeModalProps {
  isOpen?: boolean;
  onClose?: () => void;
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

const SPEED_STEPS = [1.0, 1.2, 1.5, 1.75, 2.0];

export default function CarModeModal({ isOpen, onClose }: CarModeModalProps) {
  const {
    currentEpisode,
    isPlaying,
    isLoadingAudio,
    currentTime,
    duration,
    speed,
    setSpeed,
    togglePlay,
    skipForward,
    skipBackward,
    skipAdNow,
    quickSkipSec,
    setQuickSkipSec,
    forwardSkipSec,
    backwardSkipSec,
    playNextInQueue,
    queue,
    isCarModeOpen,
    closeCarMode,
  } = usePlayer();

  const [hasWakeLock, setHasWakeLock] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const effectiveIsOpen = isOpen !== undefined ? isOpen : isCarModeOpen;
  const effectiveClose = onClose !== undefined ? onClose : closeCarMode;

  // Maintien de l'écran allumé au volant (WakeLock API)
  useEffect(() => {
    if (!effectiveIsOpen) return;
    let wakeLock: any = null;

    if (typeof navigator !== 'undefined' && 'wakeLock' in navigator) {
      (navigator as any).wakeLock
        .request('screen')
        .then((lock: any) => {
          wakeLock = lock;
          setHasWakeLock(true);
        })
        .catch(() => {});
    }

    return () => {
      if (wakeLock) {
        wakeLock.release().catch(() => {});
      }
      setHasWakeLock(false);
    };
  }, [effectiveIsOpen]);

  if (!effectiveIsOpen || !currentEpisode || !mounted) return null;

  const triggerHaptic = () => {
    if (typeof navigator !== 'undefined' && navigator.vibrate) {
      try {
        navigator.vibrate(35);
      } catch {}
    }
  };

  const handleNextSpeed = () => {
    triggerHaptic();
    const currIdx = SPEED_STEPS.indexOf(speed);
    const nextIdx = (currIdx + 1) % SPEED_STEPS.length;
    setSpeed(SPEED_STEPS[nextIdx]);
  };

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;
  const remainingSec = Math.max(0, duration - currentTime);

  const modalContent = (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100vw',
        height: '100dvh',
        maxHeight: '100dvh',
        zIndex: 9999,
      }}
      className="bg-black text-white flex flex-col justify-between p-3 sm:p-5 select-none overflow-hidden animate-in fade-in duration-150"
    >
      {/* HEADER MODE VOITURE - COMPACT ET LISIBLE */}
      <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 shrink-0">
        <div className="flex items-center gap-2">
          <div className="px-3 py-1.5 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 text-xs font-black uppercase tracking-wider flex items-center gap-1.5 shadow-sm">
            <span>🚗 Mode Voiture</span>
          </div>
          {hasWakeLock && (
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded-lg border border-emerald-500/30">
              <Sun className="w-3 h-3" />
              <span>Écran allumé</span>
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* SÉLECTEUR RAPIDE VITESSE */}
          <button
            type="button"
            onClick={handleNextSpeed}
            className="px-3 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-purple-300 border border-slate-700 text-xs font-black font-mono flex items-center gap-1 active:scale-95 transition"
            title="Changer la vitesse de lecture"
          >
            <Gauge className="w-4 h-4 text-purple-400" />
            <span>{speed}x</span>
          </button>

          {/* BOUTON QUITTER */}
          <button
            type="button"
            onClick={effectiveClose}
            className="px-4 py-2 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white border border-slate-700 text-xs font-extrabold flex items-center gap-2 active:scale-95 transition"
          >
            <X className="w-4 h-4 text-slate-300" />
            <span>Quitter</span>
          </button>
        </div>
      </div>

      {/* TITRE ET ÉMISSION EN GRAND CARACTÈRE AU CENTRE */}
      <div className="text-center my-auto py-1 sm:py-2 space-y-2 sm:space-y-3 shrink-0">
        <p className="text-xs sm:text-sm font-bold text-purple-400 uppercase tracking-wide truncate max-w-xl mx-auto flex items-center justify-center gap-2">
          <Radio className="w-4 h-4 text-purple-400 shrink-0" />
          <span>{currentEpisode.podcastTitle || 'Podcast'}</span>
        </p>

        <h1 className="text-lg sm:text-2xl font-black text-white leading-snug line-clamp-2 max-w-xl mx-auto px-2">
          {currentEpisode.title}
        </h1>

        {/* TEMPS ÉCOULÉ / RESTANT */}
        <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-mono font-bold text-slate-400 pt-0.5">
          <span>{formatTime(currentTime)}</span>
          <span className="text-slate-600">•</span>
          <span className="text-purple-300">-{formatTime(remainingSec)}</span>
        </div>

        {/* BARRE DE PROGRESSION ÉPAISSE */}
        <div className="w-full max-w-xl mx-auto h-2.5 bg-slate-900 rounded-full overflow-hidden border border-slate-800">
          <div
            className="h-full bg-gradient-to-r from-purple-500 to-amber-400 transition-all duration-300"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* GROS BOUTONS DE COMMANDE SÉCURISÉS - TOUT EST VISIBLE SANS SCROLL */}
      <div className="max-w-xl w-full mx-auto space-y-2.5 sm:space-y-3 pb-1 shrink-0">
        {/* BOUTON SAUT DE PUB GÉANT */}
        <button
          type="button"
          onClick={() => skipAdNow()}
          className="w-full py-4 sm:py-4.5 rounded-2xl sm:rounded-3xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-base sm:text-lg font-black flex items-center justify-center gap-2.5 shadow-xl shadow-amber-500/30 active:scale-95 transition"
        >
          <Zap className="w-6 h-6 fill-slate-950" />
          <span>SAUTER LA PUB (+{quickSkipSec}s)</span>
        </button>

        {/* RÉGLAGE RAPIDE DE LA DURÉE DU SAUT DE PUB AU VOLANT */}
        <div className="flex items-center justify-center gap-1.5 sm:gap-2">
          <span className="text-[11px] sm:text-xs text-slate-400 font-semibold mr-1">Régler :</span>
          {[10, 20, 30, 60].map((sec) => (
            <button
              key={sec}
              type="button"
              onClick={() => setQuickSkipSec(sec)}
              className={`px-3 py-1 sm:py-1.5 rounded-xl text-xs font-mono font-bold transition active:scale-95 ${
                quickSkipSec === sec
                  ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/40 ring-2 ring-amber-300'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              +{sec}s
            </button>
          ))}
        </div>

        {/* RANGÉE CENTRALE : RECULER / PLAY GÉANT / AVANCER */}
        <div className="grid grid-cols-3 gap-2.5 sm:gap-3 items-center">
          {/* RECULER */}
          <button
            type="button"
            onClick={() => skipBackward()}
            className="h-18 sm:h-22 rounded-2xl sm:rounded-3xl bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 text-white flex flex-col items-center justify-center active:scale-95 transition shadow-md"
            title={`Reculer de ${backwardSkipSec}s`}
          >
            <RotateCcw className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-xs sm:text-sm font-mono font-bold mt-1">-{backwardSkipSec}s</span>
          </button>

          {/* GROS BOUTON PLAY/PAUSE */}
          <button
            type="button"
            onClick={togglePlay}
            className={`h-22 sm:h-26 rounded-2xl sm:rounded-3xl text-white flex items-center justify-center shadow-2xl active:scale-90 transition ${
              isPlaying
                ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-purple-600/50'
                : 'bg-purple-700 shadow-purple-700/40'
            }`}
          >
            {isLoadingAudio ? (
              <Loader2 className="w-10 h-10 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-10 h-10 sm:w-11 sm:h-11 fill-white" />
            ) : (
              <Play className="w-10 h-10 sm:w-11 sm:h-11 fill-white ml-1.5" />
            )}
          </button>

          {/* AVANCER */}
          <button
            type="button"
            onClick={() => skipForward()}
            className="h-18 sm:h-22 rounded-2xl sm:rounded-3xl bg-slate-900 hover:bg-slate-850 border-2 border-slate-800 text-white flex flex-col items-center justify-center active:scale-95 transition shadow-md"
            title={`Avancer de ${forwardSkipSec}s`}
          >
            <RotateCw className="w-6 h-6 sm:w-7 sm:h-7" />
            <span className="text-xs sm:text-sm font-mono font-bold mt-1">+{forwardSkipSec}s</span>
          </button>
        </div>

        {/* SUIVANT EN ATTENTE */}
        {queue.length > 0 && (
          <button
            type="button"
            onClick={playNextInQueue}
            className="w-full py-2.5 px-3 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300 hover:text-white text-xs font-bold flex items-center justify-center gap-2 active:scale-95 transition"
          >
            <SkipForward className="w-4 h-4 text-purple-400" />
            <span>Suivant ({queue.length} en attente)</span>
          </button>
        )}
      </div>
    </div>
  );

  return createPortal(modalContent, document.body);
}
