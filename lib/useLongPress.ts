'use client';

import { useRef, useCallback } from 'react';

interface UseLongPressOptions {
  delay?: number;
  onLongPress: () => void;
}

export function useLongPress({ delay = 480, onLongPress }: UseLongPressOptions) {
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isLongPressActiveRef = useRef(false);
  const startCoordsRef = useRef<{ x: number; y: number } | null>(null);

  const start = useCallback(
    (e: React.TouchEvent | React.MouseEvent) => {
      isLongPressActiveRef.current = false;
      if ('touches' in e && e.touches.length > 0) {
        startCoordsRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
        };
      } else if ('clientX' in e) {
        startCoordsRef.current = { x: e.clientX, y: e.clientY };
      }

      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }

      timerRef.current = setTimeout(() => {
        isLongPressActiveRef.current = true;
        // Vibration tactile légère si le matériel le supporte
        if (typeof window !== 'undefined' && 'vibrate' in navigator) {
          try {
            navigator.vibrate(40);
          } catch {}
        }
        onLongPress();
      }, delay);
    },
    [onLongPress, delay]
  );

  const move = useCallback((e: React.TouchEvent) => {
    if (!startCoordsRef.current || !e.touches || e.touches.length === 0) return;
    const touch = e.touches[0];
    const diffX = Math.abs(touch.clientX - startCoordsRef.current.x);
    const diffY = Math.abs(touch.clientY - startCoordsRef.current.y);
    // Tolérance de 10px pour distinguer un appui maintenu d'un scroll
    if (diffX > 10 || diffY > 10) {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }
    }
  }, []);

  const end = useCallback((e: React.TouchEvent | React.MouseEvent) => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    // Si l'appui long vient de se déclencher, on empêche le clic parasite
    if (isLongPressActiveRef.current && e.cancelable) {
      try {
        e.preventDefault();
      } catch {}
    }
  }, []);

  const contextMenu = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      onLongPress();
    },
    [onLongPress]
  );

  return {
    handlers: {
      onTouchStart: start,
      onTouchMove: move,
      onTouchEnd: end,
      onTouchCancel: end,
      onContextMenu: contextMenu,
    },
    isLongPressActive: () => isLongPressActiveRef.current,
  };
}
