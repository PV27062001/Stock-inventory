'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';
import { isNativeApp, getNativeBuild } from '@/lib/native';

const DISMISSED_KEY = 'app-update-dismissed-build';

/**
 * Android app only: tells the user a newer APK exists. Screens update live from the site;
 * this is just for the rare native shell changes. Bump `latestBuild` in
 * public/app-version.json to the new APK's versionCode when you ship one.
 */
export function AppUpdateBanner() {
  const [latestBuild, setLatestBuild] = useState<number | null>(null);

  useEffect(() => {
    if (!isNativeApp()) return;
    let cancelled = false;

    (async () => {
      try {
        const [installed, res] = await Promise.all([
          getNativeBuild(),
          fetch('/app-version.json', { cache: 'no-store' }),
        ]);
        const { latestBuild: latest } = (await res.json()) as { latestBuild?: number };
        if (cancelled || installed == null || typeof latest !== 'number' || latest <= installed) return;
        if (localStorage.getItem(DISMISSED_KEY) === String(latest)) return;
        setLatestBuild(latest);
      } catch {
        /* offline or storage blocked: no banner */
      }
    })();

    return () => { cancelled = true; };
  }, []);

  if (latestBuild == null) return null;

  const dismiss = () => {
    try { localStorage.setItem(DISMISSED_KEY, String(latestBuild)); } catch { /* ignore */ }
    setLatestBuild(null);
  };

  return (
    <div className="fixed bottom-28 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-elevated">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C9AFF] to-[#1A73E8] text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">New app version available</p>
          <p className="text-xs text-muted-foreground">Install the latest APK to keep everything working</p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Dismiss"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
