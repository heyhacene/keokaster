'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Podcast } from '@/types/podcast';
import { SearchResultItem } from '@/lib/podcastSearch';
import { Plus, Check, Radio } from 'lucide-react';

interface PodcastCardProps {
  podcast: Podcast | SearchResultItem;
  isSubscribed?: boolean;
  onToggleSubscribe?: (e: React.MouseEvent) => void;
}

export default function PodcastCard({
  podcast,
  isSubscribed = false,
  onToggleSubscribe,
}: PodcastCardProps) {
  const [hasImgError, setHasImgError] = useState(false);

  const handleSubClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onToggleSubscribe?.(e);
  };

  const showPlaceholder = !podcast.artworkUrl || hasImgError;

  return (
    <Link
      href={`/podcast?feed=${encodeURIComponent(podcast.feedUrl)}`}
      className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/40 rounded-3xl p-3 sm:p-3.5 transition-all flex flex-col justify-between shadow-xs hover:shadow-xl hover:shadow-purple-950/30"
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

          {/* BOUTON D'ABONNEMENT ACCESSIBLE & SANS NAVIGATION PAR ERREUR */}
          {onToggleSubscribe && (
            <button
              type="button"
              onClick={handleSubClick}
              className={`absolute top-2 right-2 w-9 h-9 rounded-xl backdrop-blur-md transition-transform active:scale-90 flex items-center justify-center shadow-lg ${
                isSubscribed
                  ? 'bg-purple-600 text-white shadow-purple-600/40 ring-1 ring-purple-400'
                  : 'bg-slate-950/80 text-white hover:bg-purple-600 border border-slate-700/60'
              }`}
              title={isSubscribed ? 'Abonné' : "S'abonner"}
            >
              {isSubscribed ? (
                <Check className="w-4 h-4 stroke-[3] text-white" />
              ) : (
                <Plus className="w-4 h-4 stroke-[2.5]" />
              )}
            </button>
          )}
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
    </Link>
  );
}
