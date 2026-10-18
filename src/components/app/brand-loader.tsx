'use client';

/** Branded full-screen loader — shows the shop identity with a gentle animation. */
export function BrandLoader({ label }: { label?: string }) {
  return (
    <div className="flex min-h-screen w-full flex-col items-center justify-center gap-5 bg-background">
      {/* Spinning ring around a softly pulsing emblem */}
      <div className="relative flex h-24 w-24 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-4 border-primary/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary [animation-duration:900ms]" />
        <span className="animate-pulse text-4xl">🍲</span>
      </div>

      <div className="text-center px-6">
        <p className="text-2xl font-extrabold tracking-tight text-foreground">ஸ்ரீ அம்மன்</p>
        <p className="mt-0.5 text-sm font-medium text-muted-foreground">சமையல் பாத்திரகடை</p>
      </div>

      {label && <p className="text-xs text-muted-foreground">{label}</p>}

      {/* Bouncing dots */}
      <div className="flex gap-1.5">
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-200ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary [animation-delay:-100ms]" />
        <span className="h-2 w-2 animate-bounce rounded-full bg-primary" />
      </div>
    </div>
  );
}

/** Compact inline loader for data loading inside a page section. */
export function DataLoader({ label }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-12">
      <div className="relative flex h-12 w-12 items-center justify-center">
        <span className="absolute inset-0 rounded-full border-4 border-primary/15" />
        <span className="absolute inset-0 animate-spin rounded-full border-4 border-transparent border-t-primary [animation-duration:900ms]" />
      </div>
      {label && <p className="text-sm text-muted-foreground">{label}</p>}
    </div>
  );
}
