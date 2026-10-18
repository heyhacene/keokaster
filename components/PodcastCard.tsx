'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Podcast } from '@/types/podcast';
import { SearchResultItem } from '@/lib/podcastSearch';
import { Plus, Check, Radio, Zap, ZapOff, Share2, ExternalLink, X } from 'lucide-react';
import { useLongPress } from '@/lib/useLongPress';
import {
  getPodcastSettings,
  savePodcastSettings,
  getGlobalAdSettings,
  togglePodcastSubscription,
  isPodcastSubscribed,
} from '@/lib/storage';

interface PodcastCardProps {
  podcast: Podcast | SearchResultItem;
  isSubscribed?: boolean;
  onToggleSubscribe?: (e: React.MouseEvent) => void;
}

export default function PodcastCard({
  podcast,
  isSubscribed: propIsSubscribed,
  onToggleSubscribe,
}: PodcastCardProps) {
  const router = useRouter();
  const [hasImgError, setHasImgError] = useState(false);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  const [isSub, setIsSub] = useState<boolean>(() => {
    if (propIsSubscribed !== undefined) return propIsSubscribed;
    return isPodcastSubscribed(podcast.id) || isPodcastSubscribed(podcast.feedUrl);
  });

  const [isAdBlockActive, setIsAdBlockActive] = useState<boolean>(() => {
    const g = getGlobalAdSettings();
    const p = getPodcastSettings(podcast.id || podcast.feedUrl);
    return g.enabled && p.adBlockEnabled !== false;
  });

  useEffect(() => {
    if (propIsSubscribed !== undefined) {
      setIsSub(propIsSubscribed);
    }
  }, [propIsSubscribed]);

  useEffect(() => {
    const updateAdStatus = () => {
      const g = getGlobalAdSettings();
      const p = getPodcastSettings(podcast.id || podcast.feedUrl);
      setIsAdBlockActive(g.enabled && p.adBlockEnabled !== false);
    };
    updateAdStatus();
    window.addEventListener('keokaster_podcast_settings_changed', updateAdStatus);
    return () => window.removeEventListener('keokaster_podcast_settings_changed', updateAdStatus);
  }, [podcast.id, podcast.feedUrl]);

  const { handlers: longPressHandlers, isLongPressActive } = useLongPress({
    delay: 480,
    onLongPress: () => {
      setShowOptionsModal(true);
    },
  });

  const handleCardClick = (e: React.MouseEvent) => {
    if (isLongPressActive()) {
      e.preventDefault();
      e.stopPropagation();
      return;
    }
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('keokaster_search_scroll', String(window.scrollY));
    }
    router.push(`/podcast?feed=${encodeURIComponent(podcast.feedUrl)}`);
  };

  const handleSubClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (onToggleSubscribe) {
      onToggleSubscribe(e);
    } else {
      const nextSub = togglePodcastSubscription(podcast as Podcast);
      setIsSub(nextSub);
    }
  };

  const handleToggleAdBlock = (e: React.MouseEvent) => {
    e.stopPropagation();
    const pId = podcast.id || podcast.feedUrl;
    const current = getPodcastSettings(pId);
    const nextVal = current.adBlockEnabled === false;
    savePodcastSettings(pId, { ...current, adBlockEnabled: nextVal }, podcast.feedUrl);
    setIsAdBlockActive(nextVal);
    setToastMsg(
      nextVal
        ? '⚡ Stop-Pub réactivé pour ce podcast'
        : '⏸️ Stop-Pub désactivé (pubs actives pour ce podcast)'
    );
    setTimeout(() => {
      setToastMsg(null);
      setShowOptionsModal(false);
    }, 2000);
  };

  const handleCopyRss = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowOptionsModal(false);
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(podcast.feedUrl);
      setToastMsg('📋 Flux RSS copié !');
      setTimeout(() => setToastMsg(null), 2000);
    }
  };

  const showPlaceholder = !podcast.artworkUrl || hasImgError;

  return (
    <>
      <div
        onClick={handleCardClick}
        {...longPressHandlers}
        className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/40 rounded-3xl p-3 sm:p-3.5 transition-all flex flex-col justify-between shadow-xs hover:shadow-xl hover:shadow-purple-950/30 cursor-pointer select-none"
      >
        <div className="space-y-2.5">
          {/* POCHETTE CARRÉE AVEC SÉCURITÉ ANTI-IMAGE CASSÉE */}
          <div className="aspect-square w-full rounded-2xl overflow-hidden bg-slate-800 relative shadow-sm">
            {!showPlaceholder ? (
              <img
                src={podcast.artworkUrl}
                alt={podcast.title}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                loading="lazy"
                onError={() => setHasImgError(true)}
              />
            ) : (
              <div className="w-full h-full bg-gradient-to-tr from-purple-900 via-indigo-900 to-slate-900 flex flex-col items-center justify-center p-3 text-center">
                <Radio className="w-8 h-8 text-purple-300 mb-1 shrink-0 opacity-80" />
                <span className="text-[11px] font-bold text-white line-clamp-2 leading-tight">
                  {podcast.title}
                </span>
              </div>
            )}

            {/* BADGE D'ÉTAT STOP-PUB (SI EXCLU) */}
            {!isAdBlockActive && (
              <span className="absolute bottom-2 left-2 px-1.5 py-0.5 rounded-md bg-amber-500/90 text-slate-950 text-[9px] font-extrabold shadow-md flex items-center gap-1 backdrop-blur-xs">
                <ZapOff className="w-2.5 h-2.5" />
                <span>Pubs actives</span>
              </span>
            )}

            {/* BOUTON D'ABONNEMENT ACCESSIBLE */}
            <button
              type="button"
              onClick={handleSubClick}
              className={`absolute top-2 right-2 w-9 h-9 rounded-xl backdrop-blur-md transition-transform active:scale-90 flex items-center justify-center shadow-lg ${
                isSub
                  ? 'bg-purple-600 text-white shadow-purple-600/40 ring-1 ring-purple-400'
                  : 'bg-slate-950/80 text-white hover:bg-purple-600 border border-slate-700/60'
              }`}
              title={isSub ? 'Abonné' : "S'abonner"}
            >
              {isSub ? (
                <Check className="w-4 h-4 stroke-[3] text-white" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          </div>

          {/* TITRE ET AUTEUR */}
          <div>
            <h3 className="font-bold text-xs sm:text-sm text-white leading-snug line-clamp-2 group-hover:text-purple-300 transition">
              {podcast.title}
            </h3>
            <p className="text-[11px] text-slate-400 truncate mt-1">
              {podcast.author}
            </p>
          </div>
        </div>

        {podcast.categories && podcast.categories.length > 0 && (
          <span className="text-[10px] font-semibold text-slate-500 truncate mt-2">
            {podcast.categories[0]}
          </span>
        )}
      </div>

      {/* TOAST FLOTTANT */}
      {toastMsg && (
        <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-2xl bg-purple-900/95 border border-purple-400/50 text-white text-xs font-bold shadow-2xl backdrop-blur-md animate-in slide-in-from-bottom-3 max-w-sm text-center">
          {toastMsg}
        </div>
      )}

      {/* MENU CONTEXTUEL / APPUI LONG SUR PODCAST */}
      {showOptionsModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-end sm:items-center justify-center p-3 sm:p-4 animate-in fade-in duration-200"
          onClick={() => setShowOptionsModal(false)}
        >
          <div
            className="bg-slate-900 border border-slate-700/80 rounded-t-3xl sm:rounded-3xl p-5 max-w-md w-full space-y-4 shadow-2xl relative animate-in slide-in-from-bottom-4 sm:zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* EN-TÊTE */}
            <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3.5">
              <div className="min-w-0 flex-1">
                <span className="text-[10px] font-bold text-purple-400 uppercase tracking-wider block mb-0.5">
                  Options du podcast
                </span>
                <h3 className="font-extrabold text-sm sm:text-base text-white line-clamp-1 leading-snug">
                  {podcast.title}
                </h3>
                <p className="text-xs text-slate-400 truncate mt-0.5">
                  {podcast.author}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowOptionsModal(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition shrink-0"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* ACTIONS RAPIDES */}
            <div className="space-y-1.5">
              {/* OUVRIR LE PODCAST */}
              <button
                type="button"
                onClick={() => {
                  setShowOptionsModal(false);
                  router.push(`/podcast?feed=${encodeURIComponent(podcast.feedUrl)}`);
                }}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-purple-600/20 text-purple-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <ExternalLink className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    Ouvrir les épisodes
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Consulter la liste complète des épisodes et sagas
                  </p>
                </div>
              </button>

              {/* S'ABONNER / SE DÉSABONNER */}
              <button
                type="button"
                onClick={(e) => {
                  handleSubClick(e);
                  setShowOptionsModal(false);
                  setToastMsg(
                    !isSub
                      ? `⭐ Abonné à « ${podcast.title} » !`
                      : `Désabonné de « ${podcast.title} »`
                  );
                  setTimeout(() => setToastMsg(null), 2000);
                }}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  {isSub ? <Check className="w-5 h-5 text-purple-400" /> : <Plus className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    {isSub ? 'Se désabonner de la bibliothèque' : "S'abonner à la bibliothèque"}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isSub ? 'Présent dans votre bibliothèque' : 'Ajouter à vos podcasts favoris'}
                  </p>
                </div>
              </button>

              {/* BASCULER STOP-PUB */}
              <button
                type="button"
                onClick={handleToggleAdBlock}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 group-hover:scale-105 transition ${
                    isAdBlockActive
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-emerald-500/20 text-emerald-400'
                  }`}
                >
                  {isAdBlockActive ? <ZapOff className="w-5 h-5" /> : <Zap className="w-5 h-5" />}
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    {isAdBlockActive
                      ? 'Désactiver Stop-Pub (Laisser les pubs)'
                      : 'Activer Stop-Pub (Saut automatique)'}
                  </p>
                  <p className="text-[11px] text-slate-400">
                    {isAdBlockActive
                      ? 'Actuellement : Anti-pub actif'
                      : 'Actuellement : Pubs actives pour ce podcast'}
                  </p>
                </div>
              </button>

              {/* COPIER LE FLUX RSS */}
              <button
                type="button"
                onClick={handleCopyRss}
                className="w-full p-3 rounded-2xl bg-slate-950/70 hover:bg-purple-900/40 border border-slate-800 hover:border-purple-500/40 text-left flex items-center gap-3.5 transition group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 text-slate-300 flex items-center justify-center shrink-0 group-hover:scale-105 transition">
                  <Share2 className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs sm:text-sm font-bold text-white group-hover:text-purple-200">
                    Copier le lien du flux RSS
                  </p>
                  <p className="text-[11px] text-slate-400">
                    Copier l'URL source pour un usage externe
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
