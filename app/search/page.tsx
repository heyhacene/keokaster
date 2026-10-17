'use client';

import React, { useState, useEffect } from 'react';
import { searchPodcasts, SearchResultItem, TRENDING_PODCASTS } from '@/lib/podcastSearch';
import PodcastCard from '@/components/PodcastCard';
import { getSubscribedPodcasts, togglePodcastSubscription, getCanonicalPodcastId } from '@/lib/storage';
import { Search, Loader2, Radio, Sparkles } from 'lucide-react';

const CATEGORY_TAGS = [
  'Actualités',
  'Technologie',
  'Histoire',
  'Société',
  'Humour',
  'Science',
  'True Crime',
  'Culture',
  'Sport',
  'Économie',
];

export default function SearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResultItem[]>(TRENDING_PODCASTS);
  const [loading, setLoading] = useState(false);
  const [subsMap, setSubsMap] = useState<Record<string, boolean>>({});

  const refreshSubs = () => {
    const subs = getSubscribedPodcasts();
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

  useEffect(() => {
    if (!query.trim()) {
      setResults(TRENDING_PODCASTS);
      setLoading(false);
      return;
    }

    setLoading(true);
    const timer = setTimeout(async () => {
      try {
        const res = await searchPodcasts(query);
        setResults(res);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const triggerImmediateSearch = async (searchTerm: string) => {
    setQuery(searchTerm);
    if (!searchTerm.trim()) {
      setResults(TRENDING_PODCASTS);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await searchPodcasts(searchTerm);
      setResults(res);
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
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
    <div className="space-y-6 animate-in fade-in duration-300">
      <div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white">
          Rechercher des podcasts
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Explorez des millions de podcasts ou collez un lien de flux RSS direct.
        </p>
      </div>

      {/* BARRE DE RECHERCHE */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
          <Search className="w-4 h-4" />
        </div>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              triggerImmediateSearch(query);
            }
          }}
          placeholder="Titre, animateur, sujet (ex: Le 1000, HugoDécrypte, Tech...)"
          className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-2 focus:ring-purple-500/20 shadow-md"
        />
        {query.trim().length > 0 && !loading && (
          <button
            type="button"
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-white"
            title="Effacer la recherche"
          >
            <span className="w-5 h-5 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-xs font-bold">
              ✕
            </span>
          </button>
        )}
        {loading && (
          <div className="absolute inset-y-0 right-0 pr-3.5 flex items-center pointer-events-none">
            <Loader2 className="w-4 h-4 text-purple-400 animate-spin" />
          </div>
        )}
      </div>

      {/* CATÉGORIES RAPIDES */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
        {CATEGORY_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => triggerImmediateSearch(tag)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold shrink-0 transition ${
              query === tag
                ? 'bg-purple-600 text-white border-purple-500 shadow-md shadow-purple-600/30'
                : 'bg-slate-900 hover:bg-slate-800 border-slate-800 text-slate-300 hover:text-white'
            }`}
          >
            {tag}
          </button>
        ))}
      </div>

      {/* RÉSULTATS OU SUGGESTIONS POPULAIRES */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            {query.trim() ? (
              <span className="text-xs font-bold text-purple-300 uppercase tracking-wider flex items-center gap-1.5">
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Recherche en cours pour « {query} »...</span>
                  </>
                ) : (
                  <span>{results.length} résultat(s) pour « {query} »</span>
                )}
              </span>
            ) : (
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Suggestions populaires du moment</span>
              </span>
            )}
          </div>
        </div>

        {results.length === 0 && !loading ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6 space-y-2">
            <Radio className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">Aucun podcast trouvé pour « {query} »</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Vérifiez l'orthographe ou collez directement l'adresse d'un flux RSS pour le charger sans publicité.
            </p>
            <button
              type="button"
              onClick={() => setQuery('')}
              className="mt-3 px-4 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-600 hover:text-white transition"
            >
              Revenir aux suggestions
            </button>
          </div>
        ) : (
          <div className={`grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 transition-opacity ${loading ? 'opacity-60' : 'opacity-100'}`}>
            {results.map((podcast) => (
              <PodcastCard
                key={podcast.id}
                podcast={podcast}
                isSubscribed={Boolean(subsMap[podcast.id])}
                onToggleSubscribe={(e) => handleToggleSub(podcast, e)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
