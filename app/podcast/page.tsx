'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { fetchAndParsePodcast } from '@/lib/rssParser';
import { Podcast, Episode, PodcastSettings } from '@/types/podcast';
import EpisodeRow from '@/components/EpisodeRow';
import {
  isPodcastSubscribed,
  togglePodcastSubscription,
  getPodcastSettings,
  savePodcastSettings,
} from '@/lib/storage';
import { usePlayer } from '@/lib/playerContext';
import {
  Loader2,
  Plus,
  Check,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Radio,
  Share2,
  Play,
  Pause,
} from 'lucide-react';

function PodcastContent() {
  const searchParams = useSearchParams();
  const feedUrl = searchParams.get('feed');

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<PodcastSettings>({
    autoSkipIntroSec: 30,
    autoSkipOutroSec: 30,
    adBlockEnabled: true,
  });

  const { currentEpisode, isPlaying, isLoadingAudio, playEpisode, togglePlay } = usePlayer();
  const latestEpisode = episodes.length > 0 ? episodes[0] : null;
  const isPlayingLatest = latestEpisode && currentEpisode?.id === latestEpisode.id && isPlaying;
  const isBufferingLatest = latestEpisode && currentEpisode?.id === latestEpisode.id && isLoadingAudio;

  useEffect(() => {
    if (!feedUrl) {
      setError('Aucun flux de podcast spécifié.');
      setLoading(false);
      return;
    }

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const { podcast: p, episodes: eps } = await fetchAndParsePodcast(feedUrl!);
        setPodcast(p);
        setEpisodes(eps);
        setIsSubscribed(isPodcastSubscribed(p.id));
        setSettings(getPodcastSettings(p.id));
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les épisodes de ce podcast.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [feedUrl]);

  const handleToggleSub = () => {
    if (!podcast) return;
    const subbed = togglePodcastSubscription(podcast);
    setIsSubscribed(subbed);
  };

  const handleUpdateSettings = (updates: Partial<PodcastSettings>) => {
    if (!podcast) return;
    const next = { ...settings, ...updates };
    setSettings(next);
    savePodcastSettings(podcast.id, next);
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-3">
        <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        <p className="text-xs font-semibold text-slate-400">Chargement des épisodes...</p>
      </div>
    );
  }

  if (error || !podcast) {
    return (
      <div className="p-6 bg-slate-900/60 rounded-3xl border border-slate-800 text-center max-w-md mx-auto my-12 space-y-3">
        <Radio className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-sm font-bold text-white">Erreur de chargement</h2>
        <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* EN-TÊTE DU PODCAST */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-5 sm:p-6 flex flex-col sm:flex-row gap-5 items-start">
        {/* POCHETTE */}
        <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700/60 shadow-xl shadow-purple-950/30">
          {podcast.artworkUrl ? (
            <img src={podcast.artworkUrl} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-purple-800 to-indigo-900" />
          )}
        </div>

        {/* DÉTAILS & BOUTONS */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <Zap className="w-2.5 h-2.5 fill-emerald-400" />
              <span>Anti-Pub Actif</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">
              {episodes.length} épisode(s)
            </span>
          </div>

          <h1 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">
            {podcast.title}
          </h1>
          <p className="text-xs font-semibold text-purple-300">
            {podcast.author}
          </p>

          <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">
            {podcast.description}
          </p>

          <div className="pt-2 flex items-center gap-3 flex-wrap">
            {latestEpisode && (
              <button
                type="button"
                onClick={() => {
                  if (currentEpisode?.id === latestEpisode.id) {
                    togglePlay();
                  } else {
                    playEpisode(latestEpisode);
                  }
                }}
                className="px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 active:scale-95 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30"
              >
                {isBufferingLatest ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isPlayingLatest ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
                <span>{isPlayingLatest ? 'Pause' : 'Écouter le dernier épisode'}</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleToggleSub}
              className={`px-4 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-md ${
                isSubscribed
                  ? 'bg-purple-600/30 text-purple-300 border border-purple-500/50'
                  : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
              }`}
            >
              {isSubscribed ? <Check className="w-3.5 h-3.5 text-purple-300" /> : <Plus className="w-3.5 h-3.5" />}
              <span>{isSubscribed ? 'Abonné' : "S'abonner"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowSettings(!showSettings)}
              className="px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 border border-slate-700/60"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Réglages Anti-Pub</span>
              {showSettings ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>
      </div>

      {/* PANNEAU DE RÉGLAGE ANTI-PUB DÉDIÉ À CE PODCAST */}
      {showSettings && (
        <div className="bg-slate-900 border border-purple-500/30 rounded-2xl p-4 space-y-4 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between border-b border-slate-800 pb-2">
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                Paramètres Anti-Pub pour ce podcast
              </h3>
            </div>
            <label className="flex items-center gap-2 cursor-pointer">
              <span className="text-[11px] text-slate-400">ZeroPub activé</span>
              <input
                type="checkbox"
                checked={settings.adBlockEnabled}
                onChange={(e) => handleUpdateSettings({ adBlockEnabled: e.target.checked })}
                className="w-4 h-4 accent-purple-500 rounded"
              />
            </label>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Sauter l'introduction (secondes) :
              </label>
              <div className="flex items-center gap-2">
                {[0, 15, 30, 45, 60, 90].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleUpdateSettings({ autoSkipIntroSec: sec })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      settings.autoSkipIntroSec === sec
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Sauter la fin d'épisode (secondes) :
              </label>
              <div className="flex items-center gap-2">
                {[0, 15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleUpdateSettings({ autoSkipOutroSec: sec })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      settings.autoSkipOutroSec === sec
                        ? 'bg-purple-600 text-white'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {sec}s
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* LISTE DES ÉPISODES */}
      <div className="space-y-3">
        <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
          Tous les épisodes ({episodes.length})
        </h2>

        <div className="space-y-2">
          {episodes.map((ep) => (
            <EpisodeRow key={ep.id} episode={ep} />
          ))}
        </div>
      </div>
    </div>
  );
}

export default function PodcastPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col items-center justify-center py-24 space-y-3">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
          <p className="text-xs font-semibold text-slate-400">Chargement...</p>
        </div>
      }
    >
      <PodcastContent />
    </Suspense>
  );
}
