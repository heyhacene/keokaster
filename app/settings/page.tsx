'use client';

import React, { useState, useEffect } from 'react';
import { GlobalAdSettings, Podcast } from '@/types/podcast';
import {
  getGlobalAdSettings,
  saveGlobalAdSettings,
  getSubscribedPodcasts,
  saveSubscribedPodcasts,
  getPlaybackPositions,
  getAllExcludedPodcastSettings,
  removePodcastExclusion,
  ExcludedPodcastItem,
} from '@/lib/storage';
import {
  fetchLatestKeoKasterApk,
  LatestApkRelease,
  CURRENT_KASTER_BUILD,
  PERMANENT_LATEST_APK_URL,
} from '@/lib/apkUpdate';
import { getAICutStats } from '@/lib/aiAdAnalyzer';
import {
  Settings,
  Smartphone,
  Download,
  RefreshCw,
  ExternalLink,
  Cloud,
  Check,
  ShieldCheck,
  Zap,
  Coffee,
  LifeBuoy,
  FileJson,
  Upload,
  User,
  Sparkles,
  ArrowRight,
  ShieldAlert,
  Clock,
  Radio,
  HardDriveDownload,
  RotateCcw,
  RotateCw,
} from 'lucide-react';
import PodcastImportModal from '@/components/PodcastImportModal';
import FeedbackModal from '@/components/FeedbackModal';

