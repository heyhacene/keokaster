'use client';

import React, { useState, useEffect } from 'react';
import { getSubscribedPodcasts, togglePodcastSubscription, getPlaylists, deletePlaylist } from '@/lib/storage';
import { Podcast, Playlist } from '@/types/podcast';
import PodcastCard from '@/components/PodcastCard';
import EpisodeRow from '@/components/EpisodeRow';
import { usePlayer } from '@/lib/playerContext';
import { Library, ListMusic, Radio, Trash2, FolderPlus, Play, Plus, Clock } from 'lucide-react';
import Link from 'next/link';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'subs' | 'playlists' | 'queue'>('subs');
  const [subscriptions, setSubscriptions] = useState<Podcast[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const { queue, removeFromQueue, playSeries } = usePlayer();

  const refreshData = () => {
    setSubscriptions(getSubscribedPodcasts());
    setPlaylists(getPlaylists());
  };

  useEffect(() => {
    refreshData();
    window.addEventListener('keokaster_subs_changed', refreshData);
    window.addEventListener('keokaster_playlists_changed', refreshData);
    return () => {
      window.removeEventListener('keokaster_subs_changed', refreshData);
      window.removeEventListener('keokaster_playlists_changed', refreshData);
    };
  }, []);

  const handleToggleSub = (p: Podcast, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    togglePodcastSubscription(p);
    setSubscriptions(getSubscribedPodcasts());
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">
          Ma Bibliothèque
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Vos abonnements, playlists personnalisées et file d'attente.
        </p>
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
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 shrink-0 ${
            activeTab === 'queue'
              ? 'border-purple-500 text-purple-400'
              : 'border-transparent text-slate-400 hover:text-white'
          }`}
        >
          <ListMusic className="w-4 h-4" />
          <span>À écouter ensuite ({queue.length})</span>
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
    </div>
  );
}
