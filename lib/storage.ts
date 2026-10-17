import { Podcast, Episode, GlobalAdSettings, PodcastSettings } from '@/types/podcast';
import { DEFAULT_GLOBAL_AD_SETTINGS } from './adBlocker';

const SUBS_KEY = 'keokaster_subscriptions_v1';
const POSITIONS_KEY = 'keokaster_positions_v1';
const QUEUE_KEY = 'keokaster_queue_v1';
const PLAYED_KEY = 'keokaster_played_v1';
const AD_SETTINGS_KEY = 'keokaster_ad_settings_v1';
const PODCAST_SETTINGS_KEY = 'keokaster_podcast_settings_v1';

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

export function isPodcastSubscribed(podcastId: string): boolean {
  const subs = getSubscribedPodcasts();
  return subs.some((p) => p.id === podcastId);
}

export function togglePodcastSubscription(podcast: Podcast): boolean {
  const subs = getSubscribedPodcasts();
  const exists = subs.some((p) => p.id === podcast.id);
  let updated: Podcast[];
  if (exists) {
    updated = subs.filter((p) => p.id !== podcast.id);
  } else {
    updated = [{ ...podcast, isSubscribed: true }, ...subs];
  }
  saveSubscribedPodcasts(updated);
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
      autoSkipIntroSec: global.defaultIntroSkipSec,
      autoSkipOutroSec: global.defaultOutroSkipSec,
      adBlockEnabled: global.enabled,
    };
  }
  try {
    const raw = localStorage.getItem(PODCAST_SETTINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    return map[podcastId] || {
      autoSkipIntroSec: global.defaultIntroSkipSec,
      autoSkipOutroSec: global.defaultOutroSkipSec,
      adBlockEnabled: global.enabled,
    };
  } catch {
    return {
      autoSkipIntroSec: global.defaultIntroSkipSec,
      autoSkipOutroSec: global.defaultOutroSkipSec,
      adBlockEnabled: global.enabled,
    };
  }
}

export function savePodcastSettings(podcastId: string, settings: PodcastSettings): void {
  if (typeof window === 'undefined') return;
  try {
    const raw = localStorage.getItem(PODCAST_SETTINGS_KEY);
    const map = raw ? JSON.parse(raw) : {};
    map[podcastId] = settings;
    localStorage.setItem(PODCAST_SETTINGS_KEY, JSON.stringify(map));
  } catch {}
}
