'use client';

import { Podcast } from '@/types/podcast';
import { getSubscribedPodcasts, saveSubscribedPodcasts } from '@/lib/storage';

export interface ParsedOpmlItem {
  title: string;
  feedUrl: string;
  artworkUrl?: string;
  description?: string;
}

/**
 * Analyse le contenu d'un fichier OPML (XML) généré par Apple Podcasts, AntennaPod, Pocket Casts, Castbox, etc.
 */
export function parseOpmlXml(xmlText: string): ParsedOpmlItem[] {
  if (!xmlText) return [];
  const results: ParsedOpmlItem[] = [];
  const seenUrls = new Set<string>();

  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlText, 'text/xml');
    const outlines = doc.querySelectorAll('outline');

    outlines.forEach((el) => {
      const xmlUrl = el.getAttribute('xmlUrl') || el.getAttribute('url');
      if (xmlUrl && !seenUrls.has(xmlUrl.trim())) {
        const feedUrl = xmlUrl.trim();
        seenUrls.add(feedUrl);
        const title =
          el.getAttribute('text') ||
          el.getAttribute('title') ||
          el.getAttribute('description') ||
          'Podcast sans titre';
        const artworkUrl =
          el.getAttribute('image') ||
          el.getAttribute('icon') ||
          el.getAttribute('artwork') ||
          undefined;
        const description = el.getAttribute('description') || '';

        results.push({
          title: title.trim(),
          feedUrl,
          artworkUrl,
          description,
        });
      }
    });
  } catch (e) {
    console.warn('Erreur analyse OPML DOMParser, fallback regex:', e);
    // Fallback par regex si le XML a des entités mal formées
    const outlineRegex = /<outline[^>]+xmlUrl=["']([^"']+)["'][^>]*>/gi;
    let match: RegExpExecArray | null;
    while ((match = outlineRegex.exec(xmlText)) !== null) {
      const feedUrl = match[1]?.trim();
      if (feedUrl && !seenUrls.has(feedUrl)) {
        seenUrls.add(feedUrl);
        const tagText = match[0];
        const titleMatch = tagText.match(/(?:text|title)=["']([^"']+)["']/i);
        const title = titleMatch ? titleMatch[1] : 'Podcast importé';
        results.push({ title, feedUrl });
      }
    }
  }

  return results;
}

/**
 * Génère un fichier OPML 2.0 standard prêt à être exporté et lu par n'importe quelle app
 */
export function generateOpmlXml(podcasts: Podcast[]): string {
  const now = new Date().toUTCString();
  const escaped = (str?: string) =>
    (str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');

  const outlines = podcasts
    .map(
      (p) =>
        `    <outline type="rss" text="${escaped(p.title)}" title="${escaped(
          p.title
        )}" xmlUrl="${escaped(p.feedUrl)}" htmlUrl="${escaped(
          p.feedUrl
        )}" description="${escaped(p.description || '')}" />`
    )
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<opml version="2.0">
  <head>
    <title>Abonnements Podcasts KeoKaster</title>
    <dateCreated>${now}</dateCreated>
    <ownerName>KeoKaster</ownerName>
  </head>
  <body>
    <outline text="Podcasts">
${outlines}
    </outline>
  </body>
</opml>`;
}

/**
 * Télécharge le fichier OPML sur le smartphone ou l'ordinateur
 */
export function downloadOpmlFile(podcasts: Podcast[]): void {
  const xml = generateOpmlXml(podcasts);
  const blob = new Blob([xml], { type: 'text/xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `keokaster-abonnements-${new Date().toISOString().slice(0, 10)}.opml`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Résout une URL Apple Podcasts (ex: https://podcasts.apple.com/fr/podcast/home-icides/id1528659556)
 * vers son flux RSS d'origine via l'API Apple iTunes Lookup
 */
export async function resolveApplePodcastsUrl(url: string): Promise<{ title: string; feedUrl: string; artworkUrl?: string } | null> {
  const match = url.match(/id(\d+)/i);
  if (!match || !match[1]) return null;
  const itunesId = match[1];

  try {
    const res = await fetch(`https://itunes.apple.com/lookup?id=${itunesId}&entity=podcast`);
    if (!res.ok) return null;
    const data = await res.json();
    if (data.results && data.results.length > 0) {
      const item = data.results[0];
      if (item.feedUrl) {
        return {
          title: item.collectionName || item.trackName || 'Podcast Apple',
          feedUrl: item.feedUrl,
          artworkUrl: item.artworkUrl600 || item.artworkUrl100,
        };
      }
    }
  } catch (err) {
    console.warn('Erreur résolution Apple Podcasts:', err);
  }
  return null;
}

/**
 * Tente de rapatrier un podcast à partir d'un lien Spotify ou d'un lien générique en recherchant par titre
 */
export async function resolveGenericOrSpotifyUrl(input: string): Promise<{ title: string; feedUrl: string; artworkUrl?: string } | null> {
  const trimmed = input.trim();
  // 1. Si c'est déjà un flux RSS direct
  if (trimmed.startsWith('http') && (trimmed.includes('.rss') || trimmed.includes('.xml') || trimmed.includes('feed') || trimmed.includes('audio'))) {
    return {
      title: 'Podcast RSS',
      feedUrl: trimmed,
    };
  }

  // 2. Si c'est un lien Apple Podcasts
  if (trimmed.includes('podcasts.apple.com')) {
    const resolved = await resolveApplePodcastsUrl(trimmed);
    if (resolved) return resolved;
  }

  // 3. Si c'est un lien Spotify (ex: https://open.spotify.com/show/4rOoJ6Egrf8K2IrywzwOMk)
  // On extrait le slug ou le titre et on cherche sur l'API iTunes
  let query = trimmed;
  if (trimmed.includes('open.spotify.com/show/')) {
    // Si l'URL contient un slug dans le chemin ou paramètre
    const parts = trimmed.split('?')[0].split('/');
    const showId = parts[parts.length - 1];
    query = showId;
  }

  try {
    const res = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=podcast&limit=1`);
    if (res.ok) {
      const data = await res.json();
      if (data.results && data.results.length > 0) {
        const item = data.results[0];
        return {
          title: item.collectionName || item.trackName,
          feedUrl: item.feedUrl,
          artworkUrl: item.artworkUrl600 || item.artworkUrl100,
        };
      }
    }
  } catch {}

  return null;
}
