
'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, BookOpen, Package2 } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SettingsButton } from '@/components/ui/page-header';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { useLanguage } from '@/hooks/use-language';
import { useStartPage } from '@/hooks/use-start-page';
import { BrandLoader } from '@/components/app/brand-loader';
import { withAuth } from '@/components/Auth/with-auth';
import { useEffect } from 'react';

function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuthUser();
  const router = useRouter();
  const { startPage, setStartPage, loaded } = useStartPage();

  // Once a module is chosen, go straight there instead of asking again.
  useEffect(() => {
    if (loaded && startPage !== 'ask') {
      router.replace(startPage === 'inventory' ? '/inventory' : '/kirayabook');
    }
  }, [loaded, startPage, router]);

  const choose = (value: 'inventory' | 'kirayabook') => {
    setStartPage(value);
    router.push(value === 'inventory' ? '/inventory' : '/kirayabook');
  };


  if (!loaded || startPage !== 'ask') {
    return <BrandLoader />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{t('welcome') || 'Welcome'}</p>
            <h1 className="text-xl font-bold">Sri Amman</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('homeOverview') || 'One dashboard for inventory and rentals.'}</p>
          </div>
          <SettingsButton />
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
        <p className="text-base text-muted-foreground">
          {user ? `${t('hello') || 'Hello'}, ${user.displayName?.split(' ')[0] || t('guest') || 'Guest'}` : t('guestGreeting')}
        </p>
        <p className="-mt-3 text-sm text-muted-foreground">
          Pick the screen you use most. You can change this later in Settings.
        </p>

        {/* Personal */}
        <button type="button" onClick={() => choose('inventory')} className="block w-full text-left">
          <Card className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4C9AFF] to-[#1A73E8] text-white shadow-primary-glow">
                <Package2 className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Personal</h2>
                <p className="mt-1 text-base text-muted-foreground">Groceries, medicines & gold rates</p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </Card>
        </button>

        {/* Ledger */}
        <button type="button" onClick={() => choose('kirayabook')} className="block w-full text-left">
          <Card className="rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#34A853] to-[#1E8E3E] text-white shadow-soft">
                <BookOpen className="h-6 w-6" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold">Ledger</h2>
                <p className="mt-1 text-base text-muted-foreground">Rentals, customers & payments</p>
              </div>
              <ChevronRight className="h-6 w-6 text-muted-foreground" />
            </div>
          </Card>
        </button>
      </div>
    </main>
  );
}

export default withAuth(HomePage);
