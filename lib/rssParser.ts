import { Podcast, Episode, Chapter } from '@/types/podcast';

function parseDuration(val: any): number {
  if (!val) return 0;
  if (typeof val === 'number') return Math.round(val);
  const str = String(val).trim();
  if (!str.includes(':')) {
    const num = parseInt(str, 10);
    return isNaN(num) ? 0 : num;
  }
  const parts = str.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  }
  return 0;
}

function cleanHtml(html?: string): string {
  if (!html) return '';
  return html
    .replace(/<[^>]*>?/gm, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .trim();
}

/**
 * Détecte les chapitres au format texte dans la description (ex: "05:12 - Mon sujet")
 */
function extractChaptersFromDescription(description: string, totalDurationSec: number): Chapter[] {
  if (!description) return [];
  const chapters: Chapter[] = [];
  const lines = description.split('\n');

  for (const line of lines) {
    const match = line.match(/(?:^|\s)(?:(\d{1,2}):)?(\d{1,2}):(\d{2})(?:\s*[-–:]\s*|\s+)(.+)$/);
    if (match) {
      const h = match[1] ? parseInt(match[1], 10) : 0;
      const m = parseInt(match[2], 10);
      const s = parseInt(match[3], 10);
      const title = match[4].trim();
      const startTime = h * 3600 + m * 60 + s;

      if (totalDurationSec === 0 || startTime < totalDurationSec) {
        chapters.push({ title, startTime });
      }
    }
  }

  // Calculer les endTime consécutifs
  for (let i = 0; i < chapters.length; i++) {
    const next = chapters[i + 1];
    if (next) {
      chapters[i].endTime = next.startTime;
    } else if (totalDurationSec > chapters[i].startTime) {
      chapters[i].endTime = totalDurationSec;
    }
  }

  return chapters;
}

export async function parsePodcastRss(xmlText: string, feedUrl: string): Promise<{ podcast: Podcast; episodes: Episode[] }> {
  if (typeof window === 'undefined') {
    throw new Error('Le parseur RSS s’exécute côté client.');
  }

  const parser = new DOMParser();
  const xml = parser.parseFromString(xmlText, 'text/xml');
  const channel = xml.querySelector('channel');

  if (!channel) {
    throw new Error('Flux RSS de podcast invalide (balise <channel> introuvable).');
  }

  const getTagText = (parent: Element, tagName: string): string => {
    const el = parent.querySelector(tagName);
    return el?.textContent?.trim() || '';
  };

  const podcastTitle = getTagText(channel, 'title') || 'Podcast sans titre';
  const podcastAuthor =
    getTagText(channel, 'itunes\\:author') ||
    getTagText(channel, 'author') ||
    getTagText(channel, 'itunes\\:owner itunes\\:name') ||
    'Auteur inconnu';
  const podcastDesc =
    cleanHtml(getTagText(channel, 'itunes\\:summary')) ||
    cleanHtml(getTagText(channel, 'description'));

  let podcastArtwork =
    channel.querySelector('itunes\\:image')?.getAttribute('href') ||
    channel.querySelector('image url')?.textContent?.trim() ||
    '';

  const podcastId = btoa(feedUrl).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);

  const podcast: Podcast = {
    id: podcastId,
    title: podcastTitle,
    author: podcastAuthor,
    description: podcastDesc,
    feedUrl,
    artworkUrl: podcastArtwork,
    categories: [],
  };

  const itemElements = Array.from(channel.querySelectorAll('item'));
  const episodes: Episode[] = [];

  for (let i = 0; i < itemElements.length; i++) {
    const item = itemElements[i];
    const enclosure = item.querySelector('enclosure');
    const audioUrl = enclosure?.getAttribute('url') || '';

    // Ne retenir que les épisodes avec un fichier audio valide
    if (!audioUrl) continue;

    const epTitle = getTagText(item, 'title') || `Épisode ${i + 1}`;
    const epDesc =
      cleanHtml(getTagText(item, 'itunes\\:summary')) ||
      cleanHtml(getTagText(item, 'description'));
    const epPubDate = getTagText(item, 'pubDate') || new Date().toISOString();
    const epDurationStr = getTagText(item, 'itunes\\:duration');
    const epDurationSec = parseDuration(epDurationStr);

    const epArtwork =
      item.querySelector('itunes\\:image')?.getAttribute('href') ||
      podcastArtwork;

    // Détection des chapitres textuels
    const chapters = extractChaptersFromDescription(epDesc, epDurationSec);

    const guid = getTagText(item, 'guid');
    const epId = guid
      ? `${podcastId}_${guid.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-32)}`
      : `${podcastId}_ep_${i}_${audioUrl.replace(/[^a-zA-Z0-9_-]/g, '_').slice(-20)}`;

    episodes.push({
      id: epId,
      podcastId,
      podcastTitle,
      podcastArtwork,
      title: epTitle,
      description: epDesc,
      audioUrl,
      durationSec: epDurationSec,
      pubDate: epPubDate,
      artworkUrl: epArtwork,
      chapters: chapters.length > 0 ? chapters : undefined,
    });
  }

  podcast.episodeCount = episodes.length;
  return { podcast, episodes };
}

/**
 * Télécharge et analyse un flux RSS via proxy CORS si nécessaire (pour le web)
 */
export async function fetchAndParsePodcast(feedUrl: string): Promise<{ podcast: Podcast; episodes: Episode[] }> {
  let xmlText = '';

  try {
    // 1. Essai direct (fonctionne sur Capacitor Android WebView et serveurs sans CORS strict)
    const res = await fetch(feedUrl, { mode: 'cors' });
    if (res.ok) {
      xmlText = await res.text();
    }
  } catch {
    // 2. Fallback via proxy public si bloqué par CORS dans le navigateur de dev
    try {
      const proxyUrl = `https://api.allorigins.win/raw?url=${encodeURIComponent(feedUrl)}`;
      const res = await fetch(proxyUrl);
      if (res.ok) {
        xmlText = await res.text();
      }
    } catch {
      throw new Error('Impossible de télécharger le flux RSS de ce podcast.');
    }
  }

  if (!xmlText) {
    throw new Error('Réponse vide du flux RSS.');
  }

  return parsePodcastRss(xmlText, feedUrl);
}
