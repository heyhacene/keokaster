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
 * Normalise une chaîne de titre pour isoler la clé alphanumérique
 */
function cleanKey(str: string): string {
  return str
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

/**
 * Nettoie les préfixes parasites fréquents (ex: "INÉDIT -", "BABABAM ORIGINALS |", "REDIFFUSION :", etc.)
 */
function cleanNoisePrefixes(title: string): string {
  return title
    .replace(/^(?:\s*\[?[^\]]*?(?:ORIGINALS|EXCLU|INEDIT|INDIT|REDIFFUSION|PODCAST|BABABAM)[^\]]*?\]?\s*[\-–—\|:]?\s*)+/i, '')
    .trim();
}

/**
 * Détecte si un titre d'épisode contient un marqueur de série / saga en plusieurs épisodes
 * et isole avec précision le nom de la saga parente.
 */
export function detectSeriesPart(rawTitle: string): SeriesPartInfo {
  const notSeries: SeriesPartInfo = {
    isSeries: false,
    partNumber: 0,
    seriesKey: '',
    seriesTitle: '',
    badgeLabel: '',
  };

  if (!rawTitle || typeof rawTitle !== 'string') return notSeries;

  const titleWithoutNoise = cleanNoisePrefixes(rawTitle);

  let partNumber = 0;
  let totalParts = 0;
  let titleWithoutPart = titleWithoutNoise;
  let badgeLabel = '';

  // 1. Détection de fractions encadrées : (1/4), [2/3], (Partie 3/4)
  const bracketMatch = titleWithoutNoise.match(/[\[\(]\s*(?:partie\s*|part\s*|p\.)?(\d+)\s*\/\s*(\d+)\s*[\]\)]/i);
  if (bracketMatch) {
    partNumber = parseInt(bracketMatch[1], 10);
    totalParts = parseInt(bracketMatch[2], 10);
    titleWithoutPart = titleWithoutNoise.replace(bracketMatch[0], ' ');
    badgeLabel = `${partNumber}/${totalParts}`;
  } else {
    // 2. Détection de fractions délimitées : " 1/4 ", "- 2/4 -", ": 3/4"
    const standardFractionMatch = titleWithoutNoise.match(/(?:^|[\s\-\–—\:\#\|])(?:partie\s*|part\s*|p\.)?(\d+)\s*\/\s*(\d+)(?![\d\/])(?:[\s\-\–—\:\#\|]|$)/i);
    if (standardFractionMatch) {
      partNumber = parseInt(standardFractionMatch[1], 10);
      totalParts = parseInt(standardFractionMatch[2], 10);
      titleWithoutPart = titleWithoutNoise.replace(standardFractionMatch[0], ' - ');
      badgeLabel = `${partNumber}/${totalParts}`;
    } else {
      // 3. Détection "Partie X sur Y"
      const surMatch = titleWithoutNoise.match(/(?:partie|part|épisode|episode|volet|chapitre|acte)\s*(\d+)\s*(?:sur|\/)\s*(\d+)/i);
      if (surMatch) {
        partNumber = parseInt(surMatch[1], 10);
        totalParts = parseInt(surMatch[2], 10);
        titleWithoutPart = titleWithoutNoise.replace(surMatch[0], ' ');
        badgeLabel = `${partNumber}/${totalParts}`;
      } else {
        // 4. Détection "Partie X", "Volet X"
        const singlePartMatch = titleWithoutNoise.match(/(?:^|[\s\-\–—\:\(\[])(?:partie|part|volet|chapitre|acte)\s*(\d+)(?:[\s\-\–—\:\)\]]|$)/i);
        if (singlePartMatch) {
          partNumber = parseInt(singlePartMatch[1], 10);
          totalParts = 0;
          titleWithoutPart = titleWithoutNoise.replace(singlePartMatch[0], ' ');
          badgeLabel = `Partie ${partNumber}`;
        } else {
          // 5. Ordinaux : "1ère partie", "2ème partie"
          const ordinalMatch = titleWithoutNoise.match(/(\d+)(?:ère|ere|er|ème|eme|e|re)\s*(?:partie|part|volet|chapitre)/i);
          if (ordinalMatch) {
            partNumber = parseInt(ordinalMatch[1], 10);
            totalParts = 0;
            titleWithoutPart = titleWithoutNoise.replace(ordinalMatch[0], ' ');
            badgeLabel = `Partie ${partNumber}`;
          }
        }
      }
    }
  }

  // Validation des bornes
  if (partNumber <= 0 || (totalParts > 0 && partNumber > totalParts) || (totalParts > 60)) {
    return notSeries;
  }

  // Nettoyage de la chaîne restante
  const cleanRemaining = titleWithoutPart
    .replace(/\s+/g, ' ')
    .replace(/^[\s\:\-\–—|.,]+|[\s\:\-\–—|.,]+$/g, '')
    .trim();

  // ISOLATION DU NOM DE LA SAGA :
  // Dans les podcasts, le nom de la saga est quasiment toujours avant le délimiteur ':' ou ' - ' ou '–'
  // Ex: "L'affaire Joël Le Scouarnec : les enfants oubliés" -> "L'affaire Joël Le Scouarnec"
  // Ex: "Le mystère Alexandre Despallières... : l'ultime pirouette" -> "Le mystère Alexandre Despallières..."
  let sagaName = cleanRemaining;
  const delimiterMatch = cleanRemaining.match(/^(.*?)\s*[:–—|]\s*(.*)$/);
  if (delimiterMatch) {
    const beforeDelimiter = delimiterMatch[1].trim();
    if (beforeDelimiter.length >= 5) {
      sagaName = beforeDelimiter;
    }
  }

  const k = cleanKey(sagaName);
  if (k.length < 4) {
    return notSeries;
  }

  return {
    isSeries: true,
    partNumber,
    totalParts: totalParts > 0 ? totalParts : undefined,
    seriesKey: k,
    seriesTitle: sagaName,
    badgeLabel: badgeLabel || (totalParts > 0 ? `${partNumber}/${totalParts}` : `Partie ${partNumber}`),
  };
}

/**
 * Regroupe les épisodes d'un podcast en véritables séries détectées (au moins 2 parties distinctes)
 */
export function detectSeriesGroups(episodes: Episode[]): SeriesGroup[] {
  const groupsMap = new Map<string, { title: string; totalParts: number; episodes: Episode[] }>();

  episodes.forEach((ep) => {
    const info = detectSeriesPart(ep.title);
    if (!info.isSeries) return;

    const key = info.seriesKey;

    if (!groupsMap.has(key)) {
      groupsMap.set(key, {
        title: info.seriesTitle || ep.title,
        totalParts: info.totalParts || 0,
        episodes: [],
      });
    }

    const group = groupsMap.get(key)!;
    if (!group.episodes.some((e) => e.id === ep.id)) {
      group.episodes.push(ep);
    }
    if (info.totalParts && info.totalParts > group.totalParts) {
      group.totalParts = info.totalParts;
    }
  });

  const result: SeriesGroup[] = [];

  groupsMap.forEach((g, key) => {
    // RÈGLE STRICTE : Une vraie saga doit contenir au moins 2 épisodes identifiés !
    if (g.episodes.length >= 2) {
      // Dédupliquer par numéro de partie (garder le plus récent en cas de rediffusion)
      const partMap = new Map<number, Episode>();
      g.episodes.forEach((ep) => {
        const info = detectSeriesPart(ep.title);
        const existing = partMap.get(info.partNumber);
        if (!existing) {
          partMap.set(info.partNumber, ep);
        } else {
          // Si rediffusion, garder la plus récente
          const timeA = ep.pubDate ? new Date(ep.pubDate).getTime() : 0;
          const timeExisting = existing.pubDate ? new Date(existing.pubDate).getTime() : 0;
          if (timeA > timeExisting) {
            partMap.set(info.partNumber, ep);
          }
        }
      });

      const uniqueSorted = Array.from(partMap.entries())
        .sort(([partA], [partB]) => partA - partB)
        .map(([, ep]) => ep);

      // Si après déduplication il reste au moins 2 parties distinctes
      if (uniqueSorted.length >= 2) {
        result.push({
          id: `series_${key}`,
          title: g.title,
          totalParts: g.totalParts || uniqueSorted.length,
          episodes: uniqueSorted,
          isComplete: g.totalParts > 0 ? uniqueSorted.length >= g.totalParts : true,
        });
      }
    }
  });

  // Trier les sagas par date de leur épisode le plus récent (la saga d'actualité en premier !)
  result.sort((a, b) => {
    const latestA = Math.max(...a.episodes.map((e) => (e.pubDate ? new Date(e.pubDate).getTime() : 0)));
    const latestB = Math.max(...b.episodes.map((e) => (e.pubDate ? new Date(e.pubDate).getTime() : 0)));
    return latestB - latestA;
  });

  return result;
}

/**
 * Trie une liste d'épisodes selon le mode sélectionné :
 * - 'newest' : Les plus récents en premier (ordre standard du flux RSS)
 * - 'oldest' : Les plus anciens en premier (ordre chronologique de parution)
 * - 'series' : Les sagas multi-parties sont remises dans l'ordre croissant (1 ➔ 2 ➔ 3 ➔ 4)
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
        // Injecte tous les épisodes de la saga dans l'ordre 1 ➔ 2 ➔ 3 ➔ 4 !
        result.push(...grp.episodes);
      }
    }
  });

  return result;
}
