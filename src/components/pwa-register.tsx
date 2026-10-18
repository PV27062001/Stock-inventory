'use client';

import { useEffect } from 'react';

/** Registers the service worker so the app is installable and works offline. */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return; // avoid caching during dev
    if (!('serviceWorker' in navigator)) return;
    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore registration errors */
    });
  }, []);

  return null;
}
