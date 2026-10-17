'use client';

import React, { useState, useEffect } from 'react';
import { getSubscribedPodcasts, togglePodcastSubscription } from '@/lib/storage';
import { Podcast } from '@/types/podcast';
import PodcastCard from '@/components/PodcastCard';
import EpisodeRow from '@/components/EpisodeRow';
import { usePlayer } from '@/lib/playerContext';
import { Library, ListMusic, Radio, Trash2 } from 'lucide-react';
import Link from 'next/link';

export default function LibraryPage() {
  const [activeTab, setActiveTab] = useState<'subs' | 'queue'>('subs');
  const [subscriptions, setSubscriptions] = useState<Podcast[]>([]);
  const { queue, removeFromQueue } = usePlayer();

  useEffect(() => {
    const update = () => setSubscriptions(getSubscribedPodcasts());
    update();
    window.addEventListener('keokaster_subs_changed', update);
    return () => window.removeEventListener('keokaster_subs_changed', update);
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
          Vos abonnements et votre file d'attente hors-ligne.
        </p>
      </div>

      {/* ONGLETS */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          type="button"
          onClick={() => setActiveTab('subs')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
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
          onClick={() => setActiveTab('queue')}
          className={`pb-3 text-xs sm:text-sm font-bold border-b-2 transition flex items-center gap-2 ${
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

      {/* ONGLET 2 : QUEUE */}
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
