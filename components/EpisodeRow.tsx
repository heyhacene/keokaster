'use client';

import React, { useState } from 'react';
import { Episode, Playlist } from '@/types/podcast';
import { usePlayer } from '@/lib/playerContext';
import { Play, Pause, ListPlus, Zap, Loader2, Layers, FolderPlus, Check, Plus, Trash2, X } from 'lucide-react';
import { detectSeriesPart } from '@/lib/seriesDetector';
import { getPlaylists, addEpisodeToPlaylist, createPlaylist } from '@/lib/storage';

interface EpisodeRowProps {
  episode: Episode;
  isPlayed?: boolean;
  onRemoveFromPlaylist?: () => void;
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

export default function EpisodeRow({ episode, isPlayed = false, onRemoveFromPlaylist }: EpisodeRowProps) {
  const { currentEpisode, isPlaying, isLoadingAudio, playEpisode, togglePlay, addToQueue } = usePlayer();
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const isCurrent = currentEpisode?.id === episode.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const isCurrentlyBuffering = isCurrent && isLoadingAudio;
  const seriesInfo = detectSeriesPart(episode.title);

  const handlePlayClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isCurrent) {
      togglePlay();
    } else {
      playEpisode(episode);
    }
  };

  const handleOpenPlaylistModal = (e: React.MouseEvent) => {
    e.stopPropagation();
    setPlaylists(getPlaylists());
    setShowPlaylistModal(true);
  };

  const handleAddToPlaylist = (playlist: Playlist, e: React.MouseEvent) => {
    e.stopPropagation();
    const success = addEpisodeToPlaylist(playlist.id, episode);
    if (success) {
      setToastMsg(`Ajouté à « ${playlist.name} » !`);
    } else {
      setToastMsg(`Déjà présent dans « ${playlist.name} »`);
    }
    setTimeout(() => {
      setToastMsg(null);
      setShowPlaylistModal(false);
    }, 1500);
  };

  const handleCreateAndAdd = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!newPlaylistName.trim()) return;
    const pl = createPlaylist(newPlaylistName.trim());
    addEpisodeToPlaylist(pl.id, episode);
    setNewPlaylistName('');
    setToastMsg(`Playlist « ${pl.name} » créée avec succès !`);
    setTimeout(() => {
      setToastMsg(null);
      setShowPlaylistModal(false);
    }, 1500);
  };

  return (
    <>
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
            {seriesInfo.isSeries && (
              <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shadow-sm">
                <Layers className="w-3 h-3 text-amber-400" />
                <span>Partie {seriesInfo.badgeLabel}</span>
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
          {/* BOUTON PLAYLIST */}
          <button
            type="button"
            onClick={handleOpenPlaylistModal}
            className="p-3 text-slate-400 hover:text-purple-300 rounded-2xl hover:bg-slate-800 transition active:scale-90"
            title="Ajouter à une playlist"
          >
            <FolderPlus className="w-5 h-5" />
          </button>

          {/* BOUTON FILE D'ATTENTE */}
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

          {/* OPTION RETRAIT DE PLAYLIST SI SPÉCIFIÉ */}
          {onRemoveFromPlaylist && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onRemoveFromPlaylist();
              }}
              className="p-3 text-slate-400 hover:text-red-400 rounded-2xl hover:bg-slate-800 transition active:scale-90"
              title="Retirer de la playlist"
            >
              <Trash2 className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>

      {/* MODAL AJOUT À UNE PLAYLIST */}
      {showPlaylistModal && (
        <div
          className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setShowPlaylistModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-3xl p-5 max-w-sm w-full space-y-4 shadow-2xl relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5 text-purple-400" />
                <h3 className="font-extrabold text-sm sm:text-base text-white">
                  Ajouter à une playlist
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowPlaylistModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {toastMsg && (
              <div className="p-2.5 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-200 text-xs font-bold text-center animate-in fade-in">
                {toastMsg}
              </div>
            )}

            {/* LISTE DES PLAYLISTS EXISTANTES */}
            <div className="max-h-56 overflow-y-auto space-y-1.5 scrollbar-thin">
              {playlists.length === 0 ? (
                <p className="text-xs text-slate-400 text-center py-4">
                  Aucune playlist existante. Créez-en une ci-dessous !
                </p>
              ) : (
                playlists.map((pl) => {
                  const alreadyIn = pl.episodes.some((e) => e.id === episode.id);
                  return (
                    <button
                      key={pl.id}
                      type="button"
                      onClick={(e) => handleAddToPlaylist(pl, e)}
                      className={`w-full p-3 rounded-2xl border text-left flex items-center justify-between transition ${
                        alreadyIn
                          ? 'bg-purple-950/30 border-purple-500/30 text-purple-300'
                          : 'bg-slate-950 hover:bg-slate-800/80 border-slate-800 text-slate-200 hover:text-white'
                      }`}
                    >
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-bold truncate">{pl.name}</p>
                        <p className="text-[10px] text-slate-400">
                          {pl.episodes.length} épisode{pl.episodes.length > 1 ? 's' : ''}
                        </p>
                      </div>
                      {alreadyIn ? (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 flex items-center gap-1 shrink-0">
                          <Check className="w-3 h-3" />
                          <span>Ajouté</span>
                        </span>
                      ) : (
                        <span className="p-1 rounded-lg bg-slate-800 text-slate-400 hover:text-white shrink-0">
                          <Plus className="w-4 h-4" />
                        </span>
                      )}
                    </button>
                  );
                })
              )}
            </div>

            {/* CRÉER UNE NOUVELLE PLAYLIST */}
            <form onSubmit={handleCreateAndAdd} className="pt-2 border-t border-slate-800 space-y-2">
              <label className="text-xs font-bold text-slate-300 block">
                + Nouvelle playlist :
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newPlaylistName}
                  onChange={(e) => setNewPlaylistName(e.target.value)}
                  placeholder="Nom de la playlist (ex: Dossier Séries)"
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
                />
                <button
                  type="submit"
                  disabled={!newPlaylistName.trim()}
                  className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition shrink-0"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
