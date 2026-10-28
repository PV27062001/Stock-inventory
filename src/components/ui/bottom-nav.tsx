
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
    <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-card border-t border-t-border shadow-[0_-2px_10px_rgba(0,0,0,0.2)]">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground">
              <item.icon className={`w-7 h-7 ${isActive ? 'text-primary' : ''}`} />
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
