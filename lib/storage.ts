import { Podcast, Episode, GlobalAdSettings, PodcastSettings, Playlist } from '@/types/podcast';
import { DEFAULT_GLOBAL_AD_SETTINGS } from './adBlocker';

const SUBS_KEY = 'keokaster_subscriptions_v1';
const POSITIONS_KEY = 'keokaster_positions_v1';
const QUEUE_KEY = 'keokaster_queue_v1';
const PLAYED_KEY = 'keokaster_played_v1';
const AD_SETTINGS_KEY = 'keokaster_ad_settings_v1';
const PODCAST_SETTINGS_KEY = 'keokaster_podcast_settings_v1';
const PLAYLISTS_KEY = 'keokaster_playlists_v1';

export function getCanonicalPodcastId(feedUrl: string): string {
  if (!feedUrl) return '';
  const clean = feedUrl.trim().replace(/\/+$/, '');
  try {
    return btoa(clean).replace(/[^a-zA-Z0-9]/g, '').slice(0, 24);
  } catch {
    return clean.replace(/[^a-zA-Z0-9]/g, '_').slice(-24);
  }
}

export function getSubscribedPodcasts(): Podcast[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SUBS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSubscribedPodcasts(list: Podcast[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SUBS_KEY, JSON.stringify(list));
  } catch {}
}

export function isPodcastSubscribed(podcastIdOrFeedUrl: string): boolean {
  if (!podcastIdOrFeedUrl) return false;
  const subs = getSubscribedPodcasts();
  const canonical = getCanonicalPodcastId(podcastIdOrFeedUrl);
  return subs.some((p) => {
    if (p.id === podcastIdOrFeedUrl) return true;
    if (p.feedUrl && p.feedUrl === podcastIdOrFeedUrl) return true;
    if (canonical && p.id === canonical) return true;
    if (p.feedUrl && canonical && getCanonicalPodcastId(p.feedUrl) === canonical) return true;
    return false;
  });
}

export function togglePodcastSubscription(podcast: {
  id?: string;
  feedUrl: string;
  title: string;
  author?: string;
  description?: string;
  artworkUrl?: string;
  categories?: string[];
}): boolean {
  const subs = getSubscribedPodcasts();
  const canonical = getCanonicalPodcastId(podcast.feedUrl);
  const targetId = podcast.id || canonical;

  const exists = subs.some((p) => {
    if (p.id === targetId) return true;
    if (canonical && p.id === canonical) return true;
    if (podcast.feedUrl && p.feedUrl === podcast.feedUrl) return true;
    if (p.feedUrl && canonical && getCanonicalPodcastId(p.feedUrl) === canonical) return true;
    return false;
  });

  let updated: Podcast[];
  if (exists) {
    updated = subs.filter((p) => {
      if (p.id === targetId) return false;
      if (canonical && p.id === canonical) return false;
      if (podcast.feedUrl && p.feedUrl === podcast.feedUrl) return false;
      if (p.feedUrl && canonical && getCanonicalPodcastId(p.feedUrl) === canonical) return false;
      return true;
    });
  } else {
    const newSub: Podcast = {
      id: canonical || targetId,
      title: podcast.title,
      author: podcast.author || 'Inconnu',
      description: podcast.description || '',
      feedUrl: podcast.feedUrl,
      artworkUrl: podcast.artworkUrl || '',
      categories: podcast.categories || [],
      isSubscribed: true,
    };
    updated = [newSub, ...subs];
  }

  saveSubscribedPodcasts(updated);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('keokaster_subs_changed', {
        detail: { podcastId: canonical, isSubscribed: !exists },
      })
    );
  }

  return !exists;
}

