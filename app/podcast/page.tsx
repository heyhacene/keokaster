'use client';

import React, { useState, useEffect, useMemo, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
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
import { detectSeriesGroups, sortEpisodes, SeriesGroup } from '@/lib/seriesDetector';
import { detectDAINetwork } from '@/lib/aiAdAnalyzer';
import {
  Loader2,
  Plus,
  Check,
  Zap,
  SlidersHorizontal,
  ChevronDown,
  ChevronUp,
  Radio,
  Play,
  Pause,
  ArrowLeft,
  Search as SearchIcon,
  Layers,
  ArrowDown,
  ArrowUp,
  ListOrdered,
  CheckCircle2,
  ListPlus,
} from 'lucide-react';

function PodcastContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const feedUrl = searchParams.get('feed');

  const [podcast, setPodcast] = useState<Podcast | null>(null);
  const [episodes, setEpisodes] = useState<Episode[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [episodeSearch, setEpisodeSearch] = useState('');
  const [visibleCount, setVisibleCount] = useState(30);
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest' | 'series'>('newest');
  const [activeSeriesIndex, setActiveSeriesIndex] = useState(0);
  const [seriesToast, setSeriesToast] = useState<string | null>(null);

  const [settings, setSettings] = useState<PodcastSettings>({
    autoSkipIntroSec: 30,
    autoSkipOutroSec: 30,
    adBlockEnabled: true,
  });

  const daiInfo = useMemo(() => {
    if (!podcast) return null;
    const sampleAudio = episodes[0]?.audioUrl;
    return detectDAINetwork(sampleAudio, podcast.feedUrl, podcast.title, podcast.author);
  }, [podcast, episodes]);

  const {
    currentEpisode,
    isPlaying,
    isLoadingAudio,
    playEpisode,
    togglePlay,
    playSeries,
    enqueueSeries,
  } = usePlayer();

  const handleBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) {
      router.back();
    } else {
      router.push('/search');
    }
  };

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
        setIsSubscribed(isPodcastSubscribed(p.id) || isPodcastSubscribed(p.feedUrl));
        const pSettings = getPodcastSettings(p.id);
        setSettings(pSettings);
        if (pSettings.sortOrder) {
          setSortOrder(pSettings.sortOrder);
        }
      } catch (err: any) {
        setError(err.message || 'Impossible de charger les épisodes de ce podcast.');
      } finally {
        setLoading(false);
      }
    }

    load();
  }, [feedUrl]);

  useEffect(() => {
    if (!podcast) return;
    const onSubsChanged = () => {
      setIsSubscribed(isPodcastSubscribed(podcast.id) || isPodcastSubscribed(podcast.feedUrl));
    };
    window.addEventListener('keokaster_subs_changed', onSubsChanged);
    return () => window.removeEventListener('keokaster_subs_changed', onSubsChanged);
  }, [podcast]);

  const handleToggleSub = () => {
    if (!podcast) return;
    const subbed = togglePodcastSubscription(podcast);
    setIsSubscribed(subbed);
  };

  const handleUpdateSettings = (updates: Partial<PodcastSettings>) => {
    if (!podcast) return;
    const next = { ...settings, ...updates };
    setSettings(next);
    savePodcastSettings(podcast.id, next, podcast.feedUrl);
  };

  const handleSortChange = (newOrder: 'newest' | 'oldest' | 'series') => {
    setSortOrder(newOrder);
    handleUpdateSettings({ sortOrder: newOrder });
  };

  // Détection automatique des sagas et séries multi-parties (1/4, 2/4...)
  const detectedSeriesList: SeriesGroup[] = useMemo(() => {
    return detectSeriesGroups(episodes);
  }, [episodes]);

  const activeSeries = detectedSeriesList[activeSeriesIndex] || detectedSeriesList[0];

  const handlePlayActiveSeries = (grp: SeriesGroup) => {
    if (!grp.episodes || grp.episodes.length === 0) return;
    playSeries(grp.episodes);
    setSeriesToast(`▶️ Lecture de la Partie 1 commencée ! Les ${grp.episodes.length - 1} parties suivantes enchaîneront dans l'ordre.`);
    setTimeout(() => setSeriesToast(null), 5000);
  };

  const handleEnqueueActiveSeries = (grp: SeriesGroup) => {
    if (!grp.episodes || grp.episodes.length === 0) return;
    enqueueSeries(grp.episodes);
    setSeriesToast(`➕ Les ${grp.episodes.length} épisodes ont été ajoutés dans l'ordre à votre file d'attente.`);
    setTimeout(() => setSeriesToast(null), 4000);
  };

  const [filterSagaOnly, setFilterSagaOnly] = useState(false);

  // Liste ordonnée selon le tri sélectionné (Récents, Anciens, ou Séries 1➔4)
  const sortedEpisodes = useMemo(() => {
    return sortEpisodes(episodes, sortOrder);
  }, [episodes, sortOrder]);

  const filteredEpisodes = useMemo(() => {
    let list = sortedEpisodes;
    if (filterSagaOnly && activeSeries) {
      const sagaIds = new Set(activeSeries.episodes.map((e) => e.id));
      list = list.filter((ep) => sagaIds.has(ep.id));
    }
    if (!episodeSearch.trim()) return list;
    const term = episodeSearch.toLowerCase();
    return list.filter((ep) =>
      ep.title.toLowerCase().includes(term) ||
      ep.description.toLowerCase().includes(term)
    );
  }, [sortedEpisodes, episodeSearch, filterSagaOnly, activeSeries]);

  const displayedEpisodes = filteredEpisodes.slice(0, visibleCount);

  const latestEpisode = episodes.length > 0 ? episodes[0] : null;
  const isPlayingLatest = latestEpisode && currentEpisode?.id === latestEpisode.id && isPlaying;
  const isBufferingLatest = latestEpisode && currentEpisode?.id === latestEpisode.id && isLoadingAudio;

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
      <div className="p-6 bg-slate-900/60 rounded-3xl border border-slate-800 text-center max-w-md mx-auto my-12 space-y-4">
        <Radio className="w-10 h-10 text-red-400 mx-auto" />
        <h2 className="text-sm font-bold text-white">Erreur de chargement</h2>
        <p className="text-xs text-slate-400 leading-relaxed">{error}</p>
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold transition active:scale-95 shadow-md shadow-purple-600/30"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Retour aux podcasts</span>
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-in fade-in duration-300">
      {/* NOTIFICATION FLOTTANTE POUR SÉRIE */}
      {seriesToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 px-4 py-3 rounded-2xl bg-purple-900/95 text-white text-xs font-bold shadow-2xl border border-purple-400/50 flex items-center gap-2.5 backdrop-blur-md animate-in slide-in-from-top-4 max-w-sm text-center">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{seriesToast}</span>
        </div>
      )}

      {/* BOUTON RETOUR HAUT DE PAGE */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={handleBack}
          className="inline-flex items-center gap-2 px-3 py-2 rounded-xl bg-slate-900/80 hover:bg-slate-800 border border-slate-800 text-xs font-bold text-slate-300 hover:text-white transition active:scale-95 shadow-sm"
        >
          <ArrowLeft className="w-4 h-4 text-purple-400" />
          <span>Retour</span>
        </button>

        <span className="text-[11px] font-mono text-slate-500">
          {episodes.length} épisode(s)
        </span>
      </div>

      {/* EN-TÊTE DU PODCAST */}
      <div className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-4 sm:p-6 flex flex-col sm:flex-row gap-4 sm:gap-5 items-start">
        {/* POCHETTE CARRÉE */}
        <div
          style={{
            width: '120px',
            height: '120px',
            minWidth: '120px',
            minHeight: '120px',
            maxWidth: '120px',
            maxHeight: '120px',
          }}
          className="rounded-2xl overflow-hidden shrink-0 bg-slate-800 border border-slate-700/60 shadow-xl shadow-purple-950/30 relative"
        >
          {podcast.artworkUrl ? (
            <img
              src={podcast.artworkUrl}
              alt={podcast.title}
              width={120}
              height={120}
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-purple-800 to-indigo-900 flex items-center justify-center">
              <Radio className="w-8 h-8 text-purple-300 opacity-70" />
            </div>
          )}
        </div>

        {/* DÉTAILS & BOUTONS */}
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => handleUpdateSettings({ adBlockEnabled: settings.adBlockEnabled === false })}
              className={`text-[10px] font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 transition active:scale-95 ${
                settings.adBlockEnabled !== false
                  ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/25'
                  : 'bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25'
              }`}
              title="Cliquer pour activer ou désactiver le Stop-Pub pour ce podcast"
            >
              <Zap className={`w-3 h-3 ${settings.adBlockEnabled !== false ? 'fill-emerald-400' : 'text-amber-500'}`} />
              <span>{settings.adBlockEnabled !== false ? 'Anti-Pub Actif' : 'Anti-Pub Exclu'}</span>
            </button>
            {detectedSeriesList.length > 0 && (
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                <Layers className="w-2.5 h-2.5 text-amber-400" />
                <span>{detectedSeriesList.length} saga{detectedSeriesList.length > 1 ? 's' : ''} disponible{detectedSeriesList.length > 1 ? 's' : ''}</span>
              </span>
            )}
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

          <div className="pt-2 flex items-center gap-2.5 flex-wrap">
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
                className="px-4 sm:px-5 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-2 active:scale-95 shadow-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white shadow-purple-600/30"
              >
                {isBufferingLatest ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : isPlayingLatest ? (
                  <Pause className="w-4 h-4 fill-white" />
                ) : (
                  <Play className="w-4 h-4 fill-white ml-0.5" />
                )}
                <span>{isPlayingLatest ? 'Pause' : 'Dernier épisode'}</span>
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
              className="px-3.5 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-xs font-bold text-slate-300 hover:text-white transition flex items-center gap-1.5 border border-slate-700/60"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>Anti-Pub</span>
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
            <button
              type="button"
              onClick={() => handleUpdateSettings({ adBlockEnabled: settings.adBlockEnabled === false })}
              className={`px-3 py-1.5 rounded-xl border flex items-center gap-2 transition active:scale-95 shadow-sm ${
                settings.adBlockEnabled !== false
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-300'
              }`}
              title={settings.adBlockEnabled !== false ? "Désactiver le Stop-Pub pour ce podcast" : "Réactiver le Stop-Pub pour ce podcast"}
            >
              <span className="text-xs font-bold">
                {settings.adBlockEnabled !== false ? 'Stop-Pub Activé' : 'Exclu du Stop-Pub'}
              </span>
              <div
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  settings.adBlockEnabled !== false ? 'bg-emerald-500' : 'bg-slate-700'
                }`}
              >
                <span
                  className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${
                    settings.adBlockEnabled !== false ? 'translate-x-4.5' : 'translate-x-0.5'
                  }`}
                />
              </div>
            </button>
          </div>

          <p className="text-[11px] text-slate-400">
            {settings.adBlockEnabled === false
              ? '⚠️ Ce podcast est exclu du Stop-Pub : aucune coupure publicitaire ou sponsor ne sera sauté.'
              : '⚡ Moteur ZeroPub actif : détection et coupure automatique des publicités audio et sponsors.'}
          </p>

          {daiInfo?.isDAI && settings.adBlockEnabled !== false && (
            <div className="p-3 rounded-2xl bg-purple-950/40 border border-purple-500/30 flex items-start gap-2.5 text-xs text-purple-200">
              <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5 fill-purple-400" />
              <div>
                <span className="font-bold text-white">Réseau {daiInfo.networkName} identifié</span>
                <p className="text-[11px] text-purple-300/80 mt-0.5 leading-relaxed">
                  Ce podcast utilise l'insertion publicitaire dynamique. Les spots pré-roll (~{daiInfo.defaultPreRollSec}s) sont coupés automatiquement au démarrage.
                </p>
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Sauter l'introduction (secondes) :
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[0, 15, 30, 45, 60, 90].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleUpdateSettings({ autoSkipIntroSec: sec })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      (settings.autoSkipIntroSec ?? 0) === sec
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/40'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {sec === 0 ? 'Off (0s)' : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-slate-400 mb-1 font-semibold">
                Sauter la fin d'épisode (secondes) :
              </label>
              <div className="flex items-center gap-1.5 flex-wrap">
                {[0, 15, 30, 45, 60].map((sec) => (
                  <button
                    key={sec}
                    type="button"
                    onClick={() => handleUpdateSettings({ autoSkipOutroSec: sec })}
                    className={`px-2.5 py-1 rounded-lg text-xs font-mono font-bold transition ${
                      (settings.autoSkipOutroSec ?? 0) === sec
                        ? 'bg-purple-600 text-white shadow-sm shadow-purple-600/40'
                        : 'bg-slate-800 text-slate-400 hover:bg-slate-700'
                    }`}
                  >
                    {sec === 0 ? 'Off' : `${sec}s`}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* BANNIÈRE SÉRIE MULTI-PARTIES DÉTECTÉE (1/4, 2/4...) */}
      {activeSeries && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-amber-950/40 via-slate-900 to-purple-950/40 border border-amber-500/40 shadow-xl space-y-3.5 animate-in slide-in-from-top-2">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/15 text-amber-300 border border-amber-500/40 text-xs font-extrabold">
              <Layers className="w-3.5 h-3.5 text-amber-400" />
              <span>Saga en plusieurs volets</span>
            </div>

            {detectedSeriesList.length > 1 && (
              <div className="flex items-center gap-1.5 max-w-full">
                <select
                  value={activeSeries.id}
                  onChange={(e) => {
                    const idx = detectedSeriesList.findIndex((s) => s.id === e.target.value);
                    if (idx !== -1) setActiveSeriesIndex(idx);
                  }}
                  className="bg-slate-950/90 border border-amber-500/50 text-amber-200 text-xs font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-1 focus:ring-amber-400 max-w-[210px] sm:max-w-xs truncate shadow-sm cursor-pointer"
                >
                  {detectedSeriesList.map((s, idx) => (
                    <option key={s.id} value={s.id} className="bg-slate-900 text-white py-1">
                      {idx + 1}. {s.title} ({s.episodes.length} volets)
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          <div>
            <h3 className="text-sm sm:text-base font-extrabold text-white">
              {activeSeries.title}
            </h3>
            <p className="text-xs text-amber-200/80 mt-0.5">
              {activeSeries.episodes.length} volets identifiés • Ordonnés automatiquement de la Partie 1 à {activeSeries.totalParts || activeSeries.episodes.length}
            </p>
          </div>

          {/* LISTE CLAIRE DES VOLETS DE LA SAGA */}
          <div className="space-y-1.5 bg-slate-950/70 p-2 sm:p-2.5 rounded-2xl border border-amber-500/20 max-h-56 overflow-y-auto">
            {activeSeries.episodes.map((ep, idx) => (
              <div
                key={ep.id}
                onClick={() => playEpisode(ep)}
                className="flex items-center justify-between gap-2.5 p-2 rounded-xl bg-slate-900/60 hover:bg-amber-950/40 border border-slate-800/80 hover:border-amber-500/40 cursor-pointer transition group"
                title={`Lancer la partie ${idx + 1}`}
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="shrink-0 font-mono text-[10px] font-extrabold px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    Partie {idx + 1}/{activeSeries.totalParts || activeSeries.episodes.length}
                  </span>
                  <span className="text-xs text-slate-300 group-hover:text-amber-200 truncate font-semibold">
                    {ep.title}
                  </span>
                </div>
                <div className="shrink-0 w-6 h-6 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-400 group-hover:bg-amber-500 group-hover:text-slate-950 transition">
                  <Play className="w-3 h-3 fill-current ml-0.5" />
                </div>
              </div>
            ))}
          </div>

          {/* BOUTONS D'ACTION POUR LA SAGA */}
          <div className="pt-1 flex items-center gap-2.5 flex-wrap">
            <button
              type="button"
              onClick={() => handlePlayActiveSeries(activeSeries)}
              className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 font-extrabold text-xs transition flex items-center gap-2 shadow-lg shadow-amber-500/20 active:scale-95"
            >
              <Play className="w-4 h-4 fill-slate-950" />
              <span>Écouter toute la saga (1 ➔ {activeSeries.totalParts || activeSeries.episodes.length})</span>
            </button>

            <button
              type="button"
              onClick={() => handleEnqueueActiveSeries(activeSeries)}
              className="px-3.5 py-2.5 rounded-2xl bg-slate-900/90 hover:bg-slate-800 text-amber-300 hover:text-white border border-amber-500/30 font-bold text-xs transition flex items-center gap-1.5 active:scale-95"
            >
              <ListPlus className="w-4 h-4 text-amber-400" />
              <span>Ajouter à la file</span>
            </button>

            <button
              type="button"
              onClick={() => setFilterSagaOnly(!filterSagaOnly)}
              className={`px-3 py-2.5 rounded-2xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 border ${
                filterSagaOnly
                  ? 'bg-amber-500 text-slate-950 border-amber-400 font-extrabold shadow-sm'
                  : 'bg-slate-900 hover:bg-slate-800 text-slate-300 border-slate-700'
              }`}
            >
              <span>{filterSagaOnly ? '✓ Affichage de la saga' : 'Filtrer la liste'}</span>
            </button>
          </div>
        </div>
      )}

      {/* LISTE DES ÉPISODES AVEC SÉLECTEUR D'ORDRE (RÉCENTS / ANCIENS / SÉRIES) */}
      <div className="space-y-3 pt-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="text-sm font-bold text-slate-300 uppercase tracking-wider">
              Épisodes ({filteredEpisodes.length}{filteredEpisodes.length !== episodes.length ? ` / ${episodes.length}` : ''})
            </h2>

            {/* SÉLECTEUR DE CLASSEMENT AVEC GROS BOUTONS ERGONOMIQUES */}
            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-xl border border-slate-800">
              <button
                type="button"
                onClick={() => handleSortChange('newest')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  sortOrder === 'newest'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Afficher les plus récents en premier"
              >
                <ArrowDown className="w-3.5 h-3.5" />
                <span>Récents</span>
              </button>

              <button
                type="button"
                onClick={() => handleSortChange('oldest')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1 ${
                  sortOrder === 'oldest'
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
                title="Afficher du premier au dernier (chronologique)"
              >
                <ArrowUp className="w-3.5 h-3.5" />
                <span>Anciens</span>
              </button>

              <button
                type="button"
                onClick={() => handleSortChange('series')}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                  sortOrder === 'series'
                    ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                    : 'text-amber-400 hover:text-amber-300 hover:bg-slate-800'
                }`}
                title="Classer les épisodes en plusieurs parties dans l'ordre (1 ➔ 2 ➔ 3 ➔ 4)"
              >
                <ListOrdered className="w-3.5 h-3.5" />
                <span>Séries (1➔4)</span>
              </button>
            </div>
          </div>

          {episodes.length > 5 && (
            <div className="relative max-w-xs w-full">
              <input
                type="text"
                value={episodeSearch}
                onChange={(e) => {
                  setEpisodeSearch(e.target.value);
                  setVisibleCount(30);
                }}
                placeholder="Filtrer les épisodes..."
                className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
              />
              <SearchIcon className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            </div>
          )}
        </div>

        <div className="space-y-2">
          {displayedEpisodes.map((ep) => (
            <EpisodeRow key={ep.id} episode={ep} />
          ))}
        </div>

        {filteredEpisodes.length > visibleCount && (
          <div className="text-center pt-4 pb-2">
            <button
              type="button"
              onClick={() => setVisibleCount((c) => c + 30)}
              className="px-5 py-2.5 rounded-2xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-xs font-bold text-purple-300 hover:text-white transition active:scale-95 shadow-md"
            >
              Afficher plus d'épisodes (+30) • {filteredEpisodes.length - visibleCount} restants
            </button>
          </div>
        )}
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
