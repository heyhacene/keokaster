'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Radio, Search, Library, Settings, ShieldCheck, ListMusic } from 'lucide-react';
import { getSubscribedPodcasts } from '@/lib/storage';

export default function Navbar() {
  const pathname = usePathname();
  const [subCount, setSubCount] = useState<number>(0);

  const refreshSubCount = () => {
    try {
      const subs = getSubscribedPodcasts();
      setSubCount(subs.length);
    } catch {
      setSubCount(0);
    }
  };

  useEffect(() => {
    refreshSubCount();
    window.addEventListener('keokaster_subs_changed', refreshSubCount);
    return () => window.removeEventListener('keokaster_subs_changed', refreshSubCount);
  }, []);

  const isHomeActive = pathname === '/';
  const isSearchActive = pathname?.startsWith('/search');
  const isPlaylistsActive = pathname?.startsWith('/playlists');
  const isLibraryActive = pathname?.startsWith('/library');
  const isSettingsActive = pathname?.startsWith('/settings');

  return (
    <header className="sticky top-0 z-30 bg-slate-950/90 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-4xl mx-auto px-3 sm:px-4 h-16 flex items-center justify-between gap-2">
        {/* LOGO KEO KASTER */}
        <Link href="/" className="flex items-center gap-2.5 group shrink-0" title="Accueil Keo Kaster">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl overflow-hidden shadow-md shadow-purple-500/20 group-hover:scale-105 transition border border-purple-500/40 bg-slate-950 flex items-center justify-center">
            <img src="/icon.svg" alt="Keo Kaster" className="w-full h-full object-cover" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-sm sm:text-base tracking-tight text-white">
                Keo <span className="bg-gradient-to-r from-purple-400 to-amber-400 bg-clip-text text-transparent">Kaster</span>
              </span>
              <span className="hidden xs:inline-flex text-[10px] font-bold px-1.5 py-0.2 rounded-md bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 items-center gap-0.5">
                <ShieldCheck className="w-2.5 h-2.5" />
                <span>ZeroPub</span>
              </span>
            </div>
          </div>
        </Link>

        {/* NAVIGATION AVEC GROS BOUTONS FACILES D'ACCÈS */}
        <nav className="flex items-center gap-1.5 sm:gap-2">
          {/* LIEN DÉCOUVRIR (DESKTOP) */}
          <Link
            href="/"
            className={`hidden sm:flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition active:scale-95 ${
              isHomeActive
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900'
            }`}
          >
            <Radio className="w-4 h-4" />
            <span>Découvrir</span>
          </Link>

          {/* LIEN RECHERCHE */}
          <Link
            href="/search"
            className={`flex items-center justify-center p-2.5 sm:px-3 sm:py-2 rounded-2xl text-xs font-bold transition active:scale-95 ${
              isSearchActive
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
            title="Rechercher des podcasts"
          >
            <Search className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1.5">Recherche</span>
          </Link>

          {/* LIEN PLAYLISTS */}
          <Link
            href="/playlists"
            className={`flex items-center justify-center p-2.5 sm:px-3 sm:py-2 rounded-2xl text-xs font-bold transition active:scale-95 ${
              isPlaylistsActive
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
            title="Mes Playlists"
          >
            <ListMusic className="w-5 h-5 sm:w-4 sm:h-4 text-purple-300" />
            <span className="hidden sm:inline ml-1.5">Playlists</span>
          </Link>

          {/* GROS BOUTON BIBLIOTHÈQUE MIS EN AVANT */}
          <Link
            href="/library"
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 sm:py-2.5 rounded-2xl text-xs font-extrabold transition active:scale-95 shadow-md ${
              isLibraryActive
                ? 'bg-purple-600 text-white shadow-purple-600/40 ring-2 ring-purple-400/40'
                : 'bg-purple-950/40 hover:bg-purple-900/60 text-purple-200 hover:text-white border border-purple-500/40'
            }`}
            title="Accéder à ma bibliothèque"
          >
            <Library className="w-5 h-5 sm:w-4 sm:h-4 text-purple-300 fill-purple-400/20" />
            <span className="font-extrabold tracking-tight">Bibliothèque</span>
            {subCount > 0 && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono font-bold ${
                isLibraryActive
                  ? 'bg-white text-purple-700'
                  : 'bg-purple-500/30 text-purple-200 border border-purple-400/30'
              }`}>
                {subCount}
              </span>
            )}
          </Link>

          {/* LIEN PARAMÈTRES */}
          <Link
            href="/settings"
            className={`flex items-center justify-center p-2.5 sm:px-3 sm:py-2 rounded-2xl text-xs font-bold transition active:scale-95 ${
              isSettingsActive
                ? 'bg-purple-600/20 text-purple-300 border border-purple-500/30'
                : 'text-slate-400 hover:text-white hover:bg-slate-900 border border-transparent'
            }`}
            title="Paramètres & Anti-Pub"
          >
            <Settings className="w-5 h-5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline ml-1.5">Paramètres</span>
          </Link>
        </nav>
      </div>
    </header>
  );
}