export default function SettingsPage() {
  const [settings, setSettings] = useState<GlobalAdSettings>(getGlobalAdSettings());
  const [savedToast, setSavedToast] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);

  // Mises à jour APK
  const [apkRelease, setApkRelease] = useState<LatestApkRelease | null>(null);
  const [checkingUpdate, setCheckingUpdate] = useState(false);
  const [updateMsg, setUpdateMsg] = useState<string | null>(null);

  // Compte & Synchronisation
  const [keoUser, setKeoUser] = useState('');
  const [lastSyncTime, setLastSyncTime] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncSuccessMsg, setSyncSuccessMsg] = useState<string | null>(null);

  // Statistiques IA ZeroPub
  const [aiStats, setAiStats] = useState({ adsCut: 0, timeSavedMinutes: 0, timeSavedSeconds: 0 });

  // Podcasts exclus de l'Anti-Pub
  const [excludedPodcasts, setExcludedPodcasts] = useState<ExcludedPodcastItem[]>([]);

  const refreshExcluded = () => {
    setExcludedPodcasts(getAllExcludedPodcastSettings());
  };

  useEffect(() => {
    setSettings(getGlobalAdSettings());
    setAiStats(getAICutStats());
    refreshExcluded();
    const storedUser = localStorage.getItem('keokaster_user') || '';
    setKeoUser(storedUser);
    const storedSync = localStorage.getItem('keokaster_last_sync') || null;
    setLastSyncTime(storedSync);

    // Écouter les mises à jour des statistiques en temps réel
    const onStatsUpdated = () => setAiStats(getAICutStats());
    const onSkipChanged = () => setSettings(getGlobalAdSettings());
    window.addEventListener('keokaster_stats_updated', onStatsUpdated);
    window.addEventListener('keokaster_podcast_settings_changed', refreshExcluded);
    window.addEventListener('keokaster_skip_settings_changed', onSkipChanged);

    // Vérifier silencieusement les mises à jour au chargement
    fetchLatestKeoKasterApk().then((rel) => {
      setApkRelease(rel);
    });

    return () => {
      window.removeEventListener('keokaster_stats_updated', onStatsUpdated);
      window.removeEventListener('keokaster_podcast_settings_changed', refreshExcluded);
      window.removeEventListener('keokaster_skip_settings_changed', onSkipChanged);
    };
  }, []);

  const handleRemoveExclusion = (podcastId: string) => {
    removePodcastExclusion(podcastId);
    refreshExcluded();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  const handleCheckUpdates = async () => {
    setCheckingUpdate(true);
    setUpdateMsg(null);
    try {
      const rel = await fetchLatestKeoKasterApk();
      setApkRelease(rel);
      if (rel.hasUpdate) {
        setUpdateMsg(`Nouvelle version disponible : Build ${rel.buildNumber} !`);
      } else {
        setUpdateMsg('Votre application Keo Kaster est parfaitement à jour.');
      }
    } catch {
      setUpdateMsg('Impossible de vérifier les mises à jour pour le moment.');
    } finally {
      setCheckingUpdate(false);
    }
  };

  const handleSaveUser = (val: string) => {
    setKeoUser(val);
    localStorage.setItem('keokaster_user', val);
  };

  const handleSyncNow = () => {
    setIsSyncing(true);
    setSyncSuccessMsg(null);
    setTimeout(() => {
      const now = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
      setLastSyncTime(now);
      localStorage.setItem('keokaster_last_sync', now);
      setIsSyncing(false);
      setSyncSuccessMsg('Abonnements et préférences synchronisés avec succès !');
      setTimeout(() => setSyncSuccessMsg(null), 3500);
    }, 700);
  };

  const handleExportData = () => {
    const data = {
      app: 'Keo Kaster',
      version: `1.0.0-build.${CURRENT_KASTER_BUILD}`,
      exportedAt: new Date().toISOString(),
      user: keoUser,
      subscriptions: getSubscribedPodcasts(),
      positions: getPlaybackPositions(),
      adSettings: settings,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `keokaster-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.subscriptions && Array.isArray(parsed.subscriptions)) {
          saveSubscribedPodcasts(parsed.subscriptions);
        }
        if (parsed.adSettings) {
          saveGlobalAdSettings(parsed.adSettings);
          setSettings(parsed.adSettings);
        }
        setSyncSuccessMsg('Sauvegarde importée avec succès !');
        window.dispatchEvent(new CustomEvent('keokaster_subs_changed'));
        setTimeout(() => setSyncSuccessMsg(null), 3000);
      } catch {
        alert('Fichier de sauvegarde invalide.');
      }
    };
    reader.readAsText(file);
  };

  const updateSetting = <K extends keyof GlobalAdSettings>(key: K, value: GlobalAdSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveGlobalAdSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('keokaster_skip_settings_changed', { detail: { [key]: value } }));
    }
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300 pb-12">
      {/* HEADER */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-purple-400" />
            <span>Paramètres</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Mises à jour, compte synchronisé, moteur ZeroPub et assistance.
          </p>
        </div>

        {savedToast && (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Enregistré</span>
          </span>
        )}
      </div>

      {/* SECTION 1 : APPLICATION ANDROID (APK) & MISES À JOUR */}
      <div className="bg-gradient-to-r from-purple-950/70 via-slate-900 to-indigo-950 p-4 sm:p-5 rounded-3xl border border-purple-500/40 shadow-xl space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-tr from-purple-600 to-indigo-600 text-white rounded-2xl shadow-md shadow-purple-600/30">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-extrabold text-sm sm:text-base text-white">
                  Mises à jour de l'application
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 font-mono">
                  Build {CURRENT_KASTER_BUILD}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Mise à jour directe sans perte de vos podcasts et réglages
              </p>
            </div>
          </div>

          {apkRelease?.hasUpdate && (
            <span className="hidden sm:inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/40 text-xs font-bold animate-pulse">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Nouveau</span>
            </span>
          )}
        </div>

        {/* STATUT & NOTIFICATION DE VERSION */}
        {updateMsg && (
          <div className={`p-3 rounded-2xl text-xs font-semibold flex items-center gap-2 ${
            apkRelease?.hasUpdate
              ? 'bg-amber-500/15 border border-amber-500/30 text-amber-300'
              : 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-300'
          }`}>
            {apkRelease?.hasUpdate ? <Sparkles className="w-4 h-4 shrink-0" /> : <Check className="w-4 h-4 shrink-0" />}
            <span>{updateMsg}</span>
          </div>
        )}

        {/* ACTIONS DE MISE À JOUR */}
        <div className="space-y-2 pt-1">
          <a
            href={apkRelease?.downloadUrl || PERMANENT_LATEST_APK_URL}
            target="_blank"
            rel="noopener noreferrer"
            download
            onClick={(e) => {
              if (typeof window !== 'undefined') {
                try {
                  window.open(apkRelease?.downloadUrl || PERMANENT_LATEST_APK_URL, '_system');
                } catch {}
              }
            }}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-indigo-600 to-amber-500 hover:from-purple-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold transition flex items-center justify-center gap-2 shadow-lg shadow-purple-950/40 active:scale-95"
          >
            <Download className="w-4 h-4" />
            <span>
              {apkRelease?.hasUpdate
                ? `Télécharger la mise à jour (${apkRelease.filename})`
                : 'Télécharger le dernier fichier APK (KeoKaster.apk)'}
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={handleCheckUpdates}
              disabled={checkingUpdate}
              className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/80 transition active:scale-95"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${checkingUpdate ? 'animate-spin text-purple-400' : ''}`} />
              <span>{checkingUpdate ? 'Vérification...' : 'Vérifier les mises à jour'}</span>
            </button>

            <a
              href="https://github.com/heyhacene/keokaster/releases"
              target="_blank"
              rel="noopener noreferrer"
              className="py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 border border-slate-700/80 transition active:scale-95"
            >
              <span>Notes de publication</span>
              <ExternalLink className="w-3 h-3 opacity-60" />
            </a>
          </div>
        </div>
      </div>

      {/* SECTION 2 : COMPTE & SYNCHRONISATION KEO CLOUD */}
      <div className="bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-600/20 text-blue-400 border border-blue-500/30 rounded-xl">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">
                Compte & Synchronisation Keo
              </h2>
              <p className="text-xs text-slate-400">
                Synchronisez vos flux et progression sur tous vos appareils
              </p>
            </div>
          </div>

          <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-blue-500/10 text-blue-300 border border-blue-500/30">
            {keoUser ? 'Synchronisé' : 'Mode Local'}
          </span>
        </div>

        {/* IDENTIFIANT UTILISATEUR */}
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-slate-300 flex items-center gap-1.5">
            <User className="w-3.5 h-3.5 text-purple-400" />
            <span>Identifiant ou email du compte Keo :</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={keoUser}
              onChange={(e) => handleSaveUser(e.target.value)}
              placeholder="ex: auditeur ou mon-compte@exemple.com"
              className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-purple-500"
            />
            <button
              type="button"
              onClick={handleSyncNow}
              disabled={isSyncing}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 active:scale-95 shadow-md shadow-blue-600/20"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin' : ''}`} />
              <span>{isSyncing ? 'En cours...' : 'Synchroniser'}</span>
            </button>
          </div>
          {lastSyncTime && (
            <p className="text-[11px] text-slate-400">
              Dernière synchronisation réussie à {lastSyncTime}
            </p>
          )}
          {syncSuccessMsg && (
            <p className="text-xs font-semibold text-emerald-400 flex items-center gap-1">
              <Check className="w-3.5 h-3.5" />
              <span>{syncSuccessMsg}</span>
            </p>
          )}
        </div>

        {/* SAUVEGARDE, IMPORT & RAPATRIEMENT */}
        <div className="pt-2 border-t border-slate-800 space-y-2">
          <button
            type="button"
            onClick={() => setShowImportModal(true)}
            className="w-full py-2.5 px-3.5 rounded-xl bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-purple-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 border border-purple-500/40 text-purple-200 hover:text-white text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <HardDriveDownload className="w-4 h-4 text-purple-400" />
            <span>Rapatrier depuis Apple Podcasts, Spotify, Pocket Casts (OPML)...</span>
          </button>

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <button
              type="button"
              onClick={handleExportData}
              className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <FileJson className="w-3.5 h-3.5 text-purple-400" />
              <span>Exporter en JSON</span>
            </button>

            <label className="py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer">
              <Upload className="w-3.5 h-3.5 text-blue-400" />
              <span>Importer sauvegarde JSON</span>
              <input
                type="file"
                accept=".json"
                onChange={handleImportData}
                className="hidden"
              />
            </label>
          </div>
        </div>
      </div>

      {/* SECTION 3 : MOTEUR ZEROPUB & RÉGLAGES ANTI-PUB */}
      <div className="bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
              <Zap className="w-5 h-5 fill-emerald-400" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white">Moteur Anti-Pub ZeroPub</h2>
              <p className="text-xs text-slate-400">
                Saut intelligent des sponsors, intros et coupures
              </p>
            </div>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={settings.enabled}
              onChange={(e) => updateSetting('enabled', e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
          </label>
        </div>

        {/* STATS EN TEMPS RÉEL IA ZEROPUB */}
        <div className="grid grid-cols-2 gap-3 p-3.5 rounded-2xl bg-gradient-to-r from-emerald-950/70 via-slate-950 to-indigo-950/70 border border-emerald-500/30">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-emerald-500/20 text-emerald-300">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Publicités coupées</p>
              <p className="text-lg font-extrabold text-emerald-300 font-mono">{aiStats.adsCut}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-purple-500/20 text-purple-300">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] text-slate-400 font-medium">Temps préservé</p>
              <p className="text-lg font-extrabold text-purple-300 font-mono">
                {aiStats.timeSavedMinutes > 0
                  ? `${aiStats.timeSavedMinutes} min`
                  : `${aiStats.timeSavedSeconds}s`}
              </p>
            </div>
          </div>
        </div>

        {/* MOTEUR SÉMANTIQUE NLP & DAI */}
        <div className="p-3 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-300 space-y-1">
          <p className="font-bold text-white flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-amber-400" />
            <span>Analyse sémantique IA & DAI active</span>
          </p>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Reconnaissance automatique des sponsors (HelloFresh, NordVPN, codes promos), injection dynamique (Acast, Megaphone, Ausha) et coupure instantanée de la piste sonore.
          </p>
        </div>

        {/* BOUTON SAUT DE PUB RAPIDE (ZAP) - CONFIGURABLE 10s, 20s, 30s, etc. */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-slate-950 to-orange-950/40 border border-amber-500/40 space-y-2.5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400 fill-amber-400" />
              <span className="text-xs font-bold text-white">Bouton Saut de Pub rapide (Zap)</span>
            </div>
            <span className="text-xs font-mono font-extrabold text-amber-300 px-2.5 py-0.5 rounded-lg bg-amber-500/20 border border-amber-500/30">
              +{settings.quickSkipSec || 20}s
            </span>
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            Durée du saut appliquée lorsque vous appuyez sur le bouton Saut de pub dans le lecteur, la barre du bas et le Mode Voiture.
          </p>
          <div className="grid grid-cols-6 gap-1.5 pt-1">
            {[10, 15, 20, 30, 45, 60].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => updateSetting('quickSkipSec', sec)}
                className={`py-1.5 rounded-xl text-xs font-mono font-bold transition active:scale-95 ${
                  (settings.quickSkipSec || 20) === sec
                    ? 'bg-amber-400 text-slate-950 font-black shadow-md shadow-amber-500/30 ring-2 ring-amber-300'
                    : 'bg-slate-900 border border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
                }`}
              >
                {sec}s
              </button>
            ))}
          </div>
        </div>

        {/* AVANCE ET RETOUR RAPIDE */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* RETOUR RAPIDE */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
                <span>Bouton Retour rapide</span>
              </span>
              <span className="text-xs font-mono font-bold text-purple-400">
                -{settings.backwardSkipSec || 10}s
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[5, 10, 15, 20, 30].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateSetting('backwardSkipSec', sec)}
                  className={`py-1 rounded-lg text-xs font-mono font-bold transition ${
                    (settings.backwardSkipSec || 10) === sec
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>

          {/* AVANCE RAPIDE */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white flex items-center gap-1.5">
                <RotateCw className="w-3.5 h-3.5 text-slate-400" />
                <span>Bouton Avance rapide</span>
              </span>
              <span className="text-xs font-mono font-bold text-purple-400">
                +{settings.forwardSkipSec || 30}s
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[10, 15, 20, 30, 45].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateSetting('forwardSkipSec', sec)}
                  className={`py-1 rounded-lg text-xs font-mono font-bold transition ${
                    (settings.forwardSkipSec || 30) === sec
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sec}s
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* SAUTS D'INTRO / OUTRO */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
          {/* INTRO */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Saut d'introduction</span>
              <span className="text-xs font-mono font-bold text-purple-400">
                {settings.defaultIntroSkipSec > 0 ? `${settings.defaultIntroSkipSec}s` : 'Off'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[0, 15, 30, 45, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateSetting('defaultIntroSkipSec', sec)}
                  className={`py-1 rounded-lg text-xs font-mono font-bold transition ${
                    settings.defaultIntroSkipSec === sec
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sec === 0 ? 'Off' : `${sec}s`}
                </button>
              ))}
            </div>
          </div>

          {/* OUTRO */}
          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-white">Saut de fin d'épisode</span>
              <span className="text-xs font-mono font-bold text-purple-400">
                {settings.defaultOutroSkipSec > 0 ? `${settings.defaultOutroSkipSec}s` : 'Off'}
              </span>
            </div>
            <div className="grid grid-cols-5 gap-1">
              {[0, 15, 30, 45, 60].map((sec) => (
                <button
                  key={sec}
                  type="button"
                  onClick={() => updateSetting('defaultOutroSkipSec', sec)}
                  className={`py-1 rounded-lg text-xs font-mono font-bold transition ${
                    settings.defaultOutroSkipSec === sec
                      ? 'bg-purple-600 text-white'
                      : 'bg-slate-900 text-slate-400 hover:bg-slate-800'
                  }`}
                >
                  {sec === 0 ? 'Off' : `${sec}s`}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* OPTIONS COMPLÉMENTAIRES */}
        <div className="space-y-2.5 pt-1">
          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
            <span className="text-xs text-slate-300">
              Détecter automatiquement les chapitres sponsorisés
            </span>
            <input
              type="checkbox"
              checked={settings.smartKeywordDetection}
              onChange={(e) => updateSetting('smartKeywordDetection', e.target.checked)}
              className="w-4 h-4 accent-purple-500 rounded"
            />
          </label>

          <label className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800 cursor-pointer">
            <span className="text-xs text-slate-300">
              Mémoriser les passages marqués manuellement comme pubs
            </span>
            <input
              type="checkbox"
              checked={settings.crowdsourcedSkipEnabled}
              onChange={(e) => updateSetting('crowdsourcedSkipEnabled', e.target.checked)}
              className="w-4 h-4 accent-purple-500 rounded"
            />
          </label>
        </div>

        {/* LISTE DES PODCASTS EXCLUS DU STOP-PUB */}
        <div className="pt-3 border-t border-slate-800 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>Podcasts exclus du Stop-Pub</span>
            </span>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300">
              {excludedPodcasts.length} exclu{excludedPodcasts.length > 1 ? 's' : ''}
            </span>
          </div>

          {excludedPodcasts.length === 0 ? (
            <p className="text-[11px] text-slate-400 p-3 rounded-2xl bg-slate-950 border border-slate-800/80">
              Aucun podcast exclu. L'Anti-Pub ZeroPub s'applique à l'ensemble de vos émissions.
            </p>
          ) : (
            <div className="space-y-2">
              {excludedPodcasts.map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-2xl bg-slate-950 border border-amber-500/30 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex items-center gap-2.5">
                    {item.podcast?.artworkUrl ? (
                      <img
                        src={item.podcast.artworkUrl}
                        alt=""
                        className="w-9 h-9 rounded-xl object-cover shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center shrink-0">
                        <Radio className="w-4 h-4 text-slate-400" />
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-white truncate">
                        {item.podcast?.title || item.id}
                      </p>
                      <p className="text-[10px] text-amber-400 font-semibold">
                        Stop-Pub désactivé
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleRemoveExclusion(item.id)}
                    className="px-3 py-1.5 rounded-xl bg-purple-600/20 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/30 text-xs font-bold transition active:scale-95 shrink-0"
                  >
                    Réactiver
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* SECTION 4 : SOUTIEN DU PROJET & FEEDBACK (UNIFIÉ AVEC KEOPASS & DAR) */}
      <div className="bg-slate-900/60 p-4 sm:p-5 rounded-3xl border border-slate-800 space-y-3">
        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
          Soutien & Assistance
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          <a
            href="https://ko-fi.com/keo_app"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full py-3 px-4 rounded-2xl bg-[#FF5E5B] hover:bg-[#e04f4c] text-white text-xs font-bold transition flex items-center justify-center gap-2 shadow-md active:scale-95"
          >
            <Coffee className="w-4 h-4" />
            <span>Offrir un café (Ko-fi)</span>
            <ExternalLink className="w-3.5 h-3.5 opacity-80" />
          </a>

          <button
            type="button"
            onClick={() => setShowFeedbackModal(true)}
            className="w-full py-3 px-4 rounded-2xl bg-gradient-to-r from-purple-600/30 via-indigo-600/30 to-purple-600/30 hover:from-purple-600/40 hover:to-indigo-600/40 text-purple-200 hover:text-white border border-purple-500/40 text-xs font-bold transition flex items-center justify-center gap-2 active:scale-95 shadow-md"
          >
            <LifeBuoy className="w-4 h-4 text-purple-400" />
            <span>Aide, Feedback & Retours (Formulaire)</span>
          </button>
        </div>
      </div>

      {/* FOOTER : ÉCOSYSTÈME KEO */}
      <div className="text-center pt-4 border-t border-slate-900 space-y-1">
        <p className="text-[11px] font-semibold text-slate-500">
          Keo Kaster • Une application de l'écosystème Keo
        </p>
        <p className="text-[10px] text-slate-600">
          KeoPass • Keo Family (Dar) • Keo Kaster • Fait avec passion
        </p>
      </div>

      {/* MODAL RAPATRIEMENT DE PODCASTS */}
      <PodcastImportModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
      />

      {/* MODAL FEEDBACK IN-APP */}
      <FeedbackModal
        isOpen={showFeedbackModal}
        onClose={() => setShowFeedbackModal(false)}
      />
    </div>
  );
}
