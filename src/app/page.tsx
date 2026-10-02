
'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { ArrowRight, Archive, BookOpen, LayoutGrid, LogOut, Package2, Settings, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { useLanguage } from '@/hooks/use-language';
import { withAuth } from '@/components/Auth/with-auth';
import { signOut } from '@/firebase/auth/auth-service';

function HomePage() {
  const { t } = useLanguage();
  const { user } = useAuthUser();
  const router = useRouter();
  const [activeModule, setActiveModule] = useState<'inventory' | 'ledger'>('inventory');

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-[#1A1A2E] text-white">
      <header className="border-b border-gray-700/50 bg-[#16213E] px-4 py-4">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-teal-300">{t('welcome') || 'Welcome'}</p>
            <h1 className="text-2xl font-bold">SimpleStock</h1>
            <p className="mt-1 text-sm text-gray-400">{t('homeOverview') || 'One dashboard for inventory and rentals.'}</p>
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-12 w-12 text-white hover:bg-white/10" aria-label="Open quick menu">
                <LayoutGrid className="h-6 w-6" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 border-gray-700 bg-[#16213E] p-2 text-white">
              <DropdownMenuItem asChild className="min-h-12 cursor-pointer rounded-md text-base focus:bg-[#1A1A2E] focus:text-white">
                <Link href="/settings">
                  <Settings className="mr-2 h-5 w-5" />
                  Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="min-h-12 cursor-pointer rounded-md text-base focus:bg-[#1A1A2E] focus:text-white">
                <Link href="/inventory">
                  <Package2 className="mr-2 h-5 w-5" />
                  Inventory
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild className="min-h-12 cursor-pointer rounded-md text-base focus:bg-[#1A1A2E] focus:text-white">
                <Link href="/kirayabook">
                  <WalletCards className="mr-2 h-5 w-5" />
                  Ledger
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-gray-700" />
              <DropdownMenuItem onSelect={handleLogout} className="min-h-12 cursor-pointer rounded-md text-base text-red-300 focus:bg-red-500/15 focus:text-red-200">
                <LogOut className="mr-2 h-5 w-5" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      <div className="mx-auto flex max-w-5xl flex-col gap-6 px-4 py-6">
        <div className="rounded-3xl border border-gray-700/60 bg-[#16213E] p-4 shadow-lg">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm text-gray-400">{user ? `${t('hello') || 'Hello'}, ${user.displayName?.split(' ')[0] || t('guest') || 'Guest'}` : t('guestGreeting')}</p>
              <h2 className="mt-1 text-xl font-semibold">Switch between your core workspaces</h2>
            </div>
            <div className="inline-flex rounded-full border border-gray-700 bg-[#1A1A2E] p-1">
              <button
                type="button"
                onClick={() => setActiveModule('inventory')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeModule === 'inventory' ? 'bg-teal-500 text-white' : 'text-gray-300'}`}
              >
                Inventory
              </button>
              <button
                type="button"
                onClick={() => setActiveModule('ledger')}
                className={`rounded-full px-4 py-2 text-sm font-medium transition ${activeModule === 'ledger' ? 'bg-teal-500 text-white' : 'text-gray-300'}`}
              >
                Ledger
              </button>
            </div>
          </div>
        </div>

        <section className="grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="rounded-3xl border border-gray-700/60 bg-[#16213E] p-6 shadow-lg">
            <div className="flex items-start gap-4">
              <div className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl ${activeModule === 'inventory' ? 'bg-teal-500/15 text-teal-300' : 'bg-blue-500/15 text-blue-300'}`}>
                {activeModule === 'inventory' ? <Archive className="h-6 w-6" /> : <BookOpen className="h-6 w-6" />}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium uppercase tracking-[0.2em] text-gray-400">
                  {activeModule === 'inventory' ? (t('inventory') || 'Inventory') : (t('ledger') || 'Ledger')}
                </p>
                <h3 className="mt-1 text-2xl font-semibold">
                  {activeModule === 'inventory' ? 'Track stock and essentials' : 'Manage rentals and customers'}
                </h3>
                <p className="mt-2 text-sm text-gray-400">
                  {activeModule === 'inventory'
                    ? 'Keep your items, stock levels, and alerts in one place.'
                    : 'View customer activity, rental status, and pending balances from one workspace.'}
                </p>
              </div>
            </div>

            <div className="mt-6 grid gap-3 sm:grid-cols-2">
              <Link href={activeModule === 'inventory' ? '/inventory' : '/kirayabook'} className="group">
                <div className="rounded-2xl border border-gray-700 bg-[#1A1A2E] p-4 transition hover:border-teal-500/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">Open {activeModule === 'inventory' ? 'Inventory' : 'Ledger'}</span>
                    <ArrowRight className="h-4 w-4 text-teal-300 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
              <Link href={activeModule === 'inventory' ? '/add-item' : '/kirayabook/new-rental'} className="group">
                <div className="rounded-2xl border border-gray-700 bg-[#1A1A2E] p-4 transition hover:border-teal-500/50">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{activeModule === 'inventory' ? 'Add Item' : 'Create Rental'}</span>
                    <ArrowRight className="h-4 w-4 text-teal-300 transition group-hover:translate-x-1" />
                  </div>
                </div>
              </Link>
            </div>
          </Card>

          <div className="space-y-4">
            <Card className="rounded-3xl border border-gray-700/60 bg-[#16213E] p-5 shadow-lg">
              <p className="text-sm text-gray-400">Quick access</p>
              <div className="mt-3 space-y-2">
                <Link href="/settings" className="flex items-center justify-between rounded-2xl border border-gray-700 bg-[#1A1A2E] px-4 py-3 text-sm text-gray-200">
                  <span>Settings & preferences</span>
                  <Settings className="h-4 w-4" />
                </Link>
                <Link href="/inventory" className="flex items-center justify-between rounded-2xl border border-gray-700 bg-[#1A1A2E] px-4 py-3 text-sm text-gray-200">
                  <span>Inventory workspace</span>
                  <Archive className="h-4 w-4" />
                </Link>
                <Link href="/kirayabook" className="flex items-center justify-between rounded-2xl border border-gray-700 bg-[#1A1A2E] px-4 py-3 text-sm text-gray-200">
                  <span>Ledger workspace</span>
                  <BookOpen className="h-4 w-4" />
                </Link>
              </div>
            </Card>

            <Card className="rounded-3xl border border-gray-700/60 bg-[#16213E] p-5 shadow-lg">
              <p className="text-sm text-gray-400">Common controls</p>
              <p className="mt-2 text-sm text-gray-300">Use the menu in the top-right for settings, module switching, and logout from one place.</p>
            </Card>
          </div>
        </section>
      </div>
    </main>
  );
}

export default withAuth(HomePage);
