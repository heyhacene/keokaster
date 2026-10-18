'use client';

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { Episode, AdSegment } from '@/types/podcast';
import { buildAdSegments, checkAdSkip, saveLocalAdMarker, getLocalAdMarkers } from './adBlocker';
import {
  analyzeEpisodeAdsWithAI,
  AIAdDetectionResult,
  recordAICutStats,
} from './aiAdAnalyzer';
import {
  savePlaybackPosition,
  getPlaybackPositions,
  getGlobalAdSettings,
  getPodcastSettings,
  markEpisodePlayed,
  getQueue,
  saveQueue,
} from './storage';
import { getOfflineAudioUrl } from './offlineStorage';

interface PlayerContextType {
  currentEpisode: Episode | null;
  isPlaying: boolean;
  isLoadingAudio: boolean;
  currentTime: number;
  duration: number;
  speed: number;
  queue: Episode[];
  adSegments: AdSegment[];
  aiAdResult: AIAdDetectionResult | null;
  lastSkippedAd: { label: string; timestamp: number } | null;
  sleepTimerRemainingSec: number | null;
  isFullPlayerOpen: boolean;
  playEpisode: (episode: Episode) => void;
  restartEpisode: (episode: Episode) => void;
  togglePlay: () => void;
  pause: () => void;
  resume: () => void;
  seekTo: (timeSec: number) => void;
  skipForward: (sec?: number) => void;
  skipBackward: (sec?: number) => void;
  setSpeed: (speed: number) => void;
  setSleepTimer: (minutes: number | null) => void;
  skipAdNow: (secondsToSkip?: number) => void;
  markCurrentTimeAsAd: () => void;
  addToQueue: (episode: Episode) => void;
  removeFromQueue: (episodeId: string) => void;
  playNextInQueue: () => void;
  playSeries: (seriesEpisodes: Episode[]) => void;
  enqueueSeries: (seriesEpisodes: Episode[]) => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
}

