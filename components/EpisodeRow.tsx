'use client';

import React, { useState, useEffect } from 'react';
import { Episode, Playlist } from '@/types/podcast';
import { usePlayer } from '@/lib/playerContext';
import {
  Play,
  Pause,
  ListPlus,
  Zap,
  ZapOff,
  Loader2,
  Layers,
  FolderPlus,
  Check,
  Plus,
  Trash2,
  X,
  RotateCcw,
  Sparkles,
  Share2,
  MoreVertical,
  Radio,
} from 'lucide-react';
import { detectSeriesPart } from '@/lib/seriesDetector';
import {
  getPlaylists,
  addEpisodeToPlaylist,
  createPlaylist,
  getGlobalAdSettings,
  getPodcastSettings,
  savePodcastSettings,
  addEpisodeToDefaultPlaylist,
  DEFAULT_PLAYLIST_ID,
} from '@/lib/storage';
import { useLongPress } from '@/lib/useLongPress';

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
  const {
    currentEpisode,
    isPlaying,
    isLoadingAudio,
    playEpisode,
    restartEpisode,
    togglePlay,
    addToQueue,
  } = usePlayer();

  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [showActionModal, setShowActionModal] = useState(false);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [toastMsg, setToastMsg] = useState<string | null>(null);
  const [artworkError, setArtworkError] = useState(false);

  const artworkSrc = (!artworkError && (episode.artworkUrl || episode.podcastArtwork)) || undefined;
  const podcastName = episode.podcastTitle || '';

  // État dynamique du Stop-Pub pour ce podcast
  const [isAdBlockActive, setIsAdBlockActive] = useState<boolean>(() => {
    const g = getGlobalAdSettings();
    const p = getPodcastSettings(episode.podcastId);
    return g.enabled && p.adBlockEnabled !== false;
  });

  useEffect(() => {
    const updateAdStatus = () => {
      const g = getGlobalAdSettings();
      const p = getPodcastSettings(episode.podcastId);
      setIsAdBlockActive(g.enabled && p.adBlockEnabled !== false);
    };
    updateAdStatus();
    window.addEventListener('keokaster_podcast_settings_changed', updateAdStatus);
    return () => window.removeEventListener('keokaster_podcast_settings_changed', updateAdStatus);
  }, [episode.podcastId]);

  const isCurrent = currentEpisode?.id === episode.id;
  const isCurrentlyPlaying = isCurrent && isPlaying;
  const isCurrentlyBuffering = isCurrent && isLoadingAudio;
  const seriesInfo = detectSeriesPart(episode.title);

  // Détection d'appui long
  const { handlers: longPressHandlers, isLongPressActive } = useLongPress({
    delay: 480,
    onLongPress: () => {
      setShowActionModal(true);
    },
  });

  const handleRowClick = (e: React.MouseEvent) => {
    // Si l'appui long a été déclenché, ne pas lancer la lecture
    if (isLongPressActive()) {
      e.stopPropagation();
      return;
    }
    handlePlayClick(e);
  };

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

  const handleAddToDefaultDirect = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    const result = addEpisodeToDefaultPlaylist(episode);
    if (result.success) {
      setToastMsg(`⭐ Ajouté à « ${result.playlistName} » !`);
    } else {
      setToastMsg(`Déjà présent dans « ${result.playlistName} »`);
    }
    setTimeout(() => {
      setToastMsg(null);
      setShowPlaylistModal(false);
      setShowActionModal(false);
    }, 1800);
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

  const handleToggleAdBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const current = getPodcastSettings(episode.podcastId);
    const nextVal = current.adBlockEnabled === false;
    savePodcastSettings(episode.podcastId, { ...current, adBlockEnabled: nextVal });
    setIsAdBlockActive(nextVal);
    setToastMsg(
      nextVal
        ? '⚡ Stop-Pub réactivé pour cette émission'
        : '⏸️ Stop-Pub désactivé (pubs actives pour cette émission)'
    );
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleRestartFromBeginning = (e: React.MouseEvent) => {
    e.stopPropagation();
    restartEpisode(episode);
    setShowActionModal(false);
    setToastMsg('🔄 Épisode redémarré depuis le début (00:00) !');
    setTimeout(() => setToastMsg(null), 2500);
  };

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowActionModal(false);
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: episode.title,
          text: `Écouter ${episode.title} sur KeoKaster`,
          url: episode.audioUrl,
        });
        return;
      } catch {}
    }
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(episode.audioUrl);
      setToastMsg('📋 Lien direct copié dans le presse-papier !');
      setTimeout(() => setToastMsg(null), 2500);
    }
  };

  return (
    <>
      <div
        onClick={handleRowClick}
        {...longPressHandlers}
        className={`p-4 rounded-3xl border transition-all duration-200 flex items-center gap-4 cursor-pointer group select-none relative ${
          isCurrent
            ? 'bg-purple-950/40 border-purple-500/60 shadow-lg shadow-purple-950/40'
            : 'bg-slate-900/60 hover:bg-slate-900 border-slate-800/80 hover:border-slate-700'
        }`}
      >
        {/* GRAND BOUTON PLAY/PAUSE AVEC POCHETTE VISIBLE */}
        <button
          type="button"
          onClick={handlePlayClick}
          className={`w-14 h-14 sm:w-16 sm:h-16 rounded-2xl shrink-0 transition-transform active:scale-90 flex items-center justify-center shadow-lg relative overflow-hidden group/btn ${
            isCurrentlyPlaying
              ? 'ring-2 ring-purple-400 shadow-purple-600/50'
              : isCurrent
              ? 'ring-2 ring-purple-600 shadow-purple-700/40'
              : 'shadow-black/50 border border-slate-700/60'
          }`}
          title={isCurrentlyPlaying ? 'Mettre en pause' : 'Écouter'}
        >
          {artworkSrc ? (
            <img
              src={artworkSrc}
              alt={episode.title}
              onError={() => setArtworkError(true)}
              className="absolute inset-0 w-full h-full object-cover group-hover/btn:scale-105 transition duration-300"
              loading="lazy"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-tr from-purple-900 via-indigo-950 to-slate-900 flex items-center justify-center">
              <Radio className="w-6 h-6 text-purple-300/60" />
            </div>
          )}

          {/* OVERLAY SOMBRE ÉLÉGANT */}
          <div
            className={`absolute inset-0 transition-colors ${
              isCurrentlyPlaying
                ? 'bg-purple-950/60 backdrop-blur-[1px]'
                : 'bg-black/45 group-hover/btn:bg-black/35'
            }`}
          />

          {/* PASTILLE DE LECTURE CENTRÉE */}
          <div className="relative z-10 w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-slate-950/80 backdrop-blur-xs flex items-center justify-center text-white border border-white/20 shadow-md">
            {isCurrentlyBuffering ? (
              <Loader2 className="w-5 h-5 animate-spin text-white" />
            ) : isCurrentlyPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </div>
        </button>

        {/* CONTENU DE L'ÉPISODE */}
        <div className="min-w-0 flex-1 py-0.5">
          {podcastName && (
            <p className="text-[11px] font-extrabold text-purple-400 truncate mb-1 flex items-center gap-1.5">
              <Radio className="w-3 h-3 text-purple-400 shrink-0" />
              <span>{podcastName}</span>
            </p>
          )}

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

            {/* BADGE ANTI-PUB DYNAMIQUE & CLIQUABLE */}
            {isAdBlockActive ? (
              <button
                type="button"
                onClick={handleToggleAdBlock}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1 hover:bg-emerald-500/25 transition active:scale-95"
                title="Stop-Pub actif pour cette émission (Cliquer pour désactiver)"
              >
                <Zap className="w-3 h-3 fill-emerald-400" />
                <span>Anti-Pub</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={handleToggleAdBlock}
                className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400 border border-amber-500/30 flex items-center gap-1 hover:bg-amber-500/25 transition active:scale-95"
                title="Stop-Pub désactivé pour cette émission (Cliquer pour réactiver)"
              >
                <ZapOff className="w-3 h-3 text-amber-400" />
                <span>Pubs actives</span>
              </button>
            )}
          </div>

          <h4
            className={`text-sm sm:text-base font-bold leading-snug line-clamp-2 ${
              isCurrent ? 'text-purple-300 font-extrabold' : 'text-white group-hover:text-purple-200'
            } transition`}
          >
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
          {/* BOUTON PLAYLIST RAPIDE */}
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
              setToastMsg('➕ Ajouté à la file d\'attente !');
              setTimeout(() => setToastMsg(null), 1800);
            }}
            className="p-3 text-slate-400 hover:text-white rounded-2xl hover:bg-slate-800 transition active:scale-90"
            title="Ajouter à la file d'attente"
          >
            <ListPlus className="w-5 h-5" />
          </button>

          {/* BOUTON MENU APPUI LONG / OPTIONS */}
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setShowActionModal(true);
            }}
            className="p-3 text-slate-400 hover:text-white rounded-2xl hover:bg-slate-800 transition active:scale-90"
            title="Plus d'options (Appui long)"
          >
            <MoreVertical className="w-5 h-5" />
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

      {/* TOAST FLOTTANT LOCAL */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-purple-900/95 border border-purple-400/50 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 max-w-sm text-center">
          {toastMsg}
        </div>
      )}

      {/* MENU CONTEXTUEL / APPUI LONG */}
      {showActionModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowActionModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* EN-TÊTE DU MENU CONTEXTUEL */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-0.5">
                  Options de l'épisode
                </span>
                <h3 className="font-extrabold text-sm text-white line-clamp-2 leading-snug">
                  {episode.title}
                </h3>
                {episode.podcastTitle && (
                  <p className="text-xs text-slate-400 truncate mt-0.5">
                    {episode.podcastTitle}
                  </p>
                )}
              </div>
              <button
                type="button"
                onClick={() => setShowActionModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* LISTE DES ACTIONS DISPONIBLES */}
            <div className="space-y-1.5">
              {/* RECOMMENCER DEPUIS LE DÉBUT */}
              <button
                type="button"
                onClick={handleRestartFromBeginning}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    Recommencer depuis le début
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Remettre à 00:00 et relancer la lecture
                  </p>
                </div>
              </button>

              {/* AJOUTER À LA PLAYLIST PAR DÉFAUT EN 1 CLIC */}
              <button
                type="button"
                onClick={() => handleAddToDefaultDirect()}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    Ajouter à ma playlist par défaut
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Enregistre dans « Ma Playlist (Par défaut) » en 1 clic
                  </p>
                </div>
              </button>

              {/* CHOISIR UNE AUTRE PLAYLIST */}
              <button
                type="button"
                onClick={(e) => {
                  setShowActionModal(false);
                  handleOpenPlaylistModal(e);
                }}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-600/20 text-indigo-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <FolderPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    Ajouter à une autre playlist...
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Choisir parmi vos playlists ou en créer une
                  </p>
                </div>
              </button>

              {/* AJOUTER À LA FILE D'ATTENTE */}
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  addToQueue(episode);
                  setShowActionModal(false);
                  setToastMsg('➕ Ajouté à la file d\'attente !');
                  setTimeout(() => setToastMsg(null), 2000);
                }}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ListPlus className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    Ajouter à la file d'attente
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Écouter juste après l'épisode en cours
                  </p>
                </div>
              </button>

              {/* BASCULER STOP-PUB POUR CETTE ÉMISSION */}
              <button
                type="button"
                onClick={(e) => {
                  handleToggleAdBlock(e);
                  setShowActionModal(false);
                }}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition ${
                    isAdBlockActive
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isAdBlockActive ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    {isAdBlockActive
                      ? 'Désactiver Stop-Pub (Laisser les pubs)'
                      : 'Activer Stop-Pub (Saut automatique)'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAdBlockActive
                      ? 'Actuellement : Anti-pub actif'
                      : 'Actuellement : Pubs actives pour ce podcast'}
                  </p>
                </div>
              </button>

              {/* PARTAGER / COPIER LE LIEN */}
              <button
                type="button"
                onClick={handleShare}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    Partager / Copier le lien
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Copier le flux audio ou partager sur d'autres apps
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}

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

            {/* BOUTON RAPIDE : AJOUTER À LA PLAYLIST PAR DÉFAUT EN 1 CLIC */}
            <button
              type="button"
              onClick={() => handleAddToDefaultDirect()}
              className="w-full p-3 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-between shadow-lg shadow-purple-600/30 transition active:scale-95"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>Ajouter à la playlist par défaut</span>
              </div>
              <span className="text-[10px] bg-white/20 px-2 py-0.5 rounded-full font-bold">
                1 clic
              </span>
            </button>

            <div className="pt-1">
              <p className="text-[11px] font-bold text-slate-400 mb-2">
                Ou choisir une playlist spécifique :
              </p>

              {/* LISTE DES PLAYLISTS EXISTANTES */}
              <div className="max-h-48 overflow-y-auto space-y-1.5 scrollbar-thin">
                {playlists.length === 0 ? (
                  <p className="text-xs text-slate-400 text-center py-4">
                    Aucune playlist existante. Créez-en une ci-dessous !
                  </p>
                ) : (
                  playlists.map((pl) => {
                    const alreadyIn = pl.episodes.some((e) => e.id === episode.id);
                    const isDefault = pl.id === DEFAULT_PLAYLIST_ID;
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
                          <div className="flex items-center gap-1.5">
                            <p className="text-xs font-bold truncate">{pl.name}</p>
                            {isDefault && (
                              <span className="text-[9px] px-1.5 py-0.2 rounded-md bg-amber-500/20 text-amber-300 font-extrabold">
                                Par défaut
                              </span>
                            )}
                          </div>
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
