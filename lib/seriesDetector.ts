import { Episode } from '@/types/podcast';

export interface SeriesPartInfo {
  isSeries: boolean;
  partNumber: number;
  totalParts?: number;
  seriesKey: string;
  seriesTitle: string;
  badgeLabel: string; // e.g. "1/4", "Partie 1", "2/3"
}

export interface SeriesGroup {
  id: string;
  title: string;
  totalParts: number;
  episodes: Episode[]; // Sorted in ascending order (Part 1, Part 2, etc.)
  isComplete: boolean;
}

/**
 * Normalise une chaîne de titre pour isoler la clé de série
 */
function cleanTitle(str: string): string {
  return str
    .replace(/[«»"'\(\)\[\]\-–—\:\.\,]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

/**
 * Détecte si un titre d'épisode contient un marqueur de série / saga en plusieurs épisodes
 * Exemples supportés :
 * - "L'affaire Untel 1/4" ou "1/4 - L'affaire Untel"
 * - "L'affaire Untel (2/4)" ou "[3/4] Le dénouement"
 * - "Affaires sensibles - Partie 1 sur 4" ou "Partie 2/3"
 * - "Épisode 1/5" ou "Ep. 2/4"
 * - "1ère partie : L'enquête" ou "2ème partie : Le procès"
 */
export function detectSeriesPart(title: string): SeriesPartInfo {
  const notSeries: SeriesPartInfo = {
    isSeries: false,
    partNumber: 0,
    seriesKey: '',
    seriesTitle: '',
    badgeLabel: '',
  };

  if (!title || typeof title !== 'string') return notSeries;

  // 1. Détection de fractions encadrées entre parenthèses ou crochets : (1/4), [2/3], (Partie 3/4)
  const bracketFractionMatch = title.match(/[\[\(]\s*(?:partie\s*|part\s*|épisode\s*|ep\s*|volet\s*)?(\d+)\s*\/\s*(\d+)\s*[\]\)]/i);
  if (bracketFractionMatch) {
    const partNumber = parseInt(bracketFractionMatch[1], 10);
    const totalParts = parseInt(bracketFractionMatch[2], 10);

    if (partNumber > 0 && totalParts > 0 && partNumber <= totalParts && totalParts <= 60) {
      const strippedTitle = title.replace(bracketFractionMatch[0], '').replace(/\s{2,}/g, ' ').replace(/^[\s\:\-\–—]+|[\s\:\-\–—]+$/g, '').trim();
      return {
        isSeries: true,
        partNumber,
        totalParts,
        seriesKey: cleanTitle(strippedTitle),
        seriesTitle: strippedTitle || title,
        badgeLabel: `${partNumber}/${totalParts}`,
      };
    }
  }

  // 2. Détection de fractions standard : "1/4", "- 2/4 -", ": 3/4"
  // On s'assure qu'il ne s'agit pas d'une date (pas de troisième segment "/2024" ou "/24")
  const standardFractionMatch = title.match(/(?:^|[\s\-\–—\:\#\|])(?:partie\s*|part\s*|épisode\s*|ep\s*|volet\s*)?(\d+)\s*\/\s*(\d+)(?![\d\/])(?:[\s\-\–—\:\#\|]|$)/i);
  if (standardFractionMatch) {
    const partNumber = parseInt(standardFractionMatch[1], 10);
    const totalParts = parseInt(standardFractionMatch[2], 10);

    // Rejeter les fausses dates (ex: 12/04 où part > total, ou jours de l'année)
    if (partNumber > 0 && totalParts > 0 && partNumber <= totalParts && totalParts <= 60) {
      const strippedTitle = title.replace(standardFractionMatch[0], ' - ').replace(/\s{2,}/g, ' ').replace(/^[\s\:\-\–—]+|[\s\:\-\–—]+$/g, '').trim();
      return {
        isSeries: true,
        partNumber,
        totalParts,
        seriesKey: cleanTitle(strippedTitle),
        seriesTitle: strippedTitle || title,
        badgeLabel: `${partNumber}/${totalParts}`,
      };
    }
  }

  // 3. Détection de "Partie X sur Y", "Volet X sur Y", "Épisode X sur Y"
  const surMatch = title.match(/(?:partie|part|épisode|episode|volet|chapitre|acte)\s*(\d+)\s*(?:sur|\/)\s*(\d+)/i);
  if (surMatch) {
    const partNumber = parseInt(surMatch[1], 10);
    const totalParts = parseInt(surMatch[2], 10);

    if (partNumber > 0 && totalParts > 0 && partNumber <= totalParts && totalParts <= 60) {
      const strippedTitle = title.replace(surMatch[0], '').replace(/\s{2,}/g, ' ').replace(/^[\s\:\-\–—]+|[\s\:\-\–—]+$/g, '').trim();
      return {
        isSeries: true,
        partNumber,
        totalParts,
        seriesKey: cleanTitle(strippedTitle),
        seriesTitle: strippedTitle || title,
        badgeLabel: `${partNumber}/${totalParts}`,
      };
    }
  }

  // 4. Détection de "Partie X", "Volet X", "Chapitre X" sans total explicite
  const singlePartMatch = title.match(/(?:^|[\s\-\–—\:\(\[])(?:partie|part|volet|chapitre|acte)\s*(\d+)(?:[\s\-\–—\:\)\]]|$)/i);
  if (singlePartMatch) {
    const partNumber = parseInt(singlePartMatch[1], 10);
    if (partNumber > 0 && partNumber <= 60) {
      const strippedTitle = title.replace(singlePartMatch[0], ' ').replace(/\s{2,}/g, ' ').replace(/^[\s\:\-\–—]+|[\s\:\-\–—]+$/g, '').trim();
      return {
        isSeries: true,
        partNumber,
        seriesKey: cleanTitle(strippedTitle),
        seriesTitle: strippedTitle || title,
        badgeLabel: `Partie ${partNumber}`,
      };
    }
  }

  // 5. Détection d'ordinaux français : "1ère partie", "2ème partie", "3e partie"
  const ordinalMatch = title.match(/(\d+)(?:ère|ere|er|ème|eme|e|re)\s*(?:partie|part|volet|chapitre)/i);
  if (ordinalMatch) {
    const partNumber = parseInt(ordinalMatch[1], 10);
    if (partNumber > 0 && partNumber <= 60) {
      const strippedTitle = title.replace(ordinalMatch[0], ' ').replace(/\s{2,}/g, ' ').replace(/^[\s\:\-\–—]+|[\s\:\-\–—]+$/g, '').trim();
      return {
        isSeries: true,
        partNumber,
        seriesKey: cleanTitle(strippedTitle),
        seriesTitle: strippedTitle || title,
        badgeLabel: `Partie ${partNumber}`,
      };
    }
  }

  return notSeries;
}

/**
 * Regroupe les épisodes d'un podcast en séries détectées
 */
export function detectSeriesGroups(episodes: Episode[]): SeriesGroup[] {
  const groupsMap = new Map<string, { title: string; totalParts: number; episodes: Episode[] }>();

  episodes.forEach((ep) => {
    const info = detectSeriesPart(ep.title);
    if (!info.isSeries) return;

    // Calcul d'une clé de groupe : si un titre de série a été extrait, on utilise cette racine
    // Sinon on utilise les premiers mots significatifs
    const key = info.seriesKey.length >= 4 ? info.seriesKey : cleanTitle(ep.podcastTitle) + `_${info.totalParts || 'saga'}`;

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        title: info.seriesTitle || ep.title,
        totalParts: info.totalParts || 0,
        episodes: [],
      });
    }

    const group = groupsMap.get(key)!;
    // Éviter les doublons
    if (!group.episodes.some((e) => e.id === ep.id)) {
      group.episodes.push(ep);
    }
    if (info.totalParts && info.totalParts > group.totalParts) {
      group.totalParts = info.totalParts;
    }
  });

  const result: SeriesGroup[] = [];

  groupsMap.forEach((g, key) => {
    // Une série est retenue si elle a au moins 2 épisodes OU un totalParts >= 2
    if (g.episodes.length >= 2 || (g.totalParts >= 2 && g.episodes.length >= 1)) {
      // Trier les épisodes du groupe dans l'ordre croissant (Partie 1, Partie 2, etc.)
      const sorted = [...g.episodes].sort((a, b) => {
        const infoA = detectSeriesPart(a.title);
        const infoB = detectSeriesPart(b.title);
        if (infoA.partNumber !== infoB.partNumber) {
          return infoA.partNumber - infoB.partNumber;
        }
        // En cas d'égalité, ordre chronologique
        return new Date(a.pubDate).getTime() - new Date(b.pubDate).getTime();
      });

      result.push({
        id: `series_${key}`,
        title: g.title,
        totalParts: g.totalParts || sorted.length,
        episodes: sorted,
        isComplete: g.totalParts > 0 ? sorted.length >= g.totalParts : true,
      });
    }
  });

  return result;
}

/**
 * Trie une liste d'épisodes selon le mode sélectionné :
 * - 'newest' : Les plus récents en premier (ordre standard du flux RSS)
 * - 'oldest' : Les plus anciens en premier (ordre chronologique de parution)
 * - 'series' : Les épisodes en plusieurs parties (1/4, 2/4...) sont regroupés et classés dans l'ordre (1 ➔ 2 ➔ 3 ➔ 4)
 */
export function sortEpisodes(
  episodes: Episode[],
  mode: 'newest' | 'oldest' | 'series'
): Episode[] {
  if (!episodes || episodes.length === 0) return [];

  if (mode === 'newest') {
    return [...episodes].sort((a, b) => {
      const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return timeB - timeA;
    });
  }

  if (mode === 'oldest') {
    return [...episodes].sort((a, b) => {
      const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
      const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
      return timeA - timeB;
    });
  }

  // MODE 'series' : Regroupe chaque saga dans l'ordre croissant (Partie 1 ➔ 2 ➔ 3 ➔ 4)
  const seriesGroups = detectSeriesGroups(episodes);
  const episodeToGroup = new Map<string, SeriesGroup>();

  seriesGroups.forEach((grp) => {
    grp.episodes.forEach((ep) => {
      episodeToGroup.set(ep.id, grp);
    });
  });

  const handledGroupIds = new Set<string>();
  const result: Episode[] = [];

  // Parcourir les épisodes récents pour placer les sagas à leur position d'actualité
  const baseOrder = [...episodes].sort((a, b) => {
    const timeA = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const timeB = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return timeB - timeA;
  });

  baseOrder.forEach((ep) => {
    const grp = episodeToGroup.get(ep.id);
    if (!grp) {
      result.push(ep);
    } else {
      if (!handledGroupIds.has(grp.id)) {
        handledGroupIds.add(grp.id);
        // Injecte tous les épisodes de la série dans l'ordre 1 ➔ 2 ➔ 3 ➔ 4 !
        result.push(...grp.episodes);
      }
    }
  });

  return result;
}
