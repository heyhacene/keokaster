'use client';

import React, { useState, useEffect } from 'react';
import { TRENDING_PODCASTS, SearchResultItem } from '@/lib/podcastSearch';
import PodcastCard from '@/components/PodcastCard';
import { usePlayer } from '@/lib/playerContext';
import { getSubscribedPodcasts, togglePodcastSubscription, isPodcastSubscribed, getCanonicalPodcastId } from '@/lib/storage';
import { Radio, Zap, Play, Rss, ArrowRight, Sparkles, ShieldCheck, Library } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function HomePage() {
  const router = useRouter();
  const { currentEpisode, isPlaying, togglePlay, openFullPlayer } = usePlayer();
  const [rssInput, setRssInput] = useState('');
  const [subsMap, setSubsMap] = useState<Record<string, boolean>>({});
  const [subsCount, setSubsCount] = useState<number>(0);

  const refreshSubs = () => {
    const subs = getSubscribedPodcasts();
    setSubsCount(subs.length);
    const map: Record<string, boolean> = {};
    subs.forEach((s) => {
      map[s.id] = true;
      if (s.feedUrl) {
        map[s.feedUrl] = true;
        map[getCanonicalPodcastId(s.feedUrl)] = true;
      }
    });
    setSubsMap(map);
  };

  useEffect(() => {
    refreshSubs();
    window.addEventListener('keokaster_subs_changed', refreshSubs);
    return () => window.removeEventListener('keokaster_subs_changed', refreshSubs);
  }, []);

  const handleCustomRssSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rssInput.trim()) return;
    router.push(`/podcast?feed=${encodeURIComponent(rssInput.trim())}`);
  };

  const handleToggleSub = (p: SearchResultItem, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const isNowSub = togglePodcastSubscription({
      id: p.id,
      title: p.title,
      author: p.author,
      description: p.description,
      feedUrl: p.feedUrl,
      artworkUrl: p.artworkUrl,
      categories: p.categories,
    });
    const cId = getCanonicalPodcastId(p.feedUrl);
    setSubsMap((prev) => ({
      ...prev,
      [p.id]: isNowSub,
      [p.feedUrl]: isNowSub,
      [cId]: isNowSub,
    }));
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* BANNIÈRE DE BIENVENUE & TECHNOLOGIE ZERO-PUB */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-900/60 via-slate-900 to-indigo-950 border border-purple-500/30 p-6 sm:p-8 shadow-2xl shadow-purple-950/40">
        <div className="relative z-10 max-w-xl space-y-3">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold">
            <Zap className="w-3.5 h-3.5 fill-emerald-400" />
            <span>Moteur ZeroPub Intégré</span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight leading-tight">
            Écoutez vos podcasts préférés, <span className="bg-gradient-to-r from-purple-400 via-amber-300 to-emerald-400 bg-clip-text text-transparent">sans les tunnels de pubs.</span>
          </h1>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Keo Kaster détecte automatiquement les sponsors, intros récurrentes et coupures publicitaires pour les sauter à la seconde près.
          </p>

          <div className="pt-2 flex items-center gap-2.5 flex-wrap">
            <Link
              href="/search"
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition flex items-center gap-2 shadow-lg shadow-purple-600/30 active:scale-95"
            >
              <span>Rechercher</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/library"
              className="px-4 py-2.5 rounded-xl bg-purple-950/60 hover:bg-purple-900/80 text-purple-200 hover:text-white border border-purple-500/50 font-bold text-xs transition flex items-center gap-2 shadow-sm active:scale-95"
            >
              <Library className="w-4 h-4 text-purple-300" />
              <span>Ma Bibliothèque</span>
              {subsCount > 0 && (
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded-full bg-purple-500/40 text-white font-bold">
                  {subsCount}
                </span>
              )}
            </Link>
            <Link
              href="/settings"
              className="px-3.5 py-2.5 rounded-xl bg-slate-900/80 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 font-bold text-xs transition"
            >
              Anti-Pub
            </Link>
          </div>
        </div>

        {/* CERCLES DÉCORATIFS EN ARRIÈRE-PLAN */}
        <div className="absolute -right-12 -bottom-12 w-64 h-64 rounded-full bg-purple-600/10 blur-3xl pointer-events-none" />
        <div className="absolute right-20 top-0 w-48 h-48 rounded-full bg-amber-500/10 blur-2xl pointer-events-none" />
      </div>

      {/* GROS BOUTON CARTE MA BIBLIOTHÈQUE */}
      <Link
        href="/library"
        className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/40 via-slate-900/80 to-indigo-950/40 border border-purple-500/30 hover:border-purple-500/60 transition-all flex items-center justify-between gap-4 group shadow-xl active:scale-[0.99]"
      >
        <div className="flex items-center gap-3.5 min-w-0">
          <div className="w-12 h-12 rounded-2xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center text-purple-300 group-hover:scale-105 transition shadow-inner shrink-0">
            <Library className="w-6 h-6 text-purple-400" />
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-sm sm:text-base font-extrabold text-white group-hover:text-purple-300 transition">
                Ma Bibliothèque
              </h3>
              {subsCount > 0 && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30">
                  {subsCount} podcast{subsCount > 1 ? 's' : ''} suivi{subsCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5 truncate">
              Retrouvez tous vos abonnements et vos épisodes en attente
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-purple-600/20 group-hover:bg-purple-600 text-purple-300 group-hover:text-white text-xs font-bold transition shrink-0 border border-purple-500/30">
          <span>Ouvrir</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </Link>

      {/* REPRENDRE L'ÉCOUTE (SI UN ÉPISODE EST CHARGÉ) */}
      {currentEpisode && (
        <div className="p-4 rounded-2xl bg-purple-950/20 border border-purple-500/30 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700">
              {currentEpisode.podcastArtwork && (
                <img src={currentEpisode.podcastArtwork} alt="" className="w-full h-full object-cover" />
              )}
            </div>
            <div className="min-w-0">
              <span className="text-[10px] font-bold uppercase text-purple-400 block">
                Reprendre l'écoute
              </span>
              <h3 className="text-xs sm:text-sm font-bold text-white truncate">
                {currentEpisode.title}
              </h3>
              <p className="text-[11px] text-slate-400 truncate">
                {currentEpisode.podcastTitle}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={togglePlay}
              className="p-3 bg-purple-600 hover:bg-purple-500 text-white rounded-xl shadow-md transition active:scale-95"
            >
              <Play className={`w-4 h-4 fill-white ${isPlaying ? 'opacity-0' : 'opacity-100 ml-0.5'}`} />
            </button>
            <button
              type="button"
              onClick={openFullPlayer}
              className="px-3 py-2 bg-slate-900 border border-slate-700 hover:bg-slate-800 text-xs font-bold text-slate-200 rounded-xl transition"
            >
              Ouvrir
            </button>
          </div>
        </div>
      )}

      {/* RECHERCHE / AJOUT DIRECT DE FLUX RSS */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 mb-2">
          <Rss className="w-4 h-4 text-amber-400" />
          <h2 className="text-sm font-bold text-white">Ajouter un flux RSS personnalisé</h2>
        </div>
        <p className="text-xs text-slate-400 mb-3">
          Collez n'importe quel flux RSS de podcast (Patreon, Substack, média indépendant) pour l'écouter sans publicité :
        </p>

        <form onSubmit={handleCustomRssSubmit} className="flex gap-2">
          <input
            type="url"
            value={rssInput}
            onChange={(e) => setRssInput(e.target.value)}
            placeholder="https://exemple.fr/feed.xml"
            className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
          />
          <button
            type="submit"
            className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition shrink-0 active:scale-95"
          >
            Charger
          </button>
        </form>
      </div>

      {/* PODCASTS TENDANCES EN FRANCE */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Radio className="w-4 h-4 text-purple-400" />
            <h2 className="text-base sm:text-lg font-bold text-white">Podcasts Tendances</h2>
          </div>
          <Link href="/search" className="text-xs font-bold text-purple-400 hover:text-purple-300">
            Explorer tout &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          {TRENDING_PODCASTS.map((podcast) => (
            <PodcastCard
              key={podcast.id}
              podcast={podcast}
              isSubscribed={Boolean(subsMap[podcast.id])}
              onToggleSubscribe={(e) => handleToggleSub(podcast, e)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
