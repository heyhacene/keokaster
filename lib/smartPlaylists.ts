'use client';

import { Episode, Playlist } from '@/types/podcast';
import { getPlaybackPositions, getPlayedEpisodeIds } from '@/lib/storage';
import { detectSeriesPart } from '@/lib/seriesDetector';

export interface SmartPlaylist {
  id: string;
  name: string;
  badgeLabel: string;
  description: string;
  iconName: 'sparkles' | 'clock' | 'play' | 'layers';
  color: string;
  getEpisodes: (allAvailableEpisodes: Episode[]) => Episode[];
}

export const SMART_PLAYLISTS: SmartPlaylist[] = [
  {
    id: 'smart_recent',
    name: 'Nouveautés 48h',
    badgeLabel: 'Dernières sorties',
    description: 'Les épisodes fraîchement sortis de vos podcasts favoris',
    iconName: 'sparkles',
    color: 'from-purple-600 to-indigo-600',
    getEpisodes: (episodes: Episode[]) => {
      const now = Date.now();
      const cutoff48h = now - 48 * 3600 * 1000;
      const recent = episodes.filter((ep) => {
        if (!ep.pubDate) return false;
        try {
          const t = new Date(ep.pubDate).getTime();
          return t >= cutoff48h;
        } catch {
          return false;
        }
      });
      // Si moins de 3 épisodes sur 48h, on élargit aux 7 derniers jours
      if (recent.length < 3) {
        const cutoff7d = now - 7 * 24 * 3600 * 1000;
        return episodes.filter((ep) => {
          if (!ep.pubDate) return false;
          try {
            return new Date(ep.pubDate).getTime() >= cutoff7d;
          } catch {
            return false;
          }
        }).slice(0, 15);
      }
      return recent.slice(0, 20);
    },
  },
  {
    id: 'smart_short',
    name: 'Trajet Rapide (< 20 min)',
    badgeLabel: 'Formats courts',
    description: 'Idéal pour le métro ou une pause café sans coupure',
    iconName: 'clock',
    color: 'from-emerald-600 to-teal-600',
    getEpisodes: (episodes: Episode[]) => {
      return episodes
        .filter((ep) => ep.durationSec > 0 && ep.durationSec <= 20 * 60)
        .slice(0, 25);
    },
  },
  {
    id: 'smart_in_progress',
    name: 'Reprendre la lecture',
    badgeLabel: 'En cours',
    description: 'Vos épisodes commencés prêts à être terminés',
    iconName: 'play',
    color: 'from-amber-600 to-orange-600',
    getEpisodes: (episodes: Episode[]) => {
      const positions = getPlaybackPositions();
      const played = new Set(getPlayedEpisodeIds());
      return episodes.filter((ep) => {
        const pos = positions[ep.id] || 0;
        const isFinished = played.has(ep.id) || (ep.durationSec > 0 && pos >= ep.durationSec - 30);
        return pos > 10 && !isFinished;
      });
    },
  },
  {
    id: 'smart_series',
    name: 'Sagas & Séries (Multi-parties)',
    badgeLabel: '1/4, 2/4...',
    description: 'Tous les épisodes en feuilleton classés dans le bon ordre',
    iconName: 'layers',
    color: 'from-pink-600 to-rose-600',
    getEpisodes: (episodes: Episode[]) => {
      return episodes.filter((ep) => detectSeriesPart(ep.title).isSeries);
    },
  },
];
