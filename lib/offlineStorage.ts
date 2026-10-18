'use client';

import { Episode } from '@/types/podcast';

const DB_NAME = 'keokaster_offline_v1';
const STORE_NAME = 'episodes';
const DB_VERSION = 1;

export interface DownloadedItem {
  id: string;
  episode: Episode;
  audioBlob: Blob;
  sizeBytes: number;
  downloadedAt: string;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB non supporté'));
      return;
    }

    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Télécharge un épisode et l'enregistre dans le stockage local IndexedDB pour lecture hors-ligne
 */
export async function downloadEpisode(
  episode: Episode,
  onProgress?: (percent: number) => void
): Promise<boolean> {
  try {
    const res = await fetch(episode.audioUrl);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const contentLength = res.headers.get('content-length');
    const totalBytes = contentLength ? parseInt(contentLength, 10) : 0;

    let blob: Blob;

    if (res.body && totalBytes > 0 && typeof ReadableStream !== 'undefined') {
      const reader = res.body.getReader();
      const chunks: Uint8Array[] = [];
      let receivedBytes = 0;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) {
          chunks.push(value);
          receivedBytes += value.length;
          if (onProgress && totalBytes > 0) {
            onProgress(Math.min(99, Math.round((receivedBytes / totalBytes) * 100)));
          }
        }
      }

      blob = new Blob(chunks as any, { type: 'audio/mpeg' });
    } else {
      blob = await res.blob();
    }

    if (onProgress) onProgress(100);

    const db = await openDB();
    const item: DownloadedItem = {
      id: episode.id,
      episode,
      audioBlob: blob,
      sizeBytes: blob.size,
      downloadedAt: new Date().toISOString(),
    };

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.put(item);
      req.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('keokaster_offline_changed', { detail: { episodeId: episode.id } }));
        }
        resolve(true);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Erreur téléchargement épisode:', err);
    return false;
  }
}

/**
 * Vérifie si un épisode est déjà disponible hors-ligne
 */
export async function isEpisodeDownloaded(episodeId: string): Promise<boolean> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(episodeId);
      req.onsuccess = () => resolve(!!req.result);
      req.onerror = () => resolve(false);
    });
  } catch {
    return false;
  }
}

/**
 * Récupère l'URL locale (blob URL) pour lire l'épisode sans aucune connexion internet
 */
export async function getOfflineAudioUrl(episodeId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(episodeId);
      req.onsuccess = () => {
        if (req.result && req.result.audioBlob) {
          const url = URL.createObjectURL(req.result.audioBlob);
          resolve(url);
        } else {
          resolve(null);
        }
      };
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

/**
 * Récupère tous les épisodes téléchargés
 */
export async function getDownloadedEpisodes(): Promise<DownloadedItem[]> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => resolve([]);
    });
  } catch {
    return [];
  }
}

/**
 * Supprime un épisode téléchargé pour libérer l'espace disque
 */
export async function deleteDownloadedEpisode(episodeId: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      const req = store.delete(episodeId);
      req.onsuccess = () => {
        if (typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('keokaster_offline_changed', { detail: { episodeId } }));
        }
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch {}
}

export function formatBytes(bytes: number): string {
  if (!bytes) return '0 Mo';
  const mb = bytes / (1024 * 1024);
  if (mb >= 1000) {
    return `${(mb / 1024).toFixed(1)} Go`;
  }
  return `${mb.toFixed(1)} Mo`;
}
