'use client';

import { useEffect, useState } from 'react';
import { Download, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

/** Shows an in-app "Install app" banner on Android Chrome when the PWA is installable. */
export function InstallBanner() {
  const [deferred, setDeferred] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BeforeInstallPromptEvent);
    };
    const onInstalled = () => setDeferred(null);
    window.addEventListener('beforeinstallprompt', onPrompt);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onPrompt);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  if (!deferred || dismissed) return null;

  const install = async () => {
    await deferred.prompt();
    await deferred.userChoice;
    setDeferred(null);
  };

  return (
    <div className="fixed bottom-28 left-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2">
      <div className="flex items-center gap-3 rounded-2xl border border-border bg-card p-3 shadow-elevated">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-[#4C9AFF] to-[#1A73E8] text-white">
          <Download className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-sm font-semibold text-foreground">Install this app</p>
          <p className="text-xs text-muted-foreground">Add to your home screen for faster access</p>
        </div>
        <button
          onClick={install}
          className="rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground shadow-soft active:scale-95"
        >
          Install
        </button>
        <button
          onClick={() => setDismissed(true)}
          aria-label="Dismiss"
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-secondary"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
