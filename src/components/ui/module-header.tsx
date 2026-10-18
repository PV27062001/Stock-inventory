'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Warehouse, BookOpen } from 'lucide-react';

/**
 * Gradient section header with built-in Personal/Ledger toggle.
 * Colour changes per module (blue = Personal, green = Ledger) so each
 * section has a distinct, recognisable identity.
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

  const gradient = onLedger ? 'from-[#1E8E3E] to-[#34A853]' : 'from-[#1A73E8] to-[#4C9AFF]';
  const activeText = onLedger ? 'text-[#1E8E3E]' : 'text-[#1A73E8]';

  return (
    <div
      className={`bg-gradient-to-br ${gradient} px-4 pb-4 pt-6 text-white shadow-elevated`}
    >
      <div className="mx-auto flex max-w-md items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold leading-tight">{title}</h1>
          {subtitle && <p className="mt-0.5 text-sm text-white/80">{subtitle}</p>}
        </div>
        {right}
      </div>

      {/* Module switch — sits on the gradient */}
      <div className="mx-auto mt-4 flex max-w-md gap-1.5 rounded-2xl bg-white/15 p-1.5 backdrop-blur-sm">
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
  );
}
