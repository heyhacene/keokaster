'use client';

import React, { useState, useEffect, useRef } from 'react';
import { searchPodcasts, SearchResultItem } from '@/lib/podcastSearch';
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
  // Récupération de l'état précédent sauvegardé (navigation Retour)
  const [query, setQuery] = useState(() => {
    if (typeof window !== 'undefined') {
      return sessionStorage.getItem('keokaster_search_query') || '';
    }
    return '';
  });

  const [results, setResults] = useState<SearchResultItem[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const savedResults = sessionStorage.getItem('keokaster_search_results');
        if (savedResults) {
          const parsed = JSON.parse(savedResults);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
          }
        }
      } catch {}
    }
    return [];
  });

  const [loading, setLoading] = useState(false);
  const [subsMap, setSubsMap] = useState<Record<string, boolean>>({});
  const isFirstMount = useRef(true);
  const searchSeqRef = useRef(0);

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

  // Restauration de la position de défilement (scroll) lors du retour arrière
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedScroll = sessionStorage.getItem('keokaster_search_scroll');
      if (savedScroll) {
        const scrollY = parseInt(savedScroll, 10);
        if (!isNaN(scrollY) && scrollY > 0) {
          setTimeout(() => {
            window.scrollTo({ top: scrollY, behavior: 'instant' as any });
          }, 80);
        }
      }

      const handleScroll = () => {
        sessionStorage.setItem('keokaster_search_scroll', String(window.scrollY));
      };

      window.addEventListener('scroll', handleScroll, { passive: true });
      return () => window.removeEventListener('scroll', handleScroll);
    }
  }, []);

  // Recherche réactive avec annulation des anciennes requêtes réseau
  useEffect(() => {
    // Si la page vient d'être restaurée depuis le sessionStorage avec déjà des résultats, ne pas recharger
    if (isFirstMount.current) {
      isFirstMount.current = false;
      if (query.trim() && results.length > 0) {
        return;
      }
    }

    const trimmed = query.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      return;
    }

    if (trimmed.length < 2) {
      setLoading(false);
      setResults([]);
      return;
    }

    const seq = ++searchSeqRef.current;
    setLoading(true);

    const timer = setTimeout(async () => {
      try {
        const res = await searchPodcasts(trimmed);
        if (seq === searchSeqRef.current) {
          setResults(res);
          setLoading(false);
          if (typeof window !== 'undefined') {
            sessionStorage.setItem('keokaster_search_query', trimmed);
            sessionStorage.setItem('keokaster_search_results', JSON.stringify(res));
          }
        }
      } catch (err) {
        if (seq === searchSeqRef.current) {
          console.error('Erreur recherche podcast:', err);
          setLoading(false);
        }
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [query]);

  const handleInputChange = (val: string) => {
    setQuery(val);
    const trimmed = val.trim();
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('keokaster_search_query');
        sessionStorage.removeItem('keokaster_search_results');
        sessionStorage.removeItem('keokaster_search_scroll');
      }
    } else {
      // Nettoyage immédiat : AUCUN ancien résultat ne subsiste à l'écran
      setResults([]);
      setLoading(true);
    }
  };

  const triggerImmediateSearch = async (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    setQuery(trimmed);
    if (!trimmed) {
      setResults([]);
      setLoading(false);
      if (typeof window !== 'undefined') {
        sessionStorage.removeItem('keokaster_search_query');
        sessionStorage.removeItem('keokaster_search_results');
        sessionStorage.removeItem('keokaster_search_scroll');
      }
      return;
    }

    const seq = ++searchSeqRef.current;
    setLoading(true);
    setResults([]);

    try {
      const res = await searchPodcasts(trimmed);
      if (seq === searchSeqRef.current) {
        setResults(res);
        setLoading(false);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('keokaster_search_query', trimmed);
          sessionStorage.setItem('keokaster_search_results', JSON.stringify(res));
        }
      }
    } catch {
      if (seq === searchSeqRef.current) {
        setLoading(false);
      }
    }
  };

  const handleClear = () => {
    searchSeqRef.current++;
    setQuery('');
    setResults([]);
    setLoading(false);
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('keokaster_search_query');
      sessionStorage.removeItem('keokaster_search_results');
      sessionStorage.removeItem('keokaster_search_scroll');
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

  const isShortQuery = query.trim().length > 0 && query.trim().length < 2;

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
          onChange={(e) => handleInputChange(e.target.value)}
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
            onClick={handleClear}
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

      {/* RÉSULTATS DE RECHERCHE */}
      <div>
        {query.trim() && (
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
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
            </div>
          </div>
        )}

        {/* AFFICHAGE : ACCUEIL SANS SUGGESTIONS, SKELETON OU RÉSULTATS */}
        {!query.trim() ? (
          <div className="text-center py-16 bg-slate-900/30 rounded-3xl border border-slate-800/60 p-6 sm:p-8 space-y-3">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <Search className="w-7 h-7" />
            </div>
            <h3 className="text-base sm:text-lg font-extrabold text-white">
              Que souhaitez-vous écouter ?
            </h3>
            <p className="text-xs text-slate-400 max-w-md mx-auto leading-relaxed">
              Tapez le nom d'une émission, un créateur, ou cliquez sur une thématique ci-dessus.
              Vous pouvez aussi coller directement le lien complet d'un flux RSS.
            </p>
          </div>
        ) : loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4 animate-pulse">
            {[...Array(6)].map((_, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800/80 rounded-3xl p-3 sm:p-3.5 space-y-3"
              >
                <div className="aspect-square w-full rounded-2xl bg-slate-800/70" />
                <div className="space-y-1.5">
                  <div className="h-3.5 bg-slate-800 rounded-md w-4/5" />
                  <div className="h-2.5 bg-slate-800/50 rounded-md w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : isShortQuery ? (
          <div className="text-center py-12 bg-slate-900/30 rounded-3xl border border-slate-800/50 p-6 space-y-2">
            <Search className="w-8 h-8 text-purple-400/60 mx-auto mb-2" />
            <h3 className="text-xs font-semibold text-slate-300">
              Tapez au moins 2 caractères pour lancer la recherche...
            </h3>
          </div>
        ) : results.length === 0 ? (
          <div className="text-center py-16 bg-slate-900/40 rounded-3xl border border-slate-800/60 p-6 space-y-2">
            <Radio className="w-10 h-10 text-slate-600 mx-auto mb-2" />
            <h3 className="text-sm font-bold text-white">Aucun podcast trouvé pour « {query} »</h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Vérifiez l'orthographe ou collez directement l'adresse d'un flux RSS pour le charger sans publicité.
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="mt-3 px-4 py-2 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-600 hover:text-white transition"
            >
              Effacer la recherche
            </button>
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