export function getPlaybackPositions(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(POSITIONS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function savePlaybackPosition(episodeId: string, seconds: number): void {
  if (typeof window === 'undefined') return;
  try {
    const map = getPlaybackPositions();
    map[episodeId] = Math.round(seconds);
    localStorage.setItem(POSITIONS_KEY, JSON.stringify(map));
  } catch {}
}

export function getQueue(): Episode[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveQueue(queue: Episode[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {}
}

export function getPlayedEpisodeIds(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PLAYED_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markEpisodePlayed(episodeId: string, played: boolean = true): void {
  if (typeof window === 'undefined') return;
  try {
    const list = getPlayedEpisodeIds();
    const set = new Set(list);
    if (played) set.add(episodeId);
    else set.delete(episodeId);
    localStorage.setItem(PLAYED_KEY, JSON.stringify(Array.from(set)));
  } catch {}
}

export function getGlobalAdSettings(): GlobalAdSettings {
  if (typeof window === 'undefined') return DEFAULT_GLOBAL_AD_SETTINGS;
  try {
    const raw = localStorage.getItem(AD_SETTINGS_KEY);
    return raw ? { ...DEFAULT_GLOBAL_AD_SETTINGS, ...JSON.parse(raw) } : DEFAULT_GLOBAL_AD_SETTINGS;
  } catch {
    return DEFAULT_GLOBAL_AD_SETTINGS;
  }
}

export function saveGlobalAdSettings(settings: GlobalAdSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(AD_SETTINGS_KEY, JSON.stringify(settings));
  } catch {}
}

export function getPodcastSettings(podcastId: string): PodcastSettings {
  const global = getGlobalAdSettings();
  if (typeof window === 'undefined') {
    return {
      autoSkipIntroSec: 0,
      autoSkipOutroSec: 0,
      adBlockEnabled: global.enabled,
    };
  }
  try {
    const raw = localStorage.getItem(PODCAST_SETTINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const canonical = getCanonicalPodcastId(podcastId);
    const found = map[podcastId] || (canonical ? map[canonical] : undefined);
    if (found) {
      return {
        autoSkipIntroSec: found.autoSkipIntroSec ?? 0,
        autoSkipOutroSec: found.autoSkipOutroSec ?? 0,
        adBlockEnabled: found.adBlockEnabled !== undefined ? found.adBlockEnabled : global.enabled,
        sortOrder: found.sortOrder,
      };
    }

    return {
      autoSkipIntroSec: 0,
      autoSkipOutroSec: 0,
      adBlockEnabled: global.enabled,
    };
  } catch {
    return {
      autoSkipIntroSec: 0,
      autoSkipOutroSec: 0,
      adBlockEnabled: global.enabled,
    };
  }
}

export function savePodcastSettings(podcastId: string, settings: PodcastSettings, feedUrl?: string): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PODCAST_SETTINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[podcastId] = settings;
    const canonical = getCanonicalPodcastId(podcastId);
    if (canonical) {
      map[canonical] = settings;
    }
    if (feedUrl) {
      map[feedUrl] = settings;
      const cFeed = getCanonicalPodcastId(feedUrl);
      if (cFeed) map[cFeed] = settings;
    }
    localStorage.setItem(PODCAST_SETTINGS_KEY, JSON.stringify(map));

    window.dispatchEvent(new CustomEvent('keokaster_podcast_settings_changed', {
      detail: { podcastId, settings },
    }));
  } catch {}
}

export interface ExcludedPodcastItem {
  id: string;
  settings: PodcastSettings;
  podcast?: Podcast;
}

export function getAllExcludedPodcastSettings(): ExcludedPodcastItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PODCAST_SETTINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    const subs = getSubscribedPodcasts();
    const seen = new Set<string>();
    const result: ExcludedPodcastItem[] = [];

    Object.entries(map).forEach(([key, val]: [string, any]) => {
      if (val && val.adBlockEnabled === false) {
        // Déduplication (éviter d'afficher à la fois l'id et le feedUrl)
        const canonical = getCanonicalPodcastId(key) || key;
        if (!seen.has(canonical)) {
          seen.add(canonical);
          const matchedPodcast = subs.find(
            (s) => s.id === key || s.feedUrl === key || getCanonicalPodcastId(s.feedUrl) === canonical
          );
          result.push({
            id: key,
            settings: val,
            podcast: matchedPodcast,
          });
        }
      }
    });
    return result;
  } catch {
    return [];
  }
}

export function removePodcastExclusion(podcastId: string): void {
  const current = getPodcastSettings(podcastId);
  savePodcastSettings(podcastId, { ...current, adBlockEnabled: true });
}

// ==================== GESTION DES PLAYLISTS ====================

export const DEFAULT_PLAYLIST_ID = 'pl_default_selection';
export const DEFAULT_PLAYLIST_NAME = 'Ma Playlist (Par défaut)';

export function getPlaylists(): Playlist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(PLAYLISTS_KEY);
    let list: Playlist[] = raw ? JSON.parse(raw) : [];

    // Garantir que la playlist par défaut existe toujours
    const hasDefault = list.some((p) => p.id === DEFAULT_PLAYLIST_ID);
    if (!hasDefault) {
      const defaultPl: Playlist = {
        id: DEFAULT_PLAYLIST_ID,
        name: DEFAULT_PLAYLIST_NAME,
        description: 'Votre playlist par défaut en accès rapide',
        createdAt: new Date().toISOString(),
        episodes: [],
      };
      list = [defaultPl, ...list];
      localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(list));
    }

    return list;
  } catch {
    return [];
  }
}

