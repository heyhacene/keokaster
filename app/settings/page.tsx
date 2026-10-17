'use client';

import React, { useState, useEffect } from 'react';
import { GlobalAdSettings } from '@/types/podcast';
import { getGlobalAdSettings, saveGlobalAdSettings } from '@/lib/storage';
import { ShieldCheck, Zap, Bell, Sparkles, Clock, RefreshCw, Check } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<GlobalAdSettings>(getGlobalAdSettings());
  const [savedToast, setSavedToast] = useState(false);

  useEffect(() => {
    setSettings(getGlobalAdSettings());
  }, []);

  const updateSetting = <K extends keyof GlobalAdSettings>(key: K, value: GlobalAdSettings[K]) => {
    const updated = { ...settings, [key]: value };
    setSettings(updated);
    saveGlobalAdSettings(updated);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto animate-in fade-in duration-300">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-emerald-400" />
            <span>Moteur ZeroPub & Paramètres</span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Configurez le comportement du bloqueur de publicités et sponsors pour vos podcasts.
          </p>
        </div>

        {savedToast && (
          <span className="text-xs font-bold text-emerald-400 flex items-center gap-1 animate-in fade-in">
            <Check className="w-3.5 h-3.5" />
            <span>Enregistré</span>
          </span>
        )}
      </div>

      {/* STATUT GLOBAL DU BLOQUEUR */}
      <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-purple-950/60 via-slate-900 to-indigo-950 border border-purple-500/30 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            <Zap className="w-5 h-5 fill-emerald-400" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white">Filtrage publicitaire actif</h2>
            <p className="text-xs text-slate-400">
              Saute automatiquement les coupures et sponsors détectés.
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

      {/* OPTIONS DÉTAILLÉES */}
      <div className="space-y-4">
        {/* SAUT D'INTRO PAR DÉFAUT */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Saut d'introduction automatique</span>
            <span className="text-xs font-mono font-bold text-purple-400">
              {settings.defaultIntroSkipSec > 0 ? `${settings.defaultIntroSkipSec}s` : 'Désactivé'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Saute les premières secondes de chaque épisode (souvent composées de jingles et d'auto-promos).
          </p>
          <div className="flex gap-2 pt-1">
            {[0, 15, 30, 45, 60, 90].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => updateSetting('defaultIntroSkipSec', sec)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  settings.defaultIntroSkipSec === sec
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-850 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {sec === 0 ? 'Off' : `${sec}s`}
              </button>
            ))}
          </div>
        </div>

        {/* SAUT DE FIN D'ÉPISODE */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-white">Saut de fin d'épisode (Outro)</span>
            <span className="text-xs font-mono font-bold text-purple-400">
              {settings.defaultOutroSkipSec > 0 ? `${settings.defaultOutroSkipSec}s` : 'Désactivé'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400">
            Saute les dernières secondes pour passer directement à l'épisode suivant sans les remerciements et sponsors finaux.
          </p>
          <div className="flex gap-2 pt-1">
            {[0, 15, 30, 45, 60].map((sec) => (
              <button
                key={sec}
                type="button"
                onClick={() => updateSetting('defaultOutroSkipSec', sec)}
                className={`flex-1 py-1.5 rounded-xl text-xs font-mono font-bold transition ${
                  settings.defaultOutroSkipSec === sec
                    ? 'bg-purple-600 text-white'
                    : 'bg-slate-850 text-slate-400 hover:bg-slate-800'
                }`}
              >
                {sec === 0 ? 'Off' : `${sec}s`}
              </button>
            ))}
          </div>
        </div>

        {/* DÉTECTION INTELLIGENTE PAR MOTS-CLÉS */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-white">Détection des chapitres sponsorisés</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Analyse les balises Podcast 2.0 pour repérer les chapitres marqués "Sponsor", "Partenaire", "Promo".
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.smartKeywordDetection}
            onChange={(e) => updateSetting('smartKeywordDetection', e.target.checked)}
            className="w-4 h-4 accent-purple-500 rounded shrink-0 cursor-pointer"
          />
        </div>

        {/* SIGNALEMENT LOCAL & COMMUNAUTAIRE */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-white">Saut des pubs signalées</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Mémorise les passages que vous marquez comme pubs pour les sauter définitivement.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.crowdsourcedSkipEnabled}
            onChange={(e) => updateSetting('crowdsourcedSkipEnabled', e.target.checked)}
            className="w-4 h-4 accent-purple-500 rounded shrink-0 cursor-pointer"
          />
        </div>

        {/* NOTIFICATION VISUELLE AU SAUT */}
        <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between gap-4">
          <div className="space-y-0.5">
            <h3 className="text-xs font-bold text-white">Bannière de confirmation</h3>
            <p className="text-[11px] text-slate-400 leading-snug">
              Affiche une brève notification discrète lorsqu'un segment publicitaire vient d'être sauté.
            </p>
          </div>
          <input
            type="checkbox"
            checked={settings.showNotificationOnSkip}
            onChange={(e) => updateSetting('showNotificationOnSkip', e.target.checked)}
            className="w-4 h-4 accent-purple-500 rounded shrink-0 cursor-pointer"
          />
        </div>
      </div>
    </div>
  );
}
