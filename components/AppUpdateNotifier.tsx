'use client';

import React, { useState, useEffect } from 'react';
import { Sparkles, Download, X, ExternalLink } from 'lucide-react';
import { fetchLatestKeoKasterApk, LatestApkRelease } from '@/lib/apkUpdate';

export default function AppUpdateNotifier() {
  const [release, setRelease] = useState<LatestApkRelease | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    fetchLatestKeoKasterApk().then((rel) => {
      if (rel.hasUpdate) {
        setRelease(rel);
      }
    });

    const onFocus = () => {
      fetchLatestKeoKasterApk().then((rel) => {
        if (rel.hasUpdate) setRelease(rel);
      });
    };

    window.addEventListener('focus', onFocus);
    window.addEventListener('online', onFocus);
    return () => {
      window.removeEventListener('focus', onFocus);
      window.removeEventListener('online', onFocus);
    };
  }, []);

  if (!release || !release.hasUpdate || dismissed) return null;

  return (
    <aside
      aria-label="Notification de mise à jour"
      className="fixed bottom-24 left-3 right-3 max-w-md mx-auto bg-gradient-to-r from-purple-900 via-indigo-900 to-amber-900 text-white p-3.5 rounded-2xl shadow-2xl z-50 flex items-center justify-between gap-3 animate-in slide-in-from-bottom border border-amber-400/40 backdrop-blur-xl"
    >
      <div className="flex items-center gap-2.5 min-w-0 flex-1">
        <div className="p-2 bg-amber-500/20 text-amber-300 rounded-xl shrink-0">
          <Sparkles className="w-5 h-5 animate-pulse" />
        </div>
        <div className="min-w-0">
          <div className="font-extrabold text-xs sm:text-sm leading-tight text-white flex items-center gap-1.5">
            <span>Mise à jour disponible !</span>
            <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-amber-500/30 text-amber-200 border border-amber-400/30 font-mono">
              Build {release.buildNumber}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 truncate mt-0.5">
            Installez la nouvelle version pour profiter des derniers correctifs
          </p>
        </div>
      </div>

      <div className="flex items-center gap-1.5 shrink-0">
        <a
          href={release.downloadUrl}
          target="_blank"
          rel="noopener noreferrer"
          download
          onClick={(e) => {
            if (typeof window !== 'undefined') {
              try {
                window.open(release.downloadUrl, '_system');
              } catch {}
            }
          }}
          className="px-3 py-2 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-slate-950 text-xs font-black rounded-xl shadow-md transition-transform active:scale-95 flex items-center gap-1.5"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Mettre à jour</span>
        </a>
        <button
          type="button"
          onClick={() => setDismissed(true)}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-white/10 transition"
          title="Fermer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
