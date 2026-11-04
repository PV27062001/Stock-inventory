
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Warehouse, Users, BookCheck } from 'lucide-react';
import { RENTALS_ENABLED } from '@/lib/features';

export function BottomNav() {
  const pathname = usePathname();

  // Only show bottom nav for kirayabook pages
  if (!pathname || !pathname.startsWith('/kirayabook')) {
    return null;
  }

  const navItems = [
    { href: '/kirayabook', icon: BookOpen, label: 'Ledger' },
    { href: '/kirayabook/customers', icon: Users, label: 'Customers' },
    ...(RENTALS_ENABLED ? [{ href: '/kirayabook/rentals', icon: BookCheck, label: 'Rentals' }] : []),
    { href: '/kirayabook/inventory', icon: Warehouse, label: 'Inventory' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 z-40 w-full max-w-md -translate-x-1/2 bg-card border-t border-t-border shadow-[0_-2px_10px_rgba(0,0,0,0.2)] pb-[env(safe-area-inset-bottom)]">
      {/* Material-style bar (as in Amazon / GPay Business): 64px tall, 24px icons, each item an
          equal-width tap target with side gutters so nothing touches the screen edge. */}
      <div className="flex items-stretch h-16 px-3">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-1 flex-col items-center justify-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
              {/* Material 3 active indicator, as in GPay / Google apps. */}
              <span className={`flex h-8 w-16 items-center justify-center rounded-full transition-colors ${isActive ? 'bg-primary/15' : ''}`}>
                <item.icon className={`w-6 h-6 ${isActive ? 'text-primary' : ''}`} />
              </span>
              <span className={`text-xs font-medium ${isActive ? 'text-foreground' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
