'use client';

import React, { useState, useEffect } from 'react';
import { getSubscribedPodcasts, togglePodcastSubscription, getPlaylists, deletePlaylist } from '@/lib/storage';
import { Podcast, Playlist } from '@/types/podcast';
import PodcastCard from '@/components/PodcastCard';
import EpisodeRow from '@/components/EpisodeRow';
import { usePlayer } from '@/lib/playerContext';
import {
  Library,
  ListMusic,
  Radio,
  Trash2,
  FolderPlus,
  Play,
  Plus,
  Clock,
  ArrowDownToLine,
  HardDriveDownload,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import PodcastImportModal from '@/components/PodcastImportModal';
import {
  getDownloadedEpisodes,
  deleteDownloadedEpisode,
  formatBytes,
  DownloadedItem,
} from '@/lib/offlineStorage';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'subs' | 'playlists' | 'queue' | 'downloads'>('subs');
  const [subscriptions, setSubscriptions] = useState<Podcast[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [offlineItems, setOfflineItems] = useState<DownloadedItem[]>([]);
  const [showImportModal, setShowImportModal] = useState(false);
  const { queue, removeFromQueue, playSeries } = usePlayer();

  const refreshData = () => {
    setSubscriptions(getSubscribedPodcasts());
    setPlaylists(getPlaylists());
    getDownloadedEpisodes().then((items) => {
      setOfflineItems(items || []);
    });
  };

  useEffect(() => {
    refreshData();
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const tab = params.get('tab');
      if (tab === 'queue' || tab === 'playlists' || tab === 'subs' || tab === 'downloads') {
        setActiveTab(tab as any);
      }
    }
    window.addEventListener('keokaster_subs_changed', refreshData);
    window.addEventListener('keokaster_playlists_changed', refreshData);
    window.addEventListener('keokaster_offline_changed', refreshData);
    return () => {
      window.removeEventListener('keokaster_subs_changed', refreshData);
      window.removeEventListener('keokaster_playlists_changed', refreshData);
      window.removeEventListener('keokaster_offline_changed', refreshData);
    };
  }, []);

  const handleToggleSub = (p: Podcast, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePodcastSubscription(p);
    setSubscriptions(getSubscribedPodcasts());
  };

  const totalOfflineBytes = offlineItems.reduce((acc, it) => acc + (it.sizeBytes || 0), 0);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white">
            Ma Bibliothèque
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Vos abonnements, playlists, écoutes hors-ligne et file d'attente.
          </p>
        </div>

        <button
          type="button"
          onClick={() => setShowImportModal(true)}
          className="px-3.5 sm:px-4 py-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md shadow-purple-600/30 active:scale-95 shrink-0"
          title="Rapatrier des abonnements depuis Spotify, Apple Podcasts, Pocket Casts, etc."
        >
          <HardDriveDownload className="w-4 h-4" />
          <span>Rapatrier mes podcasts</span>
        </button>
      </div>

      {/* ONGLETS */}
      <div className="flex border-b border-slate-800 gap-4 overflow-x-auto scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('subs')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'subs'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <Library className="w-4 h-4" />
          <span>Abonnements ({subscriptions.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('playlists')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'playlists'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <FolderPlus className="w-4 h-4" />
          <span>Playlists ({playlists.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('downloads')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'downloads'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ArrowDownToLine className="w-4 h-4" />
          <span>Hors-ligne ({offlineItems.length})</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'queue'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>File d'attente ({queue.length})</span>
        </button>
      </div>

      {/* ONGLET 1 : ABONNEMENTS */}
      {activeTab === 'subs' && (
        <div>
          {subscriptions.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6 space-y-3">
              <Radio className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Aucun abonnement pour le moment</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Explorez l'annuaire ou collez un flux RSS pour suivre vos émissions favorites.
              </p>
              <Link
                href="/search"
                className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/30"
              >
                Explorer des podcasts
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
              {subscriptions.map((podcast) => (
                <PodcastCard
                  key={podcast.id}
                  podcast={podcast}
                  isSubscribed={true}
                  onToggleSubscribe={(e) => handleToggleSub(podcast, e)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 2 : PLAYLISTS */}
      {activeTab === 'playlists' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {playlists.length} playlist{playlists.length > 1 ? 's' : ''} créée{playlists.length > 1 ? 's' : ''}
            </span>
            <Link
              href="/playlists"
              className="text-xs font-bold text-purple-400 hover:text-purple-300 transition flex items-center gap-1"
            >
              <span>Gérer les playlists</span>
              <span>→</span>
            </Link>
          </div>

          {playlists.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6 space-y-3">
              <FolderPlus className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Aucune playlist pour le moment</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Créez vos sélections personnalisées et écoutez vos séries d'épisodes préférés.
              </p>
              <Link
                href="/playlists"
                className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-500 text-white rounded-xl text-xs font-bold transition shadow-md shadow-purple-600/30"
              >
                Créer une playlist
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
              {playlists.map((pl) => (
                <div
                  key={pl.id}
                  className="p-4 rounded-3xl bg-slate-900/70 border border-slate-800 flex items-center justify-between gap-3 shadow-md"
                >
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300">
                      {pl.episodes.length} épisode{pl.episodes.length > 1 ? 's' : ''}
                    </span>
                    <h3 className="font-extrabold text-sm sm:text-base text-white mt-1 truncate">
                      {pl.name}
                    </h3>
                    {pl.description && (
                      <p className="text-xs text-slate-400 truncate mt-0.5">
                        {pl.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    {pl.episodes.length > 0 && (
                      <button
                        type="button"
                        onClick={() => playSeries(pl.episodes)}
                        className="p-2.5 rounded-2xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white hover:from-purple-500 hover:to-indigo-500 transition shadow-md shadow-purple-600/30"
                        title="Tout écouter"
                      >
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      </button>
                    )}
                    <Link
                      href="/playlists"
                      className="p-2.5 rounded-2xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition text-xs font-bold"
                      title="Ouvrir la playlist"
                    >
                      Ouvrir
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ONGLET 3 : QUEUE */}
      {activeTab === 'queue' && (
        <div>
          {queue.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6 space-y-2">
              <ListMusic className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">File d'attente vide</h3>
              <p className="text-xs text-slate-400">
                Ajoutez des épisodes à votre file pour qu'ils s'enchaînent automatiquement.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {queue.map((ep) => (
                <div key={ep.id} className="relative group/q">
                  <EpisodeRow episode={ep} />
                  <button
                    type="button"
                    onClick={() => removeFromQueue(ep.id)}
                    className="absolute right-3 top-3 p-1.5 bg-slate-900/90 text-slate-400 hover:text-red-400 border border-slate-700 rounded-xl transition"
                    title="Retirer de la file"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ONGLET HORS-LIGNE (TÉLÉCHARGEMENTS) */}
      {activeTab === 'downloads' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
              {offlineItems.length} épisode{offlineItems.length > 1 ? 's' : ''} hors-ligne ({formatBytes(totalOfflineBytes)})
            </span>
            {offlineItems.length > 0 && (
              <button
                type="button"
                onClick={() => playSeries(offlineItems.map((it) => it.episode))}
                className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-md shadow-purple-600/30 active:scale-95"
              >
                <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                <span>Tout écouter hors-ligne</span>
              </button>
            )}
          </div>

          {offlineItems.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6 space-y-3">
              <ArrowDownToLine className="w-10 h-10 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">Aucun épisode téléchargé</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto leading-relaxed">
                Téléchargez vos émissions préférées pour les écouter en avion, dans le train ou en zone blanche sans consommer votre forfait mobile.
              </p>
              <p className="text-[11px] text-slate-500">
                Touchez l'icône de téléchargement (↓) sur n'importe quel épisode pour l'enregistrer hors-ligne.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {offlineItems.map((it) => (
                <div key={it.id} className="relative">
                  <EpisodeRow episode={it.episode} />
                  <div className="absolute right-14 top-2 text-[10px] font-mono text-emerald-400/80 bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20 pointer-events-none hidden sm:block">
                    {formatBytes(it.sizeBytes)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* MODALE DE RAPATRIEMENT DE PODCASTS */}
      <PodcastImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportSuccess={refreshData}
      />
    </div>
  );
}
