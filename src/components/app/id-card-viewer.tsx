'use client';

import { useState } from 'react';
import { Eye, X, Download } from 'lucide-react';

/** A "View" button that opens an uploaded ID card in a full-screen in-app viewer. */
export function IdCardViewer({ url, label }: { url: string; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-soft active:scale-95"
      >
        <Eye className="h-4 w-4" /> View {label}
      </button>

      {open && (
        <div className="fixed inset-0 z-[200] flex flex-col bg-black/90">
          <div className="flex items-center justify-between gap-3 p-4">
            <p className="font-semibold text-white">{label}</p>
            <div className="flex items-center gap-2">
              <a
                href={url}
                download
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 rounded-lg bg-white/15 px-3 py-2 text-sm font-medium text-white"
              >
                <Download className="h-4 w-4" /> Download
              </a>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/15 text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex flex-1 items-center justify-center overflow-auto p-4">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={url} alt={label} className="max-h-[82vh] max-w-full rounded-lg object-contain" />
          </div>
        </div>
      )}
    </>
  );
}
