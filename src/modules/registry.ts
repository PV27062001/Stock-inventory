import { BookCheck, BookOpen, Users, Warehouse, Package2, type LucideIcon } from 'lucide-react';
import { RENTALS_ENABLED } from '@/lib/features';
import type { ModuleId } from './module-paths';

export type { ModuleId } from './module-paths';

export interface ModuleTab {
  href: string;
  label: string;
  icon: LucideIcon;
}

export interface ModuleDef {
  id: ModuleId;
  name: string;
  nameTa: string;
  description: string;
  icon: LucideIcon;
  /** CSS variable holding the app's colour (HSL parts) in `globals.css`. */
  colorVar: string;
  /** The app's first screen, opened from the launcher and as the start page. */
  homePath: string;
  /** Bottom-nav tabs; none means the app has no bottom nav. */
  tabs?: ModuleTab[];
}

/**
 * Every app in Sri Amman, in launcher order. The launcher, start page, Settings, bottom nav and
 * module colour all read this list. Adding an app = one entry here, its prefixes in
 * `module-paths.ts`, and a `--module-<id>` colour plus a `data-module` `--app-bar` rule in `globals.css`.
 */
export const MODULES: ModuleDef[] = [
  {
    id: 'personal',
    name: 'Personal',
    nameTa: 'வீட்டு பொருட்கள்',
    description: 'Groceries, medicines & gold rates',
    icon: Package2,
    colorVar: '--module-personal',
    homePath: '/inventory',
  },
  {
    id: 'ledger',
    name: 'Ledger',
    nameTa: 'கணக்கு புத்தகம்',
    description: 'Customers, items & rentals',
    icon: BookOpen,
    colorVar: '--module-ledger',
    homePath: '/kirayabook',
    tabs: [
      { href: '/kirayabook', icon: BookOpen, label: 'Ledger' },
      { href: '/kirayabook/customers', icon: Users, label: 'Customers' },
      ...(RENTALS_ENABLED ? [{ href: '/kirayabook/rentals', icon: BookCheck, label: 'Rentals' }] : []),
      { href: '/kirayabook/inventory', icon: Warehouse, label: 'Inventory' },
    ],
  },
];

export const getModule = (id: ModuleId | null | undefined) => MODULES.find((m) => m.id === id);
