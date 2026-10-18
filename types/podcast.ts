export interface Chapter {
  title: string;
  startTime: number; // in seconds
  endTime?: number;  // in seconds
  isAd?: boolean;
  url?: string;
  image?: string;
}

export interface AdSegment {
  id: string;
  startTime: number;
  endTime: number;
  type: 'intro' | 'sponsor' | 'outro' | 'manual';
  label: string;
}

export interface Episode {
  id: string;
  podcastId: string;
  podcastTitle: string;
  podcastArtwork: string;
  title: string;
  description: string;
  audioUrl: string;
  durationSec: number;
  pubDate: string;
  author?: string;
  artworkUrl?: string;
  chapters?: Chapter[];
  adSegments?: AdSegment[];
  playbackPositionSec?: number;
  isPlayed?: boolean;
}

export interface PodcastSettings {
  autoSkipIntroSec: number;
  autoSkipOutroSec: number;
  customSpeed?: number;
  adBlockEnabled: boolean;
  trimSilenceEnabled?: boolean;
  sortOrder?: 'newest' | 'oldest' | 'series';
}

export interface Podcast {
  id: string;
  title: string;
  author: string;
  description: string;
  feedUrl: string;
  artworkUrl: string;
  categories: string[];
  episodeCount?: number;
  websiteUrl?: string;
  isSubscribed?: boolean;
  subscribedAt?: string;
  settings?: PodcastSettings;
}

export interface GlobalAdSettings {
  enabled: boolean;
  defaultIntroSkipSec: number;
  defaultOutroSkipSec: number;
  crowdsourcedSkipEnabled: boolean;
  smartKeywordDetection: boolean;
  showNotificationOnSkip: boolean;
}

export interface Playlist {
  id: string;
  name: string;
  description?: string;
  createdAt: string;
  episodes: Episode[];
}
