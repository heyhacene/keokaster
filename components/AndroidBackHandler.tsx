'use client';

import React, { useEffect, useState, useRef } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePlayer } from '@/lib/playerContext';

export default function AndroidBackHandler() {
  const pathname = usePathname();
  const router = useRouter();
  const { isFullPlayerOpen, closeFullPlayer } = usePlayer();

  const [showExitToast, setShowExitToast] = useState(false);

  const isFullPlayerOpenRef = useRef(isFullPlayerOpen);
  isFullPlayerOpenRef.current = isFullPlayerOpen;

  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  const closeFullPlayerRef = useRef(closeFullPlayer);
  closeFullPlayerRef.current = closeFullPlayer;

  useEffect(() => {
    let removeListener: (() => void) | null = null;
    let lastBackPressTime = 0;

    async function initBackHandler() {
      if (typeof window === 'undefined') return;

      try {
        const { App } = await import('@capacitor/app');

        const listener = await App.addListener('backButton', () => {
          // 1. Si le grand lecteur plein écran est ouvert, on le referme simplement
          if (isFullPlayerOpenRef.current) {
            closeFullPlayerRef.current();
            return;
          }

          const currentPath = pathnameRef.current;

          // 2. Si on est sur une page secondaire (/podcast, /search, /library, /settings), retour en arrière
          if (currentPath && currentPath !== '/' && currentPath !== '') {
            router.back();
            return;
          }

          // 3. Si on est sur la page d'accueil ('/'), double-retour requis pour quitter
          const now = Date.now();
          if (now - lastBackPressTime < 2000) {
            // Deuxième appui rapide (< 2 secondes) : on quitte l'application proprement
            App.exitApp();
          } else {
            // Premier appui : on enregistre le timestamp et on affiche le toast
            lastBackPressTime = now;
            setShowExitToast(true);
            setTimeout(() => {
              setShowExitToast(false);
            }, 2000);
          }
        });

        removeListener = () => {
          listener.remove();
        };
      } catch {
        // En mode navigateur pur, le plugin Capacitor natif n'est pas actif
      }
    }

    initBackHandler();

    return () => {
      if (removeListener) removeListener();
    };
  }, [router]);

  if (!showExitToast) return null;

  return (
    <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-50 animate-in fade-in zoom-in-95 duration-200 pointer-events-none">
      <div className="px-4 py-2.5 rounded-2xl bg-slate-900/95 border border-purple-500/50 text-white text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2">
        <span className="w-2 h-2 rounded-full bg-purple-400 animate-pulse" />
        <span>Appuyez une nouvelle fois pour quitter</span>
      </div>
    </div>
  );
}
