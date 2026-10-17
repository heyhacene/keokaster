'use client';

import React from 'react';
import { Episode } from '@/types/podcast';
import { usePlayer } from '@/lib/playerContext';
import { Play, Pause, Plus, ListPlus, Clock, Zap, Check } from 'lucide-react';

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
  const { currentEpisode, isPlaying, playEpisode, togglePlay, addToQueue } = usePlayer();

  const isCurrent = currentEpisode?.id === episode.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;

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
      className={`p-3.5 sm:p-4 rounded-2xl border transition flex items-start gap-3.5 cursor-pointer group ${
        isCurrent
          ? 'bg-purple-950/30 border-purple-600/40'
          : 'bg-slate-900/40 hover:bg-slate-900/80 border-slate-800/60 hover:border-slate-700'
      }`}
    >
      {/* BOUTON PLAY */}
      <button
        type="button"
        onClick={handlePlayClick}
        className={`p-3 rounded-2xl shrink-0 transition shadow-md active:scale-95 ${
          isCurrentlyPlaying
            ? 'bg-purple-600 text-white shadow-purple-600/30'
            : isCurrent
            ? 'bg-purple-700 text-white'
            : 'bg-slate-800 text-slate-300 group-hover:text-white group-hover:bg-purple-600/80'
        }`}
      >
        {isCurrentlyPlaying ? (
          <Pause className="w-4 h-4 fill-white" />
        ) : (
          <Play className="w-4 h-4 fill-white ml-0.5" />
        )}
      </button>

      {/* CONTENU DE L'ÉPISODE */}
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 mb-1 flex-wrap">
          {episode.pubDate && (
            <span className="text-[11px] font-semibold text-slate-400">
              {formatDate(episode.pubDate)}
            </span>
          )}
          {episode.durationSec > 0 && (
            <span className="text-[11px] font-mono text-slate-500">
              • {formatDuration(episode.durationSec)}
            </span>
          )}
          {episode.chapters && episode.chapters.length > 0 && (
            <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-purple-500/10 text-purple-400 border border-purple-500/20">
              {episode.chapters.length} chapitres
            </span>
          )}
          <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-0.5">
            <Zap className="w-2.5 h-2.5" />
            <span>Anti-Pub</span>
          </span>
        </div>

        <h4 className={`text-xs sm:text-sm font-bold leading-snug line-clamp-2 ${
          isCurrent ? 'text-purple-300' : 'text-white group-hover:text-purple-300'
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
      <div className="shrink-0 flex items-center gap-1 self-center">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            addToQueue(episode);
          }}
          className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition"
          title="Ajouter à la file d'attente"
        >
          <ListPlus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
