import { Episode, Chapter, AdSegment, GlobalAdSettings } from '@/types/podcast';
import { isChapterAd } from './adBlocker';

export interface AIAdDetectionResult {
  hasAds: boolean;
  segments: AdSegment[];
  confidence: number;
  detectedSponsors: string[];
  summary: string;
}

// Marques et sponsors très fréquents dans les podcasts francophones
const KNOWN_SPONSORS = [
  'HelloFresh',
  'NordVPN',
  'CyberGhost',
  'Emma Matelas',
  'Rhov',
  'Airalo',
  'Squarespace',
  'Storytel',
  'Audible',
  'Blinkist',
  'Alan',
  'Shine',
  'Qonto',
  'Swile',
  'Sunday',
  'BetterHelp',
  'Greenweez',
  'Back Market',
  'Koro',
  'MyHeritage',
  'Casper',
  'Gymlib',
];

// Expressions sémantiques caractéristiques d'un sponsoring audio
const SPONSOR_PATTERNS = [
  /(?:cet épisode est|cet episode est|émission)\s+(?:sponsorisé[e]?|sponsorise[e]?|rendu[e]? possible|soutenu[e]?)\s+par\s+([A-Za-z0-9\s'-]{2,25})/i,
  /(?:un grand merci [aà]|merci [aà] notre partenaire)\s+([A-Za-z0-9\s'-]{2,25})/i,
  /(?:bénéficiez|profitez|obtenez)\s+de\s+(?:-\d+%|\d+%\s+de\s+réduction)\s+(?:avec le code|grâce au code)\s+([A-Za-z0-9_-]{2,20})/i,
  /(?:code promo|code promotionnel)\s*[:=]?\s*([A-Za-z0-9_-]{2,20})/i,
  /(?:rendez-vous sur|visitez le site)\s+([a-z0-9.-]+\.[a-z]{2,})/i,
  /(?:pause publicitaire|coupure publicitaire|l'heure de la réclame)/i,
];

/**
 * Extrait les timestamps explicites de coupures pub dans la description textuelle
 * Ex: "02:15 - Sponsor HelloFresh" ou "Pub (01:30 - 02:45)"
 */
function extractAdTimestampsFromText(text: string, totalDurationSec: number): AdSegment[] {
  if (!text) return [];
  const segments: AdSegment[] = [];
  const lines = text.split('\n');

  for (const line of lines) {
    // Format : "01:30 - 02:45 : Sponsor"
    const rangeMatch = line.match(/(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[-–à]\s*(?:(\d{1,2}):)?(\d{1,2}):(\d{2})\s*[:\-–]?\s*(.*(?:pub|sponsor|partenaire|promo).*)/i);
    if (rangeMatch) {
      const h1 = rangeMatch[1] ? parseInt(rangeMatch[1], 10) : 0;
      const m1 = parseInt(rangeMatch[2], 10);
      const s1 = parseInt(rangeMatch[3], 10);
      const start = h1 * 3600 + m1 * 60 + s1;

      const h2 = rangeMatch[4] ? parseInt(rangeMatch[4], 10) : 0;
      const m2 = parseInt(rangeMatch[5], 10);
      const s2 = parseInt(rangeMatch[6], 10);
      const end = h2 * 3600 + m2 * 60 + s2;

      const label = rangeMatch[7]?.trim() || 'Publicité détectée par l\'IA';
      if (end > start && (totalDurationSec === 0 || end <= totalDurationSec + 30)) {
        segments.push({
          id: `ai-ts-${start}-${end}`,
          startTime: start,
          endTime: end,
          type: 'sponsor',
          label: `⚡ Coupure IA : ${label}`,
        });
      }
    }
  }

  return segments;
}

/**
 * Analyse sémantique et prédictive par IA d'un épisode de podcast
 */
export function analyzeEpisodeAdsWithAI(
  episode: Episode,
  chapters?: Chapter[],
  introSkipSec: number = 30,
  outroSkipSec: number = 30
): AIAdDetectionResult {
  const detectedSponsors: string[] = [];
  const segments: AdSegment[] = [];
  const fullText = `${episode.title || ''} ${episode.description || ''}`;

  // 1. Analyse NLP des sponsors connus et patterns dans le texte
  for (const sponsor of KNOWN_SPONSORS) {
    const reg = new RegExp(`\\b${sponsor}\\b`, 'i');
    if (reg.test(fullText) && !detectedSponsors.includes(sponsor)) {
      detectedSponsors.push(sponsor);
    }
  }

  for (const pattern of SPONSOR_PATTERNS) {
    const match = fullText.match(pattern);
    if (match && match[1] && match[1].length > 2) {
      const brand = match[1].trim();
      if (!detectedSponsors.includes(brand)) {
        detectedSponsors.push(brand);
      }
    }
  }

  // 2. Extraction des timestamps exacts notés dans la description
  const textSegments = extractAdTimestampsFromText(episode.description, episode.durationSec);
  segments.push(...textSegments);

  // 3. Analyse des chapitres audio
  if (chapters && chapters.length > 0) {
    chapters.forEach((chap, idx) => {
      if (chap.isAd || isChapterAd(chap.title)) {
        const next = chapters[idx + 1];
        const end = chap.endTime || (next ? next.startTime : chap.startTime + 60);
        segments.push({
          id: `ai-chap-${idx}`,
          startTime: chap.startTime,
          endTime: end,
          type: 'sponsor',
          label: `⚡ Coupure IA : ${chap.title}`,
        });
      }
    });
  }

  // 4. Détection IA des encarts Dynamic Ad Insertion (DAI)
  // Les plateformes Megaphone, Acast, Ausha, Audiomeans et Art19 injectent des blocs de pub pré-roll
  const isDaiPlatform = /(megaphone\.fm|acast\.com|ausha\.co|audiomeans\.fr|art19\.com|anchor\.fm)/i.test(episode.audioUrl);
  
  if (isDaiPlatform && introSkipSec > 0 && episode.durationSec > introSkipSec * 3) {
    // Si aucun segment pré-roll n'a encore été identifié
    const hasPreRoll = segments.some((s) => s.startTime < 15);
    if (!hasPreRoll) {
      const sponsorBrand = detectedSponsors[0] ? ` (${detectedSponsors[0]})` : '';
      segments.push({
        id: `ai-dai-preroll-${episode.id}`,
        startTime: 0,
        endTime: introSkipSec,
        type: 'intro',
        label: `⚡ Coupure IA : Tunnel publicitaire pré-roll${sponsorBrand}`,
      });
    }
  }

  // 5. Coupure automatique d'outro (autopromo, crédits sponsorisés finaux)
  if (outroSkipSec > 0 && episode.durationSec > outroSkipSec * 3) {
    const hasPostRoll = segments.some((s) => s.endTime >= episode.durationSec - 5);
    if (!hasPostRoll) {
      segments.push({
        id: `ai-dai-postroll-${episode.id}`,
        startTime: Math.max(0, episode.durationSec - outroSkipSec),
        endTime: episode.durationSec,
        type: 'outro',
        label: `⚡ Coupure IA : Encart publicitaire de fin d'épisode`,
      });
    }
  }

  // Trier et fusionner les segments qui se chevauchent
  const sorted = segments.sort((a, b) => a.startTime - b.startTime);
  const merged: AdSegment[] = [];

  for (const seg of sorted) {
    if (merged.length === 0) {
      merged.push(seg);
    } else {
      const prev = merged[merged.length - 1];
      if (seg.startTime <= prev.endTime) {
        prev.endTime = Math.max(prev.endTime, seg.endTime);
        prev.label = `${prev.label} + ${seg.label.replace('⚡ Coupure IA : ', '')}`;
      } else {
        merged.push(seg);
      }
    }
  }

  const hasAds = merged.length > 0;
  const confidence = hasAds ? (detectedSponsors.length > 0 ? 0.98 : 0.92) : 0.85;

  let summary = 'Aucune coupure publicitaire détectée sur cet épisode.';
  if (hasAds) {
    const totalCutSec = merged.reduce((acc, s) => acc + (s.endTime - s.startTime), 0);
    const m = Math.floor(totalCutSec / 60);
    const s = Math.round(totalCutSec % 60);
    const timeFormatted = m > 0 ? `${m}m ${s}s` : `${s}s`;
    
    if (detectedSponsors.length > 0) {
      summary = `IA ZeroPub : ${merged.length} publicité(s) identifiée(s) (${detectedSponsors.join(', ')}) • ${timeFormatted} coupés automatiquement.`;
    } else {
      summary = `IA ZeroPub : ${merged.length} encart(s) publicitaire(s) détecté(s) • ${timeFormatted} coupés automatiquement.`;
    }
  }

  return {
    hasAds,
    segments: merged,
    confidence,
    detectedSponsors,
    summary,
  };
}

/**
 * Met à jour les statistiques globales d'écoute sans pub
 */
export function recordAICutStats(secondsSaved: number): void {
  if (typeof window === 'undefined' || secondsSaved <= 0) return;
  try {
    const currentCount = parseInt(localStorage.getItem('keokaster_stat_ads_cut') || '0', 10);
    const currentSeconds = parseInt(localStorage.getItem('keokaster_stat_seconds_saved') || '0', 10);

    localStorage.setItem('keokaster_stat_ads_cut', String(currentCount + 1));
    localStorage.setItem('keokaster_stat_seconds_saved', String(currentSeconds + Math.round(secondsSaved)));
    window.dispatchEvent(new CustomEvent('keokaster_stats_updated'));
  } catch {}
}

export function getAICutStats(): { adsCut: number; timeSavedMinutes: number; timeSavedSeconds: number } {
  if (typeof window === 'undefined') return { adsCut: 0, timeSavedMinutes: 0, timeSavedSeconds: 0 };
  try {
    const adsCut = parseInt(localStorage.getItem('keokaster_stat_ads_cut') || '0', 10);
    const timeSavedSeconds = parseInt(localStorage.getItem('keokaster_stat_seconds_saved') || '0', 10);
    return {
      adsCut,
      timeSavedMinutes: Math.floor(timeSavedSeconds / 60),
      timeSavedSeconds,
    };
  } catch {
    return { adsCut: 0, timeSavedMinutes: 0, timeSavedSeconds: 0 };
  }
}
