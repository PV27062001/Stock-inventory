'use client';

import { useState } from 'react';
import { Eye } from 'lucide-react';
import { PhotoViewer } from './photo-viewer';

/** A "View" button that opens an uploaded ID card in the full-screen in-app viewer. */
export function IdCardViewer({ url, label }: { url: string; label: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-2 inline-flex min-h-11 items-center gap-2 rounded-xl border border-border bg-card px-4 py-2 text-sm font-semibold text-primary shadow-soft active:scale-95"
      >
        <Eye className="h-4 w-4" /> View {label}
      </button>

      {open && <PhotoViewer url={url} label={label} onClose={() => setOpen(false)} />}
    </>
  );
}
