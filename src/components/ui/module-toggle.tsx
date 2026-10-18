'use client';

import { useRouter, usePathname } from 'next/navigation';
import { Warehouse, BookOpen } from 'lucide-react';

/**
 * Large, high-contrast toggle to switch between the two main modules.
 * Designed for easy tapping by older users.
 */
export function ModuleToggle() {
  const router = useRouter();
  const pathname = usePathname();
  const onLedger = pathname?.startsWith('/kirayabook');

  const base =
    'flex flex-1 items-center justify-center gap-2 rounded-xl h-12 text-base font-semibold transition-all duration-200';
  const active = 'bg-gradient-to-b from-[#3B82F6] to-[#1A73E8] text-primary-foreground shadow-primary-glow';
  const inactive = 'text-muted-foreground hover:text-foreground';

  return (
    <div className="flex gap-1.5 rounded-2xl border border-border bg-background p-1.5">
      <button
        type="button"
        aria-pressed={!onLedger}
        onClick={() => router.push('/inventory')}
        className={`${base} ${!onLedger ? active : inactive}`}
      >
        <Warehouse className="h-5 w-5" />
        Personal
      </button>
      <button
        type="button"
        aria-pressed={onLedger}
        onClick={() => router.push('/kirayabook')}
        className={`${base} ${onLedger ? active : inactive}`}
      >
        <BookOpen className="h-5 w-5" />
        Ledger
      </button>
    </div>
  );
}
