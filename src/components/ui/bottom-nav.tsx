
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { BookOpen, Warehouse, Users, BookCheck } from 'lucide-react';

export function BottomNav() {
  const pathname = usePathname();

  // Only show bottom nav for kirayabook pages
  if (!pathname || !pathname.startsWith('/kirayabook')) {
    return null;
  }

  const navItems = [
    { href: '/kirayabook', icon: BookOpen, label: 'Ledger' },
    { href: '/kirayabook/customers', icon: Users, label: 'Customers' },
    { href: '/kirayabook/rentals', icon: BookCheck, label: 'Rentals' },
    { href: '/kirayabook/inventory', icon: Warehouse, label: 'Inventory' },
  ];

  return (
    <nav className="fixed bottom-0 left-1/2 w-full max-w-md -translate-x-1/2 bg-[#16213E] border-t border-t-gray-700/50 shadow-[0_-2px_10px_rgba(0,0,0,0.05)]">
      <div className="flex justify-around items-center h-20">
        {navItems.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link key={item.href} href={item.href} className="flex flex-col items-center gap-1 text-gray-400 hover:text-white">
              <item.icon className={`w-7 h-7 ${isActive ? 'text-[#1D9E75]' : ''}`} />
              <span className={`text-xs font-medium ${isActive ? 'text-white' : ''}`}>
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
