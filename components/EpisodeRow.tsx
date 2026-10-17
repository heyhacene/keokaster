'use client';

import React from 'react';
import { Episode } from '@/types/podcast';
import { usePlayer } from '@/lib/playerContext';
import { Play, Pause, ListPlus, Zap, Loader2 } from 'lucide-react';

interface EpisodeRowProps {
  episode: Episode;
  isPlayed?: boolean;
}

function formatDuration(sec: number): string {
  if (!sec) return '';
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m} min`;
}

function formatDate(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
  } catch {
    return '';
  }
}

export default function EpisodeRow({ episode, isPlayed = false }: EpisodeRowProps) {
  const { currentEpisode, isPlaying, isLoadingAudio, playEpisode, togglePlay, addToQueue } = usePlayer();

  const isCurrent = currentEpisode?.id === episode.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const isCurrentlyBuffering = isCurrent && isLoadingAudio;

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playEpisode(episode);
    }
  };

  return (
    <div
      onClick={handlePlayClick}
      className={`p-4 rounded-3xl border transition-all duration-200 flex items-center gap-4 cursor-pointer group select-none ${
        isCurrent
          ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/40'
          : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
      }`}
    >
      {/* GRAND BOUTON PLAY/PAUSE ULTRA ACCESSIBLE */}
      <button
        type="button"
        onClick={handlePlayClick}
        className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 transition-transform active:scale-90 flex items-center justify-center shadow-lg ${
          isCurrentlyPlaying
            ? 'bg-gradient-to-tr from-purple-600 to-indigo-600 text-white shadow-purple-600/40 ring-2 ring-purple-400/50'
            : isCurrent
            ? 'bg-purple-700 text-white shadow-purple-700/30'
            : 'bg-slate-800 text-purple-400 group-hover:bg-purple-600 group-hover:text-white shadow-black/40'
        }`}
        title={isCurrentlyPlaying ? 'Mettre en pause' : 'Écouter'}
      >
        {isCurrentlyBuffering ? (
          <Loader2 className="w-7 h-7 sm:w-8 sm:h-8 animate-spin text-white" />
        ) : isCurrentlyPlaying ? (
          <Pause className="w-7 h-7 sm:w-8 sm:h-8 fill-white" />
        ) : (
          <Play className="w-7 h-7 sm:w-8 sm:h-8 fill-current ml-0.5" />
        )}
      </button>

      {/* CONTENU DE L'ÉPISODE */}
      <div className="min-w-0 flex-1 py-0.5">
        <div className="flex items-center gap-2 mb-1.5 flex-wrap">
          {episode.pubDate && (
            <span className="text-xs font-semibold text-slate-400">
              {formatDate(episode.pubDate)}
            </span>
          )}
          {episode.durationSec > 0 && (
            <span className="text-xs font-mono text-slate-400">
              • {formatDuration(episode.durationSec)}
            </span>
          )}
          {episode.chapters && episode.chapters.length > 0 && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300 border border-purple-500/30">
              {episode.chapters.length} chapitres
            </span>
          )}
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
            <Zap className="w-3 h-3 fill-emerald-400" />
            <span>Anti-Pub</span>
          </span>
        </div>

        <h4 className={`text-sm sm:text-base font-bold leading-snug line-clamp-2 ${
          isCurrent ? 'text-purple-300 font-extrabold' : 'text-white group-hover:text-purple-200'
        } transition`}>
          {episode.title}
        </h4>

        {episode.description && (
          <p className="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            {episode.description}
          </p>
        )}
      </div>

      {/* ACTIONS RAPIDES */}
      <div className="shrink-0 flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addToQueue(episode);
          }}
          className="p-3 text-slate-400 hover:text-white rounded-2xl hover:bg-slate-800 transition active:scale-90"
          title="Ajouter à la file d'attente"
        >
          <ListPlus className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
