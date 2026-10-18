import { Podcast } from '@/types/podcast';
import { getCanonicalPodcastId } from '@/lib/storage';

export interface SearchResultItem {
  id: string;
  title: string;
  author: string;
  description: string;
  feedUrl: string;
  artworkUrl: string;
  categories: string[];
  episodeCount?: number;
}

export const TRENDING_PODCASTS: SearchResultItem[] = [
  {
    id: getCanonicalPodcastId('https://feeds.acast.com/public/shows/95497e34-ecc2-596a-b910-bb3342918621'),
    title: 'HugoDécrypte - Actus du Jour',
    author: 'HugoDécrypte',
    description: 'Chaque jour du lundi au vendredi, un résumé des actualités du jour en une dizaine de minutes.',
    feedUrl: 'https://feeds.acast.com/public/shows/95497e34-ecc2-596a-b910-bb3342918621',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/99/8f/f2/998ff2e2-df8b-3569-4624-13843d12c9e3/mza_14083435330052627150.jpeg/600x600bb.jpg',
    categories: ['Actualités', 'Société', 'Politique'],
  },
  {
    id: getCanonicalPodcastId('https://radiofrance-podcast.net/podcast09/rss_13940.xml'),
    title: 'Affaires Sensibles',
    author: 'France Inter',
    description: 'Les grandes affaires, les aventures et les procès qui ont marqué les cinquante dernières années.',
    feedUrl: 'https://radiofrance-podcast.net/podcast09/rss_13940.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts116/v4/63/70/8c/63708c3b-ed11-5d19-fa67-132f92e463f3/mza_8301076687401115427.jpg/600x600bb.jpg',
    categories: ['Histoire', 'Enquêtes', 'Société'],
  },
  {
    id: getCanonicalPodcastId('https://feeds.audiomeans.fr/feed/f02d124c-01fa-4ddc-a6fe-9363f52c58bc.xml'),
    title: 'Transfert',
    author: 'Slate.fr',
    description: 'Des histoires intimes, surprenantes, émouvantes racontées par ceux qui les ont vécues.',
    feedUrl: 'https://feeds.audiomeans.fr/feed/f02d124c-01fa-4ddc-a6fe-9363f52c58bc.xml',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/3a/34/1f/3a341fd1-41ac-401b-2721-50e2245be56d/mza_7797341130086209673.png/600x600bb.jpg',
    categories: ['Société', 'Témoignages'],
  },
  {
    id: getCanonicalPodcastId('https://feeds.acast.com/public/shows/43160adc-fadd-4764-b93f-aa1ca93f22bf'),
    title: 'Underscore_',
    author: 'Micode',
    description: 'Le talk-show tech et cyber où l’on décortique les histoires les plus folles d’Internet et de l’informatique.',
    feedUrl: 'https://feeds.acast.com/public/shows/43160adc-fadd-4764-b93f-aa1ca93f22bf',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/49/1b/52/491b523c-404c-9d8e-f810-beedcdd2d8b1/mza_12879556782584196351.jpeg/600x600bb.jpg',
    categories: ['Technologie', 'Internet', 'Culture Web'],
  },
  {
    id: getCanonicalPodcastId('https://feeds.acast.com/public/shows/5ffe3facad3e633276e9ea57'),
    title: 'FloodCast',
    author: 'Florent Bernard & Adrien Ménielle',
    description: 'Discussions drôles, coulisses et invités autour d’un micro sans filtre.',
    feedUrl: 'https://feeds.acast.com/public/shows/5ffe3facad3e633276e9ea57',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts115/v4/ee/3e/5b/ee3e5b9c-c278-aadf-89ad-822ba2819da3/mza_3496687179233588433.jpg/600x600bb.jpg',
    categories: ['Humour', 'Comédie', 'Talk'],
  },
  {
    id: getCanonicalPodcastId('https://feeds.acast.com/public/shows/68db9d2509b1c365e44318ca'),
    title: "L'Heure du Monde",
    author: 'Le Monde',
    description: 'Un sujet d’actualité décortiqué chaque matin par la rédaction du Monde.',
    feedUrl: 'https://feeds.acast.com/public/shows/68db9d2509b1c365e44318ca',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts211/v4/09/b4/9f/09b49f13-4c73-2e89-5bdd-117a5a787623/mza_10769402460129893157.jpeg/600x600bb.jpg',
    categories: ['Actualités', 'Grand Angle', 'Société'],
  },
  {
    id: getCanonicalPodcastId('https://feeds.megaphone.fm/hubermanlab'),
    title: 'Huberman Lab',
    author: 'Scicomm Media',
    description: 'Science, neuroscience and health optimization tools for everyday life.',
    feedUrl: 'https://feeds.megaphone.fm/hubermanlab',
    artworkUrl: 'https://is1-ssl.mzstatic.com/image/thumb/Podcasts221/v4/9a/d3/19/9ad31912-0b5a-a16e-2d7c-9fd074698b9c/mza_8994222203629500925.jpg/600x600bb.jpg',
    categories: ['Science', 'Santé', 'Psychologie'],
  },
];

