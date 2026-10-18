import { Chapter, AdSegment, PodcastSettings, GlobalAdSettings } from '@/types/podcast';

export const AD_KEYWORDS = [
  'sponsor',
  'sponsoring',
  'partenaire',
  'publicité',
  'publicite',
  'pub',
  'promo',
  'promotion',
  'break',
  'ad break',
  'commercial',
  'annonce',
  'pause pub',
  'coupure pub',
  'message commercial',
  'partenariat',
];

export const DEFAULT_GLOBAL_AD_SETTINGS: GlobalAdSettings = {
  enabled: true,
  defaultIntroSkipSec: 0, // Désactivé par défaut (0s) pour préserver le début réel de chaque épisode
  defaultOutroSkipSec: 0, // Désactivé par défaut (0s)
  crowdsourcedSkipEnabled: true,
  smartKeywordDetection: true,
  showNotificationOnSkip: true,
};

const LOCAL_AD_MARKERS_KEY = 'keokaster_local_ad_markers_v1';

export function isChapterAd(title: string): boolean {
  if (!title) return false;
  const clean = title.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
  return AD_KEYWORDS.some((kw) => {
    const reg = new RegExp(`(^|\\b|\\s|#|\\[|\\()${kw}(\\b|\\s|#|\\]|\\)|$)`, 'i');
    return reg.test(clean);
  });
}

export function getLocalAdMarkers(): Record<string, AdSegment[]> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(LOCAL_AD_MARKERS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function saveLocalAdMarker(episodeId: string, segment: AdSegment): void {
  if (typeof window === 'undefined') return;
  try {
    const markers = getLocalAdMarkers();
    const existing = markers[episodeId] || [];
    markers[episodeId] = [...existing, segment];
    localStorage.setItem(LOCAL_AD_MARKERS_KEY, JSON.stringify(markers));
  } catch (err) {
    console.error('Erreur sauvegarde ad marker:', err);
  }
}

export function buildAdSegments(
  episodeId: string,
  durationSec: number,
  chapters?: Chapter[],
  podcastSettings?: PodcastSettings,
  globalSettings: GlobalAdSettings = DEFAULT_GLOBAL_AD_SETTINGS
): AdSegment[] {
  if (!globalSettings.enabled) return [];
  const segments: AdSegment[] = [];

  // 1. Saut d'intro configurable
  const introSkip = podcastSettings?.autoSkipIntroSec ?? globalSettings.defaultIntroSkipSec;
  if (introSkip > 0 && durationSec > introSkip * 2) {
    segments.push({
      id: `intro-${episodeId}`,
      startTime: 0,
      endTime: introSkip,
      type: 'intro',
      label: `Saut d'introduction (${introSkip}s)`,
    });
  }

  // 2. Détection par les chapitres marqués comme pubs ou contenant des mots-clés
  if (globalSettings.smartKeywordDetection && chapters && chapters.length > 0) {
    chapters.forEach((chap, idx) => {
      const isAd = chap.isAd || isChapterAd(chap.title);
      if (isAd) {
        const nextChap = chapters[idx + 1];
        const end = chap.endTime || (nextChap ? nextChap.startTime : chap.startTime + 60);
        segments.push({
          id: `chap-${idx}-${episodeId}`,
          startTime: chap.startTime,
          endTime: end,
          type: 'sponsor',
          label: `Sponsor : ${chap.title}`,
        });
      }
    });
  }

  // 3. Segments communautaires / locaux enregistrés
  if (globalSettings.crowdsourcedSkipEnabled) {
    const localMap = getLocalAdMarkers();
    const locals = localMap[episodeId];
    if (locals && locals.length > 0) {
      segments.push(...locals);
    }
  }

  // 4. Saut d'outro configurable
  const outroSkip = podcastSettings?.autoSkipOutroSec ?? globalSettings.defaultOutroSkipSec;
  if (outroSkip > 0 && durationSec > outroSkip * 2) {
    segments.push({
      id: `outro-${episodeId}`,
      startTime: Math.max(0, durationSec - outroSkip),
      endTime: durationSec,
      type: 'outro',
      label: `Saut de fin d'épisode (${outroSkip}s)`,
    });
  }

  // Trier par heure de début et fusionner les segments qui se chevauchent
  return mergeOverlappingSegments(segments.sort((a, b) => a.startTime - b.startTime));
}

function mergeOverlappingSegments(segments: AdSegment[]): AdSegment[] {
  if (segments.length <= 1) return segments;
  const merged: AdSegment[] = [segments[0]];

  for (let i = 1; i < segments.length; i++) {
    const prev = merged[merged.length - 1];
    const curr = segments[i];

    if (curr.startTime <= prev.endTime) {
      prev.endTime = Math.max(prev.endTime, curr.endTime);
      prev.label = `${prev.label} & ${curr.label}`;
    } else {
      merged.push(curr);
    }
  }

  return merged;
}

export interface AdSkipCheckResult {
  shouldSkip: boolean;
  seekTargetSec?: number;
  segment?: AdSegment;
}

export function checkAdSkip(
  currentTimeSec: number,
  segments: AdSegment[]
): AdSkipCheckResult {
  for (const seg of segments) {
    // Si la tête de lecture est entrée dans un segment publicitaire
    if (currentTimeSec >= seg.startTime && currentTimeSec < seg.endTime - 0.5) {
      return {
        shouldSkip: true,
        seekTargetSec: seg.endTime + 0.1,
        segment: seg,
      };
    }
  }
  return { shouldSkip: false };
}
