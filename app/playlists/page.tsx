'use client';

import React, { useState, useEffect } from 'react';
import { Playlist, Episode } from '@/types/podcast';
import {
  getPlaylists,
  createPlaylist,
  deletePlaylist,
  removeEpisodeFromPlaylist,
  DEFAULT_PLAYLIST_ID,
} from '@/lib/storage';
import { usePlayer } from '@/lib/playerContext';
import EpisodeRow from '@/components/EpisodeRow';
import { ListMusic, Plus, Play, Trash2, ChevronDown, ChevronUp, FolderPlus, Clock, Sparkles } from 'lucide-react';

export default function PlaylistsPage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [toast, setToast] = useState<string | null>(null);

  const { playSeries, enqueueSeries } = usePlayer();

  const refreshPlaylists = () => {
    setPlaylists(getPlaylists());
  };

  useEffect(() => {
    refreshPlaylists();
    window.addEventListener('keokaster_playlists_changed', refreshPlaylists);
    return () => window.removeEventListener('keokaster_playlists_changed', refreshPlaylists);
  }, []);

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    const pl = createPlaylist(name.trim(), description.trim());
    setName('');
    setDescription('');
    setShowCreateForm(false);
    setExpandedId(pl.id);
    setToast(`Playlist « ${pl.name} » créée !`);
    setTimeout(() => setToast(null), 3000);
  };

  const handleDelete = (id: string, plName: string) => {
    const isDefault = id === DEFAULT_PLAYLIST_ID;
    const confirmMsg = isDefault
      ? `Vider tous les épisodes de votre playlist par défaut « ${plName} » ?`
      : `Supprimer la playlist « ${plName} » ?`;

    if (confirm(confirmMsg)) {
      deletePlaylist(id);
      if (isDefault) {
        refreshPlaylists();
        setToast(`Playlist par défaut vidée.`);
      } else {
        if (expandedId === id) setExpandedId(null);
        setToast(`Playlist « ${plName} » supprimée.`);
      }
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handlePlayAll = (pl: Playlist) => {
    if (pl.episodes.length === 0) return;
    playSeries(pl.episodes);
    setToast(`▶️ Lecture de la playlist « ${pl.name} » commencée !`);
    setTimeout(() => setToast(null), 3500);
  };

  const handleEnqueueAll = (pl: Playlist) => {
    if (pl.episodes.length === 0) return;
    enqueueSeries(pl.episodes);
    setToast(`➕ ${pl.episodes.length} épisodes ajoutés à votre file d'attente !`);
    setTimeout(() => setToast(null), 3500);
  };

  const formatTotalDuration = (episodes: Episode[]): string => {
    const totalSec = episodes.reduce((acc, ep) => acc + (ep.durationSec || 0), 0);
    if (!totalSec) return '';
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    if (h > 0) return `${h}h ${m}m`;
    return `${m} min`;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <ListMusic className="w-6 h-6 text-purple-400" />
            <span>Mes Playlists</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Créez vos sélections sur-mesure et écoutez vos épisodes en continu sans publicité.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-3.5 sm:px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95"
        >
          <Plus className="w-4 h-4" />
          <span>Nouvelle Playlist</span>
        </button>
      </div>

      {toast && (
        <div className="p-3 rounded-2xl bg-purple-600/20 border border-purple-500/40 text-purple-200 text-xs font-bold text-center animate-in fade-in">
          {toast}
        </div>
      )}

      {/* FORMULAIRE NOUVELLE PLAYLIST */}
      {showCreateForm && (
        <form
          onSubmit={handleCreate}
          className="bg-slate-900 border border-purple-500/40 p-4 sm:p-5 rounded-3xl space-y-3 shadow-xl animate-in slide-in-from-top-2"
        >
          <div className="flex items-center gap-2">
            <FolderPlus className="w-4 h-4 text-purple-400" />
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-white">
              Créer une nouvelle sélection
            </h3>
          </div>

          <div className="space-y-2">
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Titre de la playlist (ex: Dossier True Crime, Trajet Matin...)"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              autoFocus
            />
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Description optionnelle"
              className="w-full px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-1">
            <button
              type="button"
              onClick={() => setShowCreateForm(false)}
              className="px-3 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={!name.trim()}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-bold transition shadow-md shadow-purple-600/30"
            >
              Créer la playlist
            </button>
          </div>
        </form>
      )}

      {/* LISTE DES PLAYLISTS */}
      {playlists.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6 sm:p-8 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
            <ListMusic className="w-7 h-7" />
          </div>
          <h3 className="text-base font-extrabold text-white">
            Aucune playlist pour le moment
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
            Organisez vos écoutes en playlists thématiques. Vous pouvez ajouter des épisodes depuis n'importe quel podcast avec le bouton « Dossier (+) ».
          </p>
          <button
            type="button"
            onClick={() => setShowCreateForm(true)}
            className="mt-2 inline-flex items-center gap-1.5 px-4 py-2.5 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/30"
          >
            <Plus className="w-4 h-4" />
            <span>Créer ma première playlist</span>
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {playlists.map((pl) => {
            const isExpanded = expandedId === pl.id;
            const totalDuration = formatTotalDuration(pl.episodes);

            return (
              <div
                key={pl.id}
                className="bg-slate-900/70 border border-slate-800/80 rounded-3xl overflow-hidden shadow-lg transition"
              >
                {/* EN-TÊTE DE LA PLAYLIST */}
                <div className="p-4 sm:p-5 flex items-center justify-between gap-3">
                  <div
                    className="min-w-0 flex-1 cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : pl.id)}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      {pl.id === DEFAULT_PLAYLIST_ID && (
                        <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-amber-400" />
                          <span>Par défaut</span>
                        </span>
                      )}
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                        {pl.episodes.length} épisode{pl.episodes.length > 1 ? 's' : ''}
                      </span>
                      {totalDuration && (
                        <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-500" />
                          <span>{totalDuration}</span>
                        </span>
                      )}
                    </div>

                    <h2 className="text-base sm:text-lg font-extrabold text-white mt-1 truncate">
                      {pl.name}
                    </h2>

                    {pl.description && (
                      <p className="text-xs text-slate-400 mt-0.5 line-clamp-1">
                        {pl.description}
                      </p>
                    )}
                  </div>

                  {/* BOUTONS D'ACTION */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {pl.episodes.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={() => handlePlayAll(pl)}
                          className="px-3.5 py-2 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95"
                          title="Tout écouter"
                        >
                          <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                          <span className="hidden sm:inline">Tout écouter</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleEnqueueAll(pl)}
                          className="hidden xs:flex px-2.5 py-2 rounded-2xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-bold transition items-center gap-1 active:scale-95 border border-slate-700"
                          title="Ajouter tous les épisodes à la file d'attente"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>File</span>
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      onClick={() => handleDelete(pl.id, pl.name)}
                      className="p-2.5 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-2xl transition"
                      title={pl.id === DEFAULT_PLAYLIST_ID ? 'Vider la playlist par défaut' : 'Supprimer la playlist'}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : pl.id)}
                      className="p-2.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded-2xl transition"
                      title={isExpanded ? 'Masquer les épisodes' : 'Voir les épisodes'}
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* CONTENU DE LA PLAYLIST (ÉPISODES) */}
                {isExpanded && (
                  <div className="border-t border-slate-800 bg-slate-950/60 p-3 sm:p-4 space-y-2">
                    {pl.episodes.length === 0 ? (
                      <div className="text-center py-8 text-slate-400 space-y-2">
                        <Sparkles className="w-8 h-8 text-purple-400/50 mx-auto" />
                        <p className="text-xs font-semibold">Cette playlist est vide.</p>
                        <p className="text-[11px] text-slate-500">
                          Naviguez sur un podcast et touchez l'icône Dossier (+) d'un épisode pour l'ajouter ici.
                        </p>
                      </div>
                    ) : (
                      pl.episodes.map((ep) => (
                        <EpisodeRow
                          key={ep.id}
                          episode={ep}
                          onRemoveFromPlaylist={() => removeEpisodeFromPlaylist(pl.id, ep.id)}
                        />
                      ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
