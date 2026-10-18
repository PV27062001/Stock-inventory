
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ChevronRight, BookOpen, LayoutGrid, LogOut, Package2, Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { useLanguage } from '@/hooks/use-language';
import { useStartPage } from '@/hooks/use-start-page';
import { BrandLoader } from '@/components/app/brand-loader';
import { withAuth } from '@/components/Auth/with-auth';
import { signOut } from '@/firebase/auth/auth-service';
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

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  if (!loaded || startPage !== 'ask') {
    return <BrandLoader />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-primary">{t('welcome') || 'Welcome'}</p>
            <h1 className="text-2xl font-bold">Sri Amman</h1>
            <p className="mt-1 text-sm text-muted-foreground">{t('homeOverview') || 'One dashboard for inventory and rentals.'}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 text-foreground hover:bg-secondary" aria-label="Open quick menu">
                <LayoutGrid className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border-border bg-card p-2 text-foreground">
              <DropdownMenuItem asChild className="min-h-12 cursor-pointer rounded-md text-base focus:bg-secondary focus:text-foreground">
                <Link href="/settings">
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onSelect={handleLogout} className="min-h-12 cursor-pointer rounded-md text-base text-destructive focus:bg-destructive/15 focus:text-destructive">
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto flex max-w-md flex-col gap-5 px-4 py-6">
        <p className="text-lg text-muted-foreground">
          {user ? `${t('hello') || 'Hello'}, ${user.displayName?.split(' ')[0] || t('guest') || 'Guest'}` : t('guestGreeting')}
        </p>
        <p className="-mt-3 text-sm text-muted-foreground">
          Pick the screen you use most. You can change this later in Settings.
        </p>

        {/* Personal */}
        <button type="button" onClick={() => choose('inventory')} className="block w-full text-left">
          <Card className="rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#4C9AFF] to-[#1A73E8] text-white shadow-primary-glow">
                <Package2 className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Personal</h2>
                <p className="mt-1 text-base text-muted-foreground">Groceries, medicines & gold rates</p>
              </div>
              <ChevronRight className="h-7 w-7 text-muted-foreground" />
            </div>
          </Card>
        </button>

        {/* Ledger */}
        <button type="button" onClick={() => choose('kirayabook')} className="block w-full text-left">
          <Card className="rounded-3xl border border-border bg-card p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated active:scale-[0.99]">
            <div className="flex items-center gap-4">
              <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-[#34A853] to-[#1E8E3E] text-white shadow-soft">
                <BookOpen className="h-8 w-8" />
              </div>
              <div className="flex-1">
                <h2 className="text-2xl font-bold">Ledger</h2>
                <p className="mt-1 text-base text-muted-foreground">Rentals, customers & payments</p>
              </div>
              <ChevronRight className="h-7 w-7 text-muted-foreground" />
            </div>
          </Card>
        </button>
      </div>
    </main>
  );
}

export default withAuth(HomePage);
