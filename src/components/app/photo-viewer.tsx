'use client';

import { useEffect } from 'react';
import { X } from 'lucide-react';

/**
 * Full-screen in-app photo viewer. Every saved photo opens here: they are stored as data URLs,
 * which the browser refuses to open as a link or in a new tab.
 */
export function PhotoViewer({ url, label, onClose }: { url: string; label: string; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div role="dialog" aria-modal="true" aria-label={label} className="fixed inset-0 z-[200] flex flex-col bg-black/90" onClick={onClose}>
      <div className="flex items-center justify-between gap-3 px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))]">
        <p className="truncate text-lg font-semibold text-white">{label}</p>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-white/15 text-white"
        >
          <X className="h-6 w-6" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={url} alt={label} onClick={(e) => e.stopPropagation()} className="max-h-full max-w-full rounded-lg object-contain" />
      </div>
    </div>
  );
}
