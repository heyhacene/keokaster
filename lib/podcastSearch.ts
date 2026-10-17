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

export async function searchPodcasts(query: string): Promise<SearchResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return TRENDING_PODCASTS;

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

  const itunesUrl = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=podcast&country=FR&limit=50`;
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
  if (!data || !data.results) {
    try {
      data = await fetchJsonp(itunesUrl, 4500);
    } catch (jsonpErr) {
      console.warn('JSONP iTunes indisponible:', jsonpErr);
    }
  }

  if (data && data.results && Array.isArray(data.results) && data.results.length > 0) {
    const qLower = cleanQuery.toLowerCase();
    const qWords = qLower.split(/\s+/).filter(Boolean);

    const scoredItems = data.results
      .filter((r: any) => r.feedUrl) // Uniquement ceux avec un flux RSS exploitable
      .map((r: any) => {
        const canonicalId = getCanonicalPodcastId(r.feedUrl);
        const title = r.collectionName || r.trackName || '';
        const author = r.artistName || 'Artiste inconnu';
        const tLower = title.toLowerCase();
        const aLower = author.toLowerCase();

        // Calcul du score de pertinence intelligent
        let score = 0;
        if (tLower === qLower) score += 5000;
        if (tLower.startsWith(qLower)) score += 3000;
        if (tLower.includes(qLower)) score += 1500;
        if (qWords.length > 1 && qWords.every((w: string) => tLower.includes(w))) score += 800;
        const wordsInTitle = qWords.filter((w: string) => tLower.includes(w)).length;
        score += wordsInTitle * 250;
        if (aLower.startsWith(qLower)) score += 400;
        else if (aLower.includes(qLower)) score += 200;
        if (/[éèêëàâîïôûùç]/i.test(title)) score += 60;

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
        };
      });

    // Tri par pertinence : le podcast qui correspond exactement au titre apparaît EN TOUT PREMIER
    scoredItems.sort((a: any, b: any) => b._score - a._score);

    return scoredItems.map(({ _score, ...item }: any) => item);
  }

  // 3. Fallback local uniquement si le terme correspond à nos flux préenregistrés
  const lower = cleanQuery.toLowerCase();
  return TRENDING_PODCASTS.filter(
    (p) =>
      p.title.toLowerCase().includes(lower) ||
      p.author.toLowerCase().includes(lower) ||
      p.categories.some((c) => c.toLowerCase().includes(lower))
  );
}