function fetchJsonp<T = any>(url: string, timeoutMs = 5000): Promise<T> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      return reject(new Error('Window non disponible'));
    }
    const callbackName = `itunes_cb_${Date.now()}_${Math.floor(Math.random() * 100000)}`;
    const script = document.createElement('script');
    let timer: NodeJS.Timeout | null = null;

    const cleanup = () => {
      try {
        delete (window as any)[callbackName];
      } catch {}
      if (script.parentNode) {
        script.parentNode.removeChild(script);
      }
    };

    (window as any)[callbackName] = (data: T) => {
      if (timer) clearTimeout(timer);
      cleanup();
      resolve(data);
    };

    script.onerror = () => {
      if (timer) clearTimeout(timer);
      cleanup();
      reject(new Error('JSONP script error'));
    };

    timer = setTimeout(() => {
      cleanup();
      reject(new Error('JSONP timeout'));
    }, timeoutMs);

    const separator = url.includes('?') ? '&' : '?';
    script.src = `${url}${separator}callback=${callbackName}`;
    document.head.appendChild(script);
  });
}

function normalizeText(str: string): string {
  if (!str) return '';
  return str
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/(\d+)(?:eme|er|ere|e)\b/gi, '$1')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function stripLeadingArticles(str: string): string {
  if (!str) return '';
  return str.replace(/^(?:le|la|les|l|un|une|des|the)\s+/i, '').trim();
}

