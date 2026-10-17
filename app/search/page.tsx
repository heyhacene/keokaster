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

  const handleSearch = async (searchTerm: string) => {
    if (!searchTerm.trim()) {
      setResults(TRENDING_PODCASTS);
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
          onChange={(e) => {
            setQuery(e.target.value);
            handleSearch(e.target.value);
          }}
          placeholder="Titre, animateur, sujet (ex: HugoDécrypte, Tech, Histoire...)"
          className="w-full pl-10 pr-4 py-3 rounded-2xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 focus:ring-1 focus:ring-purple-500 shadow-sm"
        />
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
            onClick={() => {
              setQuery(tag);
              handleSearch(tag);
            }}
            className="px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white shrink-0 transition"
          >
            {tag}
          </button>
        ))}
      </div>

      {/* RÉSULTATS */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
            {query.trim() ? `${results.length} résultat(s)` : 'Suggestions populaires'}
          </span>
        </div>

        {results.length === 0 && !loading ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6">
            <Radio className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">Aucun podcast trouvé</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Vérifiez l'orthographe ou collez directement l'adresse d'un flux RSS pour le charger.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
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
