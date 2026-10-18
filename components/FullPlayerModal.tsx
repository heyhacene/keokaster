'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePlayer } from '@/lib/playerContext';
import {
  ChevronDown,
  Play,
  Pause,
  RotateCcw,
  RotateCw,
  Zap,
  ShieldAlert,
  Moon,
  Gauge,
  ListMusic,
  ListPlus,
  Trash2,
  X,
  Radio,
  Bookmark,
  Share2,
  Loader2,
  Car,
} from 'lucide-react';
import CarModeModal from '@/components/CarModeModal';

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

const SPEED_OPTIONS = [0.75, 1.0, 1.2, 1.5, 1.75, 2.0, 2.5];
const SLEEP_OPTIONS = [
  { label: 'Désactivé', min: null },
  { label: '15 minutes', min: 15 },
  { label: '30 minutes', min: 30 },
  { label: '45 minutes', min: 45 },
  { label: '60 minutes', min: 60 },
];

export default function FullPlayerModal() {
  const {
    currentEpisode,
    isPlaying,
    isLoadingAudio,
    currentTime,
    duration,
    speed,
    queue,
    adSegments,
    aiAdResult,
    sleepTimerRemainingSec,
    isFullPlayerOpen,
    togglePlay,
    playEpisode,
    removeFromQueue,
    seekTo,
    skipForward,
    skipBackward,
    setSpeed,
    setSleepTimer,
    skipAdNow,
    markCurrentTimeAsAd,
    closeFullPlayer,
  } = usePlayer();

  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const [showSleepMenu, setShowSleepMenu] = useState(false);
  const [showChapters, setShowChapters] = useState(false);
  const [showQueue, setShowQueue] = useState(false);
  const [showCarMode, setShowCarMode] = useState(false);

  if (!isFullPlayerOpen || !currentEpisode) return null;

  const progressPercent = duration > 0 ? (currentTime / duration) * 100 : 0;

  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekTo(val);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex flex-col justify-between overflow-y-auto animate-in slide-in-from-bottom duration-300">
      {/* HEADER MODALE */}
      <div className="max-w-md w-full mx-auto p-4 flex items-center justify-between shrink-0">
        <button
          type="button"
          onClick={closeFullPlayer}
          className="p-2 text-slate-400 hover:text-white rounded-2xl hover:bg-slate-900 transition"
          title="Fermer le lecteur"
        >
          <ChevronDown className="w-6 h-6" />
        </button>

        <div className="text-center">
          <span className="text-[10px] uppercase font-bold tracking-wider text-purple-400">
            Lecture en cours
          </span>
          <p className="text-xs font-bold text-white truncate max-w-[200px]">
            {currentEpisode.podcastTitle}
          </p>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowCarMode(true)}
            className="p-2 text-slate-400 hover:text-amber-400 rounded-2xl hover:bg-slate-900 transition flex items-center gap-1"
            title="Activer le Mode Voiture (Écran Conduite)"
          >
            <Car className="w-5 h-5 text-amber-400" />
          </button>

          <button
            type="button"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: currentEpisode.title,
                  text: `Écoute cet épisode de ${currentEpisode.podcastTitle} sur Keo Kaster !`,
                  url: window.location.href,
                }).catch(() => {});
              }
            }}
            className="p-2 text-slate-400 hover:text-white rounded-2xl hover:bg-slate-900 transition"
            title="Partager l'épisode"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* JAQUETTE & INFOS */}
      <div className="max-w-md w-full mx-auto px-6 py-2 flex flex-col items-center justify-center flex-1">
        {/* POCHETTE */}
        <div
          style={{ width: '256px', height: '256px', maxWidth: '75vw', maxHeight: '75vw' }}
          className="rounded-3xl overflow-hidden shadow-2xl shadow-purple-900/40 border border-slate-800 relative mb-6 shrink-0"
        >
          {currentEpisode.podcastArtwork ? (
            <img
              src={currentEpisode.podcastArtwork}
              alt={currentEpisode.title}
              width={256}
              height={256}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-purple-800 to-indigo-900 flex items-center justify-center text-white font-extrabold text-3xl">
              Keo
            </div>
          )}

          {/* BADGE ANTI-PUB SUR L'IMAGE */}
          {adSegments.length > 0 && (
            <div className="absolute top-3 right-3 px-2.5 py-1 rounded-xl bg-slate-950/80 backdrop-blur-md border border-emerald-500/40 text-emerald-400 text-[10px] font-bold flex items-center gap-1 shadow-md">
              <Zap className="w-3 h-3 text-emerald-400" />
              <span>{adSegments.length} zone(s) pub filtrée(s)</span>
            </div>
          )}
        </div>

        {/* TITRE DE L'ÉPISODE */}
        <div className="text-center w-full px-2 mb-3">
          <h2 className="text-base sm:text-lg font-extrabold text-white leading-snug line-clamp-2">
            {currentEpisode.title}
          </h2>
          <p className="text-xs text-purple-300 font-medium mt-1 truncate">
            {currentEpisode.podcastTitle}
          </p>

          {/* BADGE D'ANALYSE IA ZEROPUB */}
          {aiAdResult && (
            <div className="mt-2.5 inline-flex flex-col items-center gap-1 max-w-full">
              <div
                className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 border ${
                  aiAdResult.hasAds
                    ? 'bg-emerald-950/80 border-emerald-500/50 text-emerald-300 shadow-sm shadow-emerald-950'
                    : 'bg-slate-900 border-slate-700/80 text-slate-400'
                }`}
              >
                <Zap
                  className={`w-3.5 h-3.5 ${
                    aiAdResult.hasAds ? 'text-emerald-400 fill-emerald-400 animate-pulse' : 'text-slate-500'
                  }`}
                />
                <span className="truncate max-w-xs">{aiAdResult.summary}</span>
              </div>
              {aiAdResult.detectedSponsors.length > 0 && (
                <div className="flex flex-wrap justify-center gap-1 text-[10px] mt-0.5">
                  {aiAdResult.detectedSponsors.map((sp) => (
                    <span
                      key={sp}
                      className="px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/40 font-semibold"
                    >
                      Sponsor : {sp}
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* BARRE DE PROGRESSION AVEC ZONES PUBS MARQUÉES */}
        <div className="w-full space-y-1.5 mb-4">
          <div className="relative flex items-center">
            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.5}
              value={currentTime}
              onChange={handleSliderChange}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-purple-500 z-10"
            />

            {/* ZONES PUBS ROUGES/ORANGES DESSINÉES DERRIÈRE LE SLIDER */}
            {duration > 0 &&
              adSegments.map((seg) => {
                const left = (seg.startTime / duration) * 100;
                const width = ((seg.endTime - seg.startTime) / duration) * 100;
                return (
                  <div
                    key={seg.id}
                    className="absolute top-0 bottom-0 bg-amber-500/70 rounded-xs pointer-events-none"
                    style={{ left: `${left}%`, width: `${width}%` }}
                    title={seg.label}
                  />
                );
              })}
          </div>

          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(Math.max(0, duration - currentTime))}</span>
          </div>
        </div>

        {/* COMMANDES PRINCIPALES - GROS BOUTONS ACCESSIBLES */}
        <div className="flex items-center justify-center gap-6 sm:gap-10 mb-6">
          {/* -10S */}
          <button
            type="button"
            onClick={() => skipBackward(10)}
            className="w-16 h-16 rounded-3xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition active:scale-90 flex flex-col items-center justify-center shadow-md"
            title="Reculer de 10s"
          >
            <RotateCcw className="w-7 h-7" />
            <span className="text-[11px] font-mono font-bold mt-0.5">10s</span>
          </button>

          {/* PLAY / PAUSE GÉANT AVEC RETOUR CHARGEMENT */}
          <button
            type="button"
            onClick={togglePlay}
            className="w-22 h-22 sm:w-24 sm:h-24 rounded-3xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white shadow-2xl shadow-purple-600/40 transition-transform active:scale-90 flex items-center justify-center ring-4 ring-purple-500/20"
            title={isPlaying ? 'Pause' : 'Lecture'}
          >
            {isLoadingAudio ? (
              <Loader2 className="w-10 h-10 sm:w-11 sm:h-11 animate-spin text-white" />
            ) : isPlaying ? (
              <Pause className="w-10 h-10 sm:w-11 sm:h-11 fill-white" />
            ) : (
              <Play className="w-10 h-10 sm:w-11 sm:h-11 fill-white ml-1.5" />
            )}
          </button>

          {/* +30S */}
          <button
            type="button"
            onClick={() => skipForward(30)}
            className="w-16 h-16 rounded-3xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-slate-200 hover:text-white transition active:scale-90 flex flex-col items-center justify-center shadow-md"
            title="Avancer de 30s"
          >
            <RotateCw className="w-7 h-7" />
            <span className="text-[11px] font-mono font-bold mt-0.5">30s</span>
          </button>
        </div>

        {/* BOUTONS DÉDIÉS DU MOTEUR ANTI-PUB */}
        <div className="w-full grid grid-cols-2 gap-3 mb-4">
          <button
            type="button"
            onClick={() => skipAdNow(60)}
            className="py-3.5 px-4 rounded-2xl bg-gradient-to-r from-amber-500/20 to-orange-500/20 hover:from-amber-500/30 hover:to-orange-500/30 border border-amber-500/50 text-amber-300 text-sm font-extrabold flex items-center justify-center gap-2 transition active:scale-95 shadow-lg shadow-amber-950/30"
          >
            <Zap className="w-5 h-5 text-amber-400 fill-amber-400" />
            <span>Sauter pub (+60s)</span>
          </button>

          <button
            type="button"
            onClick={markCurrentTimeAsAd}
            className="py-3.5 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700/80 text-slate-300 hover:text-white text-sm font-bold flex items-center justify-center gap-2 transition active:scale-95 shadow-md"
            title="Signale ce passage comme une pub pour qu'il soit sauté à jamais"
          >
            <ShieldAlert className="w-5 h-5 text-purple-400" />
            <span>Marquer pub</span>
          </button>
        </div>
      </div>

      {/* FOOTER : VITESSE, MINUTEUR, CHAPITRES */}
      <div className="max-w-md w-full mx-auto p-4 border-t border-slate-900 flex items-center justify-around shrink-0 bg-slate-950/60">
        {/* VITESSE */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSpeedMenu(!showSpeedMenu)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
          >
            <Gauge className="w-3.5 h-3.5 text-purple-400" />
            <span>{speed}x</span>
          </button>

          {showSpeedMenu && (
            <div className="absolute bottom-full mb-2 left-0 w-32 bg-slate-900 border border-slate-700 rounded-2xl p-1 shadow-xl z-50">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => {
                    setSpeed(s);
                    setShowSpeedMenu(false);
                  }}
                  className={`w-full py-1.5 px-3 text-left text-xs font-bold rounded-xl transition ${
                    speed === s ? 'bg-purple-600 text-white' : 'text-slate-300 hover:bg-slate-800'
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* MINUTEUR DE VEILLE */}
        <div className="relative">
          <button
            type="button"
            onClick={() => setShowSleepMenu(!showSleepMenu)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition ${
              sleepTimerRemainingSec !== null
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                : 'text-slate-300 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-amber-400" />
            <span>
              {sleepTimerRemainingSec !== null
                ? `${Math.ceil(sleepTimerRemainingSec / 60)}m`
                : 'Veille'}
            </span>
          </button>

          {showSleepMenu && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-40 bg-slate-900 border border-slate-700 rounded-2xl p-1 shadow-xl z-50">
              {SLEEP_OPTIONS.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => {
                    setSleepTimer(opt.min);
                    setShowSleepMenu(false);
                  }}
                  className="w-full py-1.5 px-3 text-left text-xs font-semibold text-slate-300 hover:bg-slate-800 rounded-xl transition"
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* FILE D'ATTENTE */}
        <button
          type="button"
          onClick={() => {
            setShowQueue(!showQueue);
            setShowChapters(false);
            setShowSpeedMenu(false);
            setShowSleepMenu(false);
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
            showQueue || queue.length > 0
              ? 'bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm shadow-purple-600/20'
              : 'text-slate-300 hover:text-white hover:bg-slate-900'
          }`}
          title="File d'attente (À écouter ensuite)"
        >
          <ListPlus className="w-3.5 h-3.5 text-purple-400" />
          <span>File ({queue.length})</span>
        </button>

        {/* CHAPITRES */}
        {currentEpisode.chapters && currentEpisode.chapters.length > 0 && (
          <div className="relative">
            <button
              type="button"
              onClick={() => setShowChapters(!showChapters)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold text-slate-300 hover:text-white hover:bg-slate-900 transition"
            >
              <ListMusic className="w-3.5 h-3.5 text-purple-400" />
              <span>Chapitres</span>
            </button>

            {showChapters && (
              <div className="absolute bottom-full mb-2 right-0 w-72 max-h-64 overflow-y-auto bg-slate-900 border border-slate-700 rounded-2xl p-2 shadow-2xl z-50 space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400 px-2 block mb-1">
                  Chapitres de l'épisode
                </span>
                {currentEpisode.chapters.map((chap, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => {
                      seekTo(chap.startTime);
                      setShowChapters(false);
                    }}
                    className="w-full p-2 text-left text-xs rounded-xl hover:bg-slate-800 flex items-center justify-between transition group"
                  >
                    <span className="text-white truncate font-medium group-hover:text-purple-300">
                      {chap.title}
                    </span>
                    <span className="text-[10px] font-mono text-slate-400 shrink-0 ml-2">
                      {formatTime(chap.startTime)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* TIROIR FILE D'ATTENTE */}
      {showQueue && (
        <div className="absolute inset-x-0 bottom-0 top-16 bg-slate-950/95 backdrop-blur-2xl z-50 p-4 sm:p-5 flex flex-col justify-between rounded-t-3xl border-t border-purple-500/40 shadow-2xl animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <ListPlus className="w-5 h-5 text-purple-400" />
              <div>
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  File d'attente
                </h3>
                <p className="text-[11px] text-slate-400">
                  {queue.length} épisode{queue.length > 1 ? 's' : ''} à écouter ensuite
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowQueue(false)}
              className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-3 space-y-2 scrollbar-thin">
            {queue.length === 0 ? (
              <div className="text-center py-16 text-slate-400 space-y-2">
                <ListPlus className="w-10 h-10 text-slate-600 mx-auto" />
                <p className="text-sm font-bold text-white">Votre file d'attente est vide</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Ajoutez des épisodes avec l'icône (+) ou par appui long pour qu'ils s'enchaînent automatiquement.
                </p>
              </div>
            ) : (
              queue.map((ep, idx) => (
                <div
                  key={ep.id}
                  className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 hover:border-purple-500/30 transition group"
                >
                  <div
                    className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer"
                    onClick={() => {
                      playEpisode(ep);
                      removeFromQueue(ep.id);
                      setShowQueue(false);
                    }}
                  >
                    {/* POCHETTE DU PODCAST AVEC NUMÉRO D'ORDRE */}
                    <div className="relative w-11 h-11 rounded-xl overflow-hidden bg-slate-800 shrink-0 border border-slate-700/80 shadow-sm">
                      {ep.artworkUrl || ep.podcastArtwork ? (
                        <img
                          src={ep.artworkUrl || ep.podcastArtwork}
                          alt=""
                          className="w-full h-full object-cover group-hover:scale-105 transition"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full bg-gradient-to-tr from-purple-800 to-indigo-900 flex items-center justify-center">
                          <Radio className="w-5 h-5 text-purple-300/60" />
                        </div>
                      )}
                      <span className="absolute bottom-0.5 right-0.5 px-1 py-0.2 rounded bg-slate-950/85 text-[9px] font-mono font-bold text-purple-300 border border-purple-500/30">
                        #{idx + 1}
                      </span>
                    </div>

                    <div className="min-w-0 flex-1">
                      <p className="text-[11px] font-bold text-purple-400 truncate flex items-center gap-1">
                        <Radio className="w-2.5 h-2.5 shrink-0" />
                        <span>{ep.podcastTitle || 'Podcast'}</span>
                      </p>
                      <p className="text-xs sm:text-sm font-bold text-white truncate group-hover:text-purple-200 transition">
                        {ep.title}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        playEpisode(ep);
                        removeFromQueue(ep.id);
                        setShowQueue(false);
                      }}
                      className="p-2 text-purple-400 hover:text-white hover:bg-purple-600/30 rounded-xl transition"
                      title="Écouter maintenant"
                    >
                      <Play className="w-4 h-4 fill-current" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeFromQueue(ep.id)}
                      className="p-2 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-xl transition"
                      title="Retirer de la file"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>

          <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
            <Link
              href="/library?tab=queue"
              onClick={() => {
                setShowQueue(false);
                closeFullPlayer();
              }}
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
            >
              <span>Ouvrir dans Bibliothèque →</span>
            </Link>
            <button
              type="button"
              onClick={() => setShowQueue(false)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white text-xs font-bold transition"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

      {/* MODAL DU MODE VOITURE (PLEIN ÉCRAN CONDUITE SÉCURISÉE) */}
      <CarModeModal isOpen={showCarMode} onClose={() => setShowCarMode(false)} />
    </div>
  );
}
