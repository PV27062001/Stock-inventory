'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Warehouse, BookOpen } from 'lucide-react';

/**
 * Section header with built-in Personal/Ledger toggle. Colour changes per module (blue = Personal,
 * green = Ledger) so each section has a recognisable identity. The colour is solid so it joins the
 * status bar with no seam, and the toggle stays pinned to the bar while the title scrolls away.
 */
export function ModuleHeader({
  title,
  subtitle,
  right,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const onLedger = pathname?.startsWith('/kirayabook');

  const background = 'bg-[hsl(var(--app-bar))]';
  const activeText = 'text-[hsl(var(--app-bar))]';

  return (
    <>
      <div className={`${background} px-4 pb-1 pt-[max(1rem,env(safe-area-inset-top))] text-white`}>
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <div>
            <h1 className="text-xl font-bold leading-tight">{title}</h1>
            {subtitle && <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>}
          </div>
          {right}
        </div>
      </div>

      {/* Module switch — stays pinned under the status bar */}
      <div className={`${background} sticky top-[env(safe-area-inset-top)] z-20 px-4 pb-3 pt-2 shadow-elevated`}>
        <div className="mx-auto flex max-w-md gap-1.5 rounded-2xl bg-white/15 p-1.5">
          <button
            type="button"
            aria-pressed={onLedger}
            onClick={() => router.push('/kirayabook')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl h-11 text-base font-semibold transition-all ${
              onLedger ? `bg-white ${activeText} shadow` : 'text-white/90'
            }`}
          >
            <BookOpen className="h-5 w-5" />
            Ledger
          </button>
          <button
            type="button"
            aria-pressed={!onLedger}
            onClick={() => router.push('/inventory')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-xl h-11 text-base font-semibold transition-all ${
              !onLedger ? `bg-white ${activeText} shadow` : 'text-white/90'
            }`}
          >
            <Warehouse className="h-5 w-5" />
            Personal
          </button>
      </div>
      </div>
    </>
  );
}
