import { Podcast } from '@/types/podcast';

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
    id: 'itunes_1438676239',
    title: 'HugoDécrypte - Les Actus du Jour',
    author: 'HugoDécrypte',
    description: 'Chaque jour du lundi au vendredi, un résumé des actualités du jour en une dizaine de minutes.',
    feedUrl: 'https://feed.ausha.co/B19bT9pQYV1o',
    artworkUrl: 'https://images.ausha.co/k0j3QjB1i7l1i2q3/1700000000.jpg',
    categories: ['Actualités', 'Politique', 'Société'],
  },
  {
    id: 'itunes_919904297',
    title: 'Affaires Sensibles',
    author: 'France Inter',
    description: 'Les grandes affaires, les aventures et les procès qui ont marqué les cinquante dernières années.',
    feedUrl: 'https://radiofrance-podcast.net/podcast09/rss_13940.xml',
    artworkUrl: 'https://cdn.radiofrance.fr/s3/cruiser-production/2021/08/33ca441e-53c6-4d0d-9b7e-97621f31f9ee/1400x1400_carre_affaires_sensibles_inter_2021.jpg',
    categories: ['Histoire', 'Société', 'Enquêtes'],
  },
  {
    id: 'itunes_1207865201',
    title: 'Transfert',
    author: 'Slate',
    description: 'Des histoires intimes, surprenantes, émouvantes racontées par ceux qui les ont vécues.',
    feedUrl: 'https://rss.art19.com/transfert',
    artworkUrl: 'https://content.production.cdn.art19.com/images/3f/63/07/fc/3f6307fc-9602-4217-b016-16a1c5d9e5b2/b43d3b4d4554c93540e118029c7d41f0f4244fbe1b3bfead5698b671239ce3d5e236359f42ce44057e937d949d01217e94be0df837482d8c3f25c765faea9ef8.jpeg',
    categories: ['Société', 'Témoignages'],
  },
  {
    id: 'itunes_1508216127',
    title: 'Underscore_',
    author: 'Micode',
    description: 'Le talk-show tech et cyber où l’on décortique les histoires les plus folles d’Internet et de l’informatique.',
    feedUrl: 'https://feed.ausha.co/7aP8T5b7K7V8',
    artworkUrl: 'https://images.ausha.co/7aP8T5b7K7V8/1640000000.jpg',
    categories: ['Technologie', 'Internet', 'Culture Web'],
  },
  {
    id: 'itunes_1483884877',
    title: 'Légendes Urbaines',
    author: 'RFI',
    description: 'Musiques actuelles, hip-hop, afro et cultures urbaines francophones.',
    feedUrl: 'https://www.rfi.fr/fr/podcasts/l%C3%A9gendes-urbaines/podcast',
    artworkUrl: 'https://s.rfi.fr/media/display/d44cb25e-04f7-11ea-bb65-005056a99247/w:1400/p:1x1/RFI-PODCAST-Legend-Urb-1400X1400.jpg',
    categories: ['Musique', 'Culture'],
  },
  {
    id: 'itunes_1545068222',
    title: 'Huberman Lab',
    author: 'Scicomm Media',
    description: 'Science, neuroscience and health optimization tools for everyday life.',
    feedUrl: 'https://feeds.megaphone.fm/hubermanlab',
    artworkUrl: 'https://megaphone.imgix.net/podcasts/11075678-3db4-11eb-98ff-872f2323a31c/image/Huberman_Lab_Podcast_Tile_1400x1400.png',
    categories: ['Science', 'Santé', 'Psychologie'],
  },
];

export async function searchPodcasts(query: string): Promise<SearchResultItem[]> {
  const cleanQuery = query.trim();
  if (!cleanQuery) return TRENDING_PODCASTS;

  // Si l'utilisateur colle directement une URL de flux RSS
  if (/^https?:\/\/.+\.(xml|rss)/i.test(cleanQuery) || cleanQuery.includes('/feed') || cleanQuery.includes('/rss')) {
    return [
      {
        id: 'custom_' + btoa(cleanQuery).slice(0, 12),
        title: 'Flux RSS personnalisé',
        author: 'Flux direct',
        description: cleanQuery,
        feedUrl: cleanQuery,
        artworkUrl: 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=300',
        categories: ['Flux RSS'],
      },
    ];
  }

  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(cleanQuery)}&entity=podcast&country=FR&limit=25`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Erreur recherche iTunes');
    const data = await res.json();

    if (!data.results || !Array.isArray(data.results)) {
      return [];
    }

    return data.results
      .filter((r: any) => r.feedUrl) // Uniquement ceux avec un flux RSS exploitable
      .map((r: any) => ({
        id: String(r.collectionId || r.trackId),
        title: r.collectionName || r.trackName,
        author: r.artistName || 'Artiste inconnu',
        description: r.collectionCensoredName || '',
        feedUrl: r.feedUrl,
        artworkUrl: r.artworkUrl600 || r.artworkUrl100 || '',
        categories: r.genres || [r.primaryGenreName].filter(Boolean),
        episodeCount: r.trackCount,
      }));
  } catch (err) {
    console.error('Erreur recherche podcast:', err);
    // Filtrage local en fallback
    return TRENDING_PODCASTS.filter(
      (p) =>
        p.title.toLowerCase().includes(cleanQuery.toLowerCase()) ||
        p.author.toLowerCase().includes(cleanQuery.toLowerCase())
    );
  }
}