const PlayerContext = createContext<PlayerContextType | undefined>(undefined);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoadingAudio, setIsLoadingAudio] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [speed, setSpeedState] = useState(1.0);
  const [queue, setQueueState] = useState<Episode[]>([]);
  const [adSegments, setAdSegments] = useState<AdSegment[]>([]);
  const [aiAdResult, setAiAdResult] = useState<AIAdDetectionResult | null>(null);
  const [lastSkippedAd, setLastSkippedAd] = useState<{ label: string; timestamp: number } | null>(null);
  const [sleepTimerRemainingSec, setSleepTimerRemainingSec] = useState<number | null>(null);
  const [isFullPlayerOpen, setIsFullPlayerOpen] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isSeekingRef = useRef(false);
  const lastSkipTriggerRef = useRef(0);
  const currentEpisodeRef = useRef<Episode | null>(null);
  const adSegmentsRef = useRef<AdSegment[]>([]);

  // Synchronisation des refs
  useEffect(() => {
    currentEpisodeRef.current = currentEpisode;
  }, [currentEpisode]);

  useEffect(() => {
    adSegmentsRef.current = adSegments;
  }, [adSegments]);

  // Synchronisation dynamique si les paramètres d'exclusion d'un podcast changent
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onSettingsChange = () => {
      const ep = currentEpisodeRef.current;
      if (!ep) return;
      const pSettings = getPodcastSettings(ep.podcastId);
      const gSettings = getGlobalAdSettings();
      const isActive = gSettings.enabled && pSettings.adBlockEnabled !== false;
      if (!isActive) {
        setAdSegments([]);
        adSegmentsRef.current = [];
        setAiAdResult(null);
      } else {
        const introSec = pSettings.autoSkipIntroSec ?? 0;
        const outroSec = pSettings.autoSkipOutroSec ?? 0;
        const detectionResult = analyzeEpisodeAdsWithAI(ep, ep.chapters, introSec, outroSec);
        setAiAdResult(detectionResult);
        setAdSegments(detectionResult.segments);
        adSegmentsRef.current = detectionResult.segments;
      }
    };
    window.addEventListener('keokaster_podcast_settings_changed', onSettingsChange);
    return () => window.removeEventListener('keokaster_podcast_settings_changed', onSettingsChange);
  }, []);

  // Initialisation de l'élément Audio - UNIQUE pour toute la durée de vie de l'app
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const audio = new Audio();
    audio.preload = 'metadata';
    audioRef.current = audio;

    // Charger la file d'attente existante
    setQueueState(getQueue());

    const onTimeUpdate = () => {
      if (isSeekingRef.current) return;
      const cur = audio.currentTime;
      setCurrentTime(cur);

      const ep = currentEpisodeRef.current;
      const segments = adSegmentsRef.current;

      // 1. Sauvegarder la position toutes les 2 secondes
      if (ep && Math.floor(cur) % 2 === 0) {
        savePlaybackPosition(ep.id, cur);
      }

      // 2. MOTEUR ANTI-PUB IA KEO KASTER : Détection et saut automatique
      if (segments.length > 0) {
        const check = checkAdSkip(cur, segments);
        // Éviter de reboucler en boucle sur la même pub
        if (check.shouldSkip && check.seekTargetSec && Date.now() - lastSkipTriggerRef.current > 1500) {
          lastSkipTriggerRef.current = Date.now();
          const cutDuration = Math.max(1, check.seekTargetSec - cur);
          recordAICutStats(cutDuration);
          audio.currentTime = check.seekTargetSec;
          setCurrentTime(check.seekTargetSec);

          const label = check.segment?.label || '⚡ Publicité coupée par l\'IA';
          setLastSkippedAd({ label, timestamp: Date.now() });
          setTimeout(() => setLastSkippedAd(null), 4000);
        }
      }
    };

    const onLoadedMetadata = () => {
      setDuration(audio.duration || 0);
      setIsLoadingAudio(false);
    };

    const onEnded = () => {
      setIsPlaying(false);
      setIsLoadingAudio(false);
      const ep = currentEpisodeRef.current;
      if (ep) {
        markEpisodePlayed(ep.id, true);
      }
      playNextInQueue();
    };

    const onPlay = () => setIsPlaying(true);
    const onPause = () => setIsPlaying(false);
    const onPlaying = () => {
      setIsPlaying(true);
      setIsLoadingAudio(false);
    };
    const onWaiting = () => setIsLoadingAudio(true);
    const onCanPlay = () => setIsLoadingAudio(false);
    const onError = () => {
      console.warn('Erreur lecture élément audio:', audio.error);
      setIsLoadingAudio(false);
      setIsPlaying(false);
    };

    audio.addEventListener('timeupdate', onTimeUpdate);
    audio.addEventListener('loadedmetadata', onLoadedMetadata);
    audio.addEventListener('ended', onEnded);
    audio.addEventListener('play', onPlay);
    audio.addEventListener('pause', onPause);
    audio.addEventListener('playing', onPlaying);
    audio.addEventListener('waiting', onWaiting);
    audio.addEventListener('canplay', onCanPlay);
    audio.addEventListener('error', onError);

    return () => {
      audio.pause();
      audio.src = '';
      audio.removeEventListener('timeupdate', onTimeUpdate);
      audio.removeEventListener('loadedmetadata', onLoadedMetadata);
      audio.removeEventListener('ended', onEnded);
      audio.removeEventListener('play', onPlay);
      audio.removeEventListener('pause', onPause);
      audio.removeEventListener('playing', onPlaying);
      audio.removeEventListener('waiting', onWaiting);
      audio.removeEventListener('canplay', onCanPlay);
      audio.removeEventListener('error', onError);
    };
  }, []); // Singleton garanti : tableau de dépendance vide

  // Synchronisation avec MediaSession (Écran de verrouillage Android / notifications)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator) || !currentEpisode) return;

    navigator.mediaSession.metadata = new MediaMetadata({
      title: currentEpisode.title,
      artist: currentEpisode.podcastTitle,
      album: 'Keo Kaster',
      artwork: currentEpisode.podcastArtwork
        ? [
            { src: currentEpisode.podcastArtwork, sizes: '96x96', type: 'image/jpeg' },
            { src: currentEpisode.podcastArtwork, sizes: '256x256', type: 'image/jpeg' },
            { src: currentEpisode.podcastArtwork, sizes: '512x512', type: 'image/jpeg' },
          ]
        : [],
    });

    navigator.mediaSession.setActionHandler('play', () => resume());
    navigator.mediaSession.setActionHandler('pause', () => pause());
    navigator.mediaSession.setActionHandler('seekbackward', () => skipBackward(10));
    navigator.mediaSession.setActionHandler('seekforward', () => skipForward(30));
    navigator.mediaSession.setActionHandler('nexttrack', () => playNextInQueue());

    return () => {
      try {
        navigator.mediaSession.setActionHandler('play', null);
        navigator.mediaSession.setActionHandler('pause', null);
        navigator.mediaSession.setActionHandler('seekbackward', null);
        navigator.mediaSession.setActionHandler('seekforward', null);
        navigator.mediaSession.setActionHandler('nexttrack', null);
      } catch {}
    };
  }, [currentEpisode]);

  // Minuteur de mise en veille (Sleep Timer)
  useEffect(() => {
    if (sleepTimerRemainingSec === null || sleepTimerRemainingSec <= 0) return;

    const interval = setInterval(() => {
      setSleepTimerRemainingSec((prev) => {
        if (prev === null || prev <= 1) {
          pause();
          return null;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [sleepTimerRemainingSec]);

  // Lancer un épisode de manière exclusive (un seul podcast à la fois)
  const playEpisode = useCallback(
    (ep: Episode) => {
      const audio = audioRef.current;
      if (!audio) return;

      // Si c'est déjà l'épisode en cours, on bascule simplement Play/Pause
      if (currentEpisodeRef.current?.id === ep.id) {
        if (!audio.paused) {
          audio.pause();
          setIsPlaying(false);
        } else {
          setIsLoadingAudio(true);
          audio.play().then(() => {
            setIsPlaying(true);
            setIsLoadingAudio(false);
          }).catch((err) => {
            console.warn('Erreur lecture audio:', err);
            setIsLoadingAudio(false);
            setIsPlaying(false);
          });
        }
        return;
      }

      // Arrêt immédiat et inconditionnel de tout flux en cours
      try {
        audio.pause();
      } catch {}

      const pSettings = getPodcastSettings(ep.podcastId);
      const gSettings = getGlobalAdSettings();

      // Moteur d'analyse IA ZeroPub : analyse sémantique, DAI et chapitres
      let segments: AdSegment[] = [];
      let detectionResult: AIAdDetectionResult | null = null;

      // Vérification STRICTE : Stop-Pub doit être activé au niveau global ET ne pas être exclu pour ce podcast
      const isAdBlockActive = gSettings.enabled && pSettings.adBlockEnabled !== false;

      if (isAdBlockActive) {
        const introSec = pSettings.autoSkipIntroSec ?? 0;
        const outroSec = pSettings.autoSkipOutroSec ?? 0;
        detectionResult = analyzeEpisodeAdsWithAI(ep, ep.chapters, introSec, outroSec);
        segments = [...detectionResult.segments];

        // Intégrer les marqueurs signalés par l'utilisateur
        const localMarkers = getLocalAdMarkers()[ep.id] || [];
        if (localMarkers.length > 0) {
          segments.push(...localMarkers);
        }
      } else {
        segments = [];
        detectionResult = null;
      }

      setAiAdResult(detectionResult);
      setAdSegments(segments);
      adSegmentsRef.current = segments;

      setCurrentEpisode(ep);
      currentEpisodeRef.current = ep;
      setIsLoadingAudio(true);
      setIsPlaying(false);
      setCurrentTime(0);

      // Reprise de la position sauvegardée
      const positions = getPlaybackPositions();
      const savedPos = positions[ep.id] || 0;

      // Détection de tout encart publicitaire ou sponsoring initial débutant à 0s (DAI, intro ou sponsor)
      const initialAd = segments.find((s) => s.startTime <= 1.5 && s.endTime > 3.0);
      const hasInitialAd = savedPos === 0 && Boolean(initialAd);
      const startPos = hasInitialAd && initialAd
        ? initialAd.endTime + 0.1
        : savedPos;

      if (hasInitialAd && initialAd) {
        recordAICutStats(initialAd.endTime);
        const introLabel = initialAd.label || '⚡ Publicité pré-roll sautée par l\'IA';
        setLastSkippedAd({ label: introLabel, timestamp: Date.now() });
        setTimeout(() => setLastSkippedAd(null), 4500);
      }

      getOfflineAudioUrl(ep.id).then((offlineUrl) => {
        if (offlineUrl) {
          audio.src = offlineUrl;
        } else {
          audio.src = ep.audioUrl;
        }
        audio.playbackRate = pSettings.customSpeed || speed;
        audio.load();
      }).catch(() => {
        audio.src = ep.audioUrl;
        audio.playbackRate = pSettings.customSpeed || speed;
        audio.load();
      });

      let readyHandled = false;
      const onReadyToPlay = () => {
        if (readyHandled) return;
        readyHandled = true;

        if (startPos > 0) {
          try {
            audio.currentTime = startPos;
            setCurrentTime(startPos);
          } catch (e) {
            console.warn('Erreur seek audio initial:', e);
          }
        }

        audio.play().then(() => {
          setIsPlaying(true);
          setIsLoadingAudio(false);
          // Sécurité additionnelle : si le navigateur a réinitialisé la position à 0 au démarrage
          if (startPos > 0 && Math.abs(audio.currentTime - startPos) > 1.5) {
            try {
              audio.currentTime = startPos;
              setCurrentTime(startPos);
            } catch {}
          }
        }).catch((err) => {
          console.warn('Erreur lecture audio play():', err);
          setIsLoadingAudio(false);
          setIsPlaying(false);
        });
      };

      audio.addEventListener('canplay', onReadyToPlay, { once: true });
      audio.addEventListener('loadeddata', onReadyToPlay, { once: true });
    },
    [speed]
  );

  const restartEpisode = useCallback(
    (ep: Episode) => {
      savePlaybackPosition(ep.id, 0);
      const audio = audioRef.current;
      const pSettings = getPodcastSettings(ep.podcastId);
      const gSettings = getGlobalAdSettings();
      const isAdBlockActive = gSettings.enabled && pSettings.adBlockEnabled !== false;

      let targetTime = 0;
      if (isAdBlockActive) {
        const detection = analyzeEpisodeAdsWithAI(
          ep,
          ep.chapters,
          pSettings.autoSkipIntroSec ?? 0,
          pSettings.autoSkipOutroSec ?? 0
        );
        const initialAd = detection.segments.find((s) => s.startTime <= 1.5 && s.endTime > 3.0);
        if (initialAd) {
          targetTime = initialAd.endTime + 0.1;
        }
      }

      if (currentEpisodeRef.current?.id === ep.id && audio) {
        audio.currentTime = targetTime;
        setCurrentTime(targetTime);
        if (audio.paused) {
          audio.play().then(() => setIsPlaying(true)).catch(() => {});
        }
      } else {
        playEpisode(ep);
      }
    },
    [playEpisode]
  );

  const togglePlay = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!audio.paused) {
      audio.pause();
      setIsPlaying(false);
    } else {
      setIsLoadingAudio(true);
      audio.play().then(() => {
        setIsPlaying(true);
        setIsLoadingAudio(false);
      }).catch((err) => {
        console.warn('Erreur togglePlay:', err);
        setIsLoadingAudio(false);
        setIsPlaying(false);
      });
    }
  }, []);

  const pause = useCallback(() => {
    const audio = audioRef.current;
    if (audio) {
      audio.pause();
      setIsPlaying(false);
    }
  }, []);

  const resume = useCallback(() => {
    const audio = audioRef.current;
    if (!audio) return;
    setIsLoadingAudio(true);
    audio.play().then(() => {
      setIsPlaying(true);
      setIsLoadingAudio(false);
    }).catch((err) => {
      console.warn('Erreur resume:', err);
      setIsLoadingAudio(false);
      setIsPlaying(false);
    });
  }, []);

  const seekTo = useCallback((timeSec: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    const clamped = Math.max(0, Math.min(timeSec, audio.duration || 0));
    audio.currentTime = clamped;
    setCurrentTime(clamped);
  }, []);

  const skipForward = useCallback((sec = 30) => {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime + sec);
  }, [seekTo]);

  const skipBackward = useCallback((sec = 10) => {
    const audio = audioRef.current;
    if (!audio) return;
    seekTo(audio.currentTime - sec);
  }, [seekTo]);

  const setSpeed = useCallback((newSpeed: number) => {
    setSpeedState(newSpeed);
    if (audioRef.current) {
      audioRef.current.playbackRate = newSpeed;
    }
  }, []);

  const setSleepTimer = useCallback((minutes: number | null) => {
    if (minutes === null) {
      setSleepTimerRemainingSec(null);
    } else {
      setSleepTimerRemainingSec(minutes * 60);
    }
  }, []);

  // Bouton "Sauter la pub (+60s)" ou segment
  const skipAdNow = useCallback(
    (secondsToSkip = 60) => {
      skipForward(secondsToSkip);
      recordAICutStats(secondsToSkip);
      setLastSkippedAd({ label: `⚡ Pub passée (+${secondsToSkip}s)`, timestamp: Date.now() });
      setTimeout(() => setLastSkippedAd(null), 3000);
    },
    [skipForward]
  );

  // Bouton "Marquer les 60s comme pub pour toujours"
  const markCurrentTimeAsAd = useCallback(() => {
    if (!currentEpisode) return;
    const cur = currentTime;
    const newSegment: AdSegment = {
      id: `manual_${Date.now()}`,
      startTime: Math.max(0, cur - 10),
      endTime: cur + 50, // saute 60 secondes au total
      type: 'manual',
      label: 'Segment publicitaire signalé',
    };
    saveLocalAdMarker(currentEpisode.id, newSegment);
    setAdSegments((prev) => [...prev, newSegment]);
    seekTo(cur + 50.1);
    setLastSkippedAd({ label: '⚡ Pub signalée & sautée avec succès !', timestamp: Date.now() });
    setTimeout(() => setLastSkippedAd(null), 3500);
  }, [currentEpisode, currentTime, seekTo]);

  const addToQueue = useCallback((ep: Episode) => {
    setQueueState((prev) => {
      if (prev.some((item) => item.id === ep.id)) return prev;
      const updated = [...prev, ep];
      saveQueue(updated);
      return updated;
    });
  }, []);

  const removeFromQueue = useCallback((episodeId: string) => {
    setQueueState((prev) => {
      const updated = prev.filter((item) => item.id !== episodeId);
      saveQueue(updated);
      return updated;
    });
  }, []);

  const playNextInQueue = useCallback(() => {
    setQueueState((prev) => {
      if (prev.length === 0) return prev;
      const [nextEp, ...rest] = prev;
      saveQueue(rest);
      playEpisode(nextEp);
      return rest;
    });
  }, [playEpisode]);

  const playSeries = useCallback(
    (seriesEpisodes: Episode[]) => {
      if (!seriesEpisodes || seriesEpisodes.length === 0) return;
      const [first, ...rest] = seriesEpisodes;
      // Remplace la file par le reste de la saga dans l'ordre
      setQueueState(rest);
      saveQueue(rest);
      // Lance immédiatement le 1er épisode
      playEpisode(first);
    },
    [playEpisode]
  );

  const enqueueSeries = useCallback((seriesEpisodes: Episode[]) => {
    if (!seriesEpisodes || seriesEpisodes.length === 0) return;
    setQueueState((prev) => {
      const existingIds = new Set(prev.map((e) => e.id));
      const toAdd = seriesEpisodes.filter((e) => !existingIds.has(e.id));
      const updated = [...prev, ...toAdd];
      saveQueue(updated);
      return updated;
    });
  }, []);

  return (
    <PlayerContext.Provider
      value={{
        currentEpisode,
        isPlaying,
        isLoadingAudio,
        currentTime,
        duration,
        speed,
        queue,
        adSegments,
        aiAdResult,
        lastSkippedAd,
        sleepTimerRemainingSec,
        isFullPlayerOpen,
        playEpisode,
        restartEpisode,
        togglePlay,
        pause,
        resume,
        seekTo,
        skipForward,
        skipBackward,
        setSpeed,
        setSleepTimer,
        skipAdNow,
        markCurrentTimeAsAd,
        addToQueue,
        removeFromQueue,
        playNextInQueue,
        playSeries,
        enqueueSeries,
        openFullPlayer: () => setIsFullPlayerOpen(true),
        closeFullPlayer: () => setIsFullPlayerOpen(false),
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const context = useContext(PlayerContext);
  if (!context) {
    throw new Error('usePlayer doit être utilisé dans un PlayerProvider');
  }
  return context;
}