export function getDefaultPlaylist(): Playlist {
  const list = getPlaylists();
  const found = list.find((p) => p.id === DEFAULT_PLAYLIST_ID);
  if (found) return found;

  const defaultPl: Playlist = {
    id: DEFAULT_PLAYLIST_ID,
    name: DEFAULT_PLAYLIST_NAME,
    description: 'Votre playlist par défaut en accès rapide',
    createdAt: new Date().toISOString(),
    episodes: [],
  };
  savePlaylists([defaultPl, ...list]);
  return defaultPl;
}

export function savePlaylists(list: Playlist[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(PLAYLISTS_KEY, JSON.stringify(list));
    window.dispatchEvent(new CustomEvent('keokaster_playlists_changed'));
  } catch {}
}

export function createPlaylist(name: string, description?: string): Playlist {
  const trimmed = name.trim();
  const newPl: Playlist = {
    id: `pl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
    name: trimmed || 'Ma Playlist',
    description: description?.trim() || '',
    createdAt: new Date().toISOString(),
    episodes: [],
  };
  const list = getPlaylists();
  savePlaylists([newPl, ...list]);
  return newPl;
}

export function deletePlaylist(playlistId: string): void {
  const list = getPlaylists();
  // Ne jamais supprimer la playlist par défaut : on vide simplement ses épisodes
  if (playlistId === DEFAULT_PLAYLIST_ID) {
    const reset = list.map((p) =>
      p.id === DEFAULT_PLAYLIST_ID ? { ...p, episodes: [] } : p
    );
    savePlaylists(reset);
    return;
  }
  const updated = list.filter((p) => p.id !== playlistId);
  savePlaylists(updated);
}

export function addEpisodeToPlaylist(playlistId: string, episode: Episode): boolean {
  const list = getPlaylists();
  const idx = list.findIndex((p) => p.id === playlistId);
  if (idx === -1) return false;

  const pl = list[idx];
  // Éviter d'ajouter deux fois le même épisode dans la playlist
  if (pl.episodes.some((e) => e.id === episode.id)) {
    return false;
  }

  const updatedPl = {
    ...pl,
    episodes: [...pl.episodes, episode],
  };

  list[idx] = updatedPl;
  savePlaylists(list);
  return true;
}

export function addEpisodeToDefaultPlaylist(episode: Episode): { success: boolean; alreadyIn: boolean; playlistName: string } {
  const def = getDefaultPlaylist();
  const success = addEpisodeToPlaylist(def.id, episode);
  return {
    success,
    alreadyIn: !success,
    playlistName: def.name,
  };
}

export function removeEpisodeFromPlaylist(playlistId: string, episodeId: string): void {
  const list = getPlaylists();
  const idx = list.findIndex((p) => p.id === playlistId);
  if (idx === -1) return;

  const pl = list[idx];
  const updatedEpisodes = pl.episodes.filter((e) => e.id !== episodeId);
  list[idx] = { ...pl, episodes: updatedEpisodes };
  savePlaylists(list);
}
