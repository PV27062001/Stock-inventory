'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ArrowLeft, LogOut, Package, Settings, WalletCards } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/firebase/auth/auth-service';

interface AppHeaderProps {
  title: string;
  subtitle?: string;
  back?: boolean;
  backHref?: string;
  switchTo: 'inventory' | 'rental';
}

export function AppHeader({ title, subtitle, back = false, backHref, switchTo }: AppHeaderProps) {
  const router = useRouter();
  const switchHref = switchTo === 'inventory' ? '/inventory' : '/kirayabook';
  const switchLabel = switchTo === 'inventory' ? 'Switch to Inventory' : 'Switch to Rental';
  const SwitchIcon = switchTo === 'inventory' ? Package : WalletCards;

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <header className="sticky top-0 z-20 border-b border-border bg-card text-foreground">
      <div className="flex min-h-16 items-center gap-3 px-4 py-3">
        {back && (
          <Button variant="ghost" size="icon" onClick={() => (backHref ? router.push(backHref) : router.back())} className="h-12 w-12 text-foreground hover:bg-secondary">
            <ArrowLeft className="h-6 w-6" />
          </Button>
        )}
        <div className="min-w-0 flex-1">
          {subtitle && <p className="text-xs font-semibold uppercase tracking-wide text-primary">{subtitle}</p>}
          <h1 className="truncate text-xl font-bold">{title}</h1>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-12 w-12 text-foreground hover:bg-secondary" aria-label="Open settings">
              <Settings className="h-6 w-6" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 border-border bg-card p-2 text-foreground">
            <DropdownMenuItem asChild className="min-h-12 cursor-pointer rounded-md text-base focus:bg-secondary focus:text-foreground">
              <Link href={switchHref}>
                <SwitchIcon className="mr-2 h-5 w-5" />
                {switchLabel}
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
  );
}
