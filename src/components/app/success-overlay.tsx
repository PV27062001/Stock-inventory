'use client';

import { useEffect } from 'react';
import { Check } from 'lucide-react';

interface SuccessOverlayProps {
  show: boolean;
  message: string;
  onDone?: () => void;
  durationMs?: number;
}

/** Full-screen green tick (payment-app style) that auto-dismisses via onDone. */
export function SuccessOverlay({ show, message, onDone, durationMs = 1600 }: SuccessOverlayProps) {
  useEffect(() => {
    if (!show || !onDone) return;
    const t = setTimeout(onDone, durationMs);
    return () => clearTimeout(t);
  }, [show, onDone, durationMs]);

  if (!show) return null;

  return (
    <div role="status" aria-live="polite" className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-background/95 animate-in fade-in duration-200">
      <div className="flex h-32 w-32 items-center justify-center rounded-full bg-emerald-500 shadow-elevated animate-in zoom-in-50 duration-500">
        <Check className="h-20 w-20 text-white animate-in zoom-in duration-700" strokeWidth={3.5} />
      </div>
      <p className="px-6 text-center text-2xl font-bold text-foreground animate-in slide-in-from-bottom-4 duration-500">{message}</p>
    </div>
  );
}
