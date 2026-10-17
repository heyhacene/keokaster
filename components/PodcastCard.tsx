'use client';

import React from 'react';
import Link from 'next/link';
import { Podcast } from '@/types/podcast';
import { SearchResultItem } from '@/lib/podcastSearch';
import { Plus, Check, Play } from 'lucide-react';

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
  return (
    <Link
      href={`/podcast?feed=${encodeURIComponent(podcast.feedUrl)}`}
      className="group bg-slate-900/60 hover:bg-slate-900 border border-slate-800/80 hover:border-purple-500/40 rounded-2xl p-3 transition flex flex-col justify-between shadow-xs hover:shadow-lg hover:shadow-purple-950/20"
    >
      <div className="space-y-2.5">
        {/* POCHETTE CARRÉE */}
        <div className="aspect-square w-full rounded-xl overflow-hidden bg-slate-800 relative shadow-sm">
          {podcast.artworkUrl ? (
            <img
              src={podcast.artworkUrl}
              alt=""
              className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-tr from-purple-800 to-indigo-900 flex items-center justify-center text-white font-bold text-sm">
              Podcast
            </div>
          )}

          {onToggleSubscribe && (
            <button
              type="button"
              onClick={onToggleSubscribe}
              className={`absolute top-2 right-2 p-1.5 rounded-xl backdrop-blur-md transition shadow-md ${
                isSubscribed
                  ? 'bg-purple-600 text-white'
                  : 'bg-slate-950/70 text-slate-300 hover:text-white hover:bg-slate-900'
              }`}
              title={isSubscribed ? 'Abonné' : "S'abonner"}
            >
              {isSubscribed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            </button>
          )}
        </div>

        {/* TITRE ET AUTEUR */}
        <div>
          <h3 className="font-bold text-xs sm:text-sm text-white leading-tight line-clamp-1 group-hover:text-purple-300 transition">
            {podcast.title}
          </h3>
          <p className="text-[11px] text-slate-400 truncate mt-0.5">
            {podcast.author}
          </p>
        </div>
      </div>

      {podcast.categories && podcast.categories.length > 0 && (
        <span className="text-[10px] text-slate-500 font-medium truncate mt-2">
          {podcast.categories[0]}
        </span>
      )}
    </Link>
  );
}
