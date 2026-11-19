'use client';

import { useEffect } from 'react';
import { isNativeApp } from '@/lib/native';

/** Registers the service worker so the app is installable and works offline. */
export function PWARegister() {
  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (process.env.NODE_ENV !== 'production') return; // avoid caching during dev
    if (!('serviceWorker' in navigator)) return;

    // The Android app always loads the live site fresh; a service worker there would only
    // risk serving an old build, so remove any that an earlier version registered.
    if (isNativeApp()) {
      navigator.serviceWorker.getRegistrations()
        .then((regs) => Promise.all(regs.map((r) => r.unregister())))
        .catch(() => { /* ignore */ });
      return;
    }

    navigator.serviceWorker.register('/sw.js').catch(() => {
      /* ignore registration errors */
    });
  }, []);

  return null;
}