export async function searchPodcasts(query: string): Promise<SearchResultItem[]> {
  const cleanQuery = query
    .replace(/["'«»“”„]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  if (!cleanQuery) return [];

  // Si l'utilisateur colle directement une URL de flux RSS
  if (/^https?:\/\/.+\.(xml|rss)/i.test(cleanQuery) || cleanQuery.includes('/feed') || cleanQuery.includes('/rss')) {
    const canonicalId = getCanonicalPodcastId(cleanQuery);
    return [
      {
        id: canonicalId,
        title: 'Flux RSS personnalisé',
        author: 'Flux direct',
        description: cleanQuery,
        feedUrl: cleanQuery,
        artworkUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=600',
        categories: ['Flux RSS'],
      },
    ];
  }

  // 1. Nettoyage de la requête pour l'index iTunes
  // Remplacement des ordinaux (ex: "1000ème", "1000eme", "1er" -> "1000", "1")
  const simplifiedQuery = cleanQuery
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/(\d+)(?:eme|er|ere|e)\b/gi, '$1')
    .replace(/\s+/g, ' ')
    .trim();

  // Si la version simplifiée est différente, on l'utilise en priorité pour l'API
  const itunesQuery = simplifiedQuery || cleanQuery;

  // Requête iTunes avec terme nettoyé
  const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(itunesQuery)}&entity=podcast&country=FR&limit=50`;
  let data: any = null;

  // 1. Essai avec fetch direct
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 3500);
    const res = await fetch(itunesUrl, { signal: controller.signal });
    clearTimeout(timer);
    if (res.ok) {
      data = await res.json();
    }
  } catch (fetchErr) {
    console.warn('Fetch iTunes direct indisponible, bascule sur JSONP WebView:', fetchErr);
  }

  // 2. Secours JSONP (contourne 100% des restrictions CORS de la WebView mobile)
  if (!data || !data.results || data.results.length === 0) {
    try {
      data = await fetchJsonp(itunesUrl, 4500);
    } catch (jsonpErr) {
      console.warn('JSONP iTunes indisponible:', jsonpErr);
    }
  }

  if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
    const normQuery = normalizeText(cleanQuery);
    const normSimplified = normalizeText(simplifiedQuery);
    const strippedQuery = stripLeadingArticles(normQuery);
    const qWords = normQuery.split(' ').filter(Boolean);

    // Mots vides en français (ne doivent jamais justifier à eux seuls un résultat positif)
    const STOP_WORDS = new Set(['le', 'la', 'les', 'un', 'une', 'de', 'du', 'des', 'en', 'au', 'aux', 'a', 'et', 'dans', 'sur', 'pour', 'par']);
    const significantWords = qWords.filter((w) => !STOP_WORDS.has(w) && (w.length > 1 || /\d/.test(w)));

    const hasNonLatinQuery = /[^\u0000-\u024F]/.test(cleanQuery);

    const items = data.results
      .filter((r: any) => r.feedUrl) // Uniquement avec flux RSS
      .filter((r: any) => {
        const title = r.collectionName || r.trackName || '';
        // Éliminer les spams de cours de langues nocturnes
        if (/while you sleep|pendant ton sommeil|dorme|schlaf/i.test(title)) return false;
        // Si l'utilisateur cherche en alphabet latin, filtrer les alphabets non-latins
        if (!hasNonLatinQuery && /[^\u0000-\u024F\s\d.,!?'"-]/.test(title)) return false;
        return true;
      })
      .map((r: any) => {
        const canonicalId = getCanonicalPodcastId(r.feedUrl);
        const title = r.collectionName || r.trackName || '';
        const author = r.artistName || 'Artiste inconnu';
        const normTitle = normalizeText(title);
        const normAuthor = normalizeText(author);
        const strippedTitle = stripLeadingArticles(normTitle);

        const exactMatch =
          normTitle === normQuery ||
          normTitle === normSimplified ||
          strippedTitle === strippedQuery;

        const startsWith =
          normTitle.startsWith(normQuery) ||
          normTitle.startsWith(normSimplified) ||
          strippedTitle.startsWith(strippedQuery);

        const containsPhrase =
          normTitle.includes(normQuery) ||
          normTitle.includes(normSimplified) ||
          strippedTitle.includes(strippedQuery);

        let matchedSignificant = 0;
        for (const w of significantWords) {
          const wordRegex = new RegExp(`(^|\\s)${w}`, 'i');
          if (wordRegex.test(normTitle) || normTitle.includes(w)) {
            matchedSignificant++;
          }
        }

        const allSignificantMatch = significantWords.length > 0 && matchedSignificant >= significantWords.length;
        const hasAnySignificant = significantWords.length === 0 || matchedSignificant > 0;

        let score = 0;
        // Match exact prioritaire
        if (exactMatch) score += 45000;
        if (startsWith) score += 22000;
        if (containsPhrase) score += 10000;
        if (allSignificantMatch) score += 6000;
        score += matchedSignificant * 1000;
        if (normAuthor.includes(normQuery) || normAuthor.includes(normSimplified)) score += 3000;

        // Bonus de brièveté : si le titre correspond pile à la recherche sans rallonge de texte
        if (strippedTitle.length <= strippedQuery.length + 4) {
          score += 8000;
        }

        // Bonus de popularité / présence (nombre d'épisodes de l'émission dans le flux)
        if (r.trackCount && r.trackCount > 5) {
          score += Math.min(10000, r.trackCount * 15);
        }

        // Bonus radio / producteur majeur (Radio Nova, Radio France, RTL, Slate...)
        if (/(radio nova|radio france|france inter|france culture|rtl|europe 1|rmc|slate)/i.test(author)) {
          score += 5000;
        }

        return {
          id: canonicalId,
          title,
          author,
          description: r.collectionCensoredName || '',
          feedUrl: r.feedUrl,
          artworkUrl: r.artworkUrl600 || r.artworkUrl100 || '',
          categories: r.genres || [r.primaryGenreName].filter(Boolean),
          episodeCount: r.trackCount,
          _score: score,
          _containsPhrase: containsPhrase,
          _startsWith: startsWith,
          _exactMatch: exactMatch,
          _allSignificantMatch: allSignificantMatch,
          _hasAnySignificant: hasAnySignificant,
        };
      })
      // ÉLIMINATION STRICTE : Tout podcast qui ne contient aucun des mots significatifs est rejeté d'office !
      .filter((i: any) => i._hasAnySignificant);

    // 1. Priorité absolue : les podcasts contenant la phrase complète ou commençant par la recherche
    const strongMatches = items.filter((i: any) => i._score >= 15000 || i._containsPhrase);
    let finalList: any[] = [];

    if (strongMatches.length > 0) {
      finalList = strongMatches;
    } else {
      // 2. Sinon, les podcasts contenant tous les mots significatifs
      const allSigMatches = items.filter((i: any) => i._allSignificantMatch);
      if (allSigMatches.length > 0) {
        finalList = allSigMatches;
      } else {
        // 3. En dernier recours, les meilleurs scores
        finalList = items.filter((i: any) => i._score > 0);
      }
    }

    // Tri par pertinence : le meilleur résultat en premier
    finalList.sort((a: any, b: any) => b._score - a._score);

    // Déduplication des résultats (Apple Podcasts renvoie parfois deux entrées pour le même flux)
    const seenIds = new Set<string>();
    const deduplicatedList: any[] = [];
    for (const item of finalList) {
      const key = item.id || item.feedUrl.toLowerCase();
      if (!seenIds.has(key)) {
        seenIds.add(key);
        deduplicatedList.push(item);
      }
    }

    // Retourner les 15 meilleurs résultats dédupliqués
    return deduplicatedList.slice(0, 15).map(({ _score, _containsPhrase, _startsWith, _exactMatch, _allSignificantMatch, _hasAnySignificant, ...item }: any) => item);
  }

  // Si aucun résultat externe n'a été trouvé
  return [];
}
