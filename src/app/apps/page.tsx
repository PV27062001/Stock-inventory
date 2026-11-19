'use client';

import Link from 'next/link';
import { ChevronRight, Star } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { withAuth } from '@/components/Auth/with-auth';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { useLanguage } from '@/hooks/use-language';
import { useStartPage } from '@/hooks/use-start-page';
import { MODULES, getModule } from '@/modules/registry';

/**
 * The Apps launcher (SPEC §5 Navigation, level 1): every app in the registry as a big icon tile,
 * Play Store style. Each app's main screens have an "Apps" button that comes back here.
 */
function AppsPage() {
  const { t } = useLanguage();
  const { user } = useAuthUser();
  const { startPage, loaded } = useStartPage();

  const firstName = user?.displayName?.split(' ')[0];
  const greeting = `${t('hello') || 'Hello'}${firstName ? `, ${firstName}` : ''}`;
  const startName = startPage === 'apps' ? 'Apps' : getModule(startPage)?.name ?? 'Apps';

  return (
    <main className="min-h-screen bg-background text-foreground">
      <PageHeader nav="none" settings title="Sri Amman" subtitle={greeting} />

      <div className="mx-auto max-w-md px-4 py-5">
        <h2 className="mb-3 text-base font-bold text-muted-foreground">Apps</h2>

        <ul className="grid grid-cols-3 gap-3">
          {MODULES.map((m) => {
            const isStart = loaded && startPage === m.id;
            return (
              <li key={m.id}>
                <Link
                  href={m.homePath}
                  aria-label={`${m.name}: ${m.description}`}
                  className="relative flex min-h-[8.5rem] flex-col items-center gap-2 rounded-2xl border border-border bg-card px-1 pb-3 pt-4 text-center shadow-soft transition-all active:scale-95"
                >
                  {isStart && (
                    <span className="absolute right-1.5 top-1.5 flex h-6 w-6 items-center justify-center rounded-full bg-brand-amber text-white" title="Opens first">
                      <Star className="h-3.5 w-3.5 fill-current" aria-hidden />
                      <span className="sr-only">Opens first</span>
                    </span>
                  )}
                  <span
                    className="flex h-16 w-16 items-center justify-center rounded-[1.25rem] text-white shadow-soft"
                    style={{ backgroundColor: `hsl(var(${m.colorVar}))` }}
                  >
                    <m.icon className="h-8 w-8" aria-hidden />
                  </span>
                  {/* Names wrap rather than cut off: the Tamil name must always be readable in full. */}
                  <span className="w-full break-words px-1 text-base font-bold leading-tight">{m.name}</span>
                  <span className="-mt-1 w-full break-words px-1 text-[13px] font-medium leading-snug text-muted-foreground">{m.nameTa}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        <Link
          href="/settings#start-screen"
          className="mt-6 flex min-h-12 items-center gap-3 rounded-2xl border border-border bg-card px-4 py-2 shadow-soft transition-all active:scale-[0.99]"
        >
          <Star className="h-5 w-5 shrink-0 text-brand-amber" aria-hidden />
          <span className="min-w-0 flex-1 truncate text-base">
            Opens first: <b>{loaded ? startName : '…'}</b>
          </span>
          <span className="flex shrink-0 items-center text-base font-semibold text-primary">
            Change
            <ChevronRight className="h-5 w-5" aria-hidden />
          </span>
        </Link>
      </div>
    </main>
  );
}

export default withAuth(AppsPage);
