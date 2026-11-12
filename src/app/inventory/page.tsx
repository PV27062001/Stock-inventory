'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryItem } from '@/components/ui/inventory-item';
import { ShoppingCart, Pill, Carrot, Coffee, Package, Search, WalletCards, Coins, Zap, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { useInventory } from '@/firebase/firestore/use-inventory';
import { ModuleHeader } from '@/components/ui/module-header';
import { GoldSilverRates } from '@/components/app/gold-silver-rates';
import { ShutdownInfo } from '@/components/app/shutdown-info';
import { DataLoader } from '@/components/app/brand-loader';
import type { InventoryItem as InventoryItemType } from '@/types';

export default function InventoryPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const { items, loading, updateItem, deleteItem } = useInventory();
  const [search, setSearch] = useState('');
  const [section, setSection] = useState<'rates' | 'shutdown' | 'inventory'>('rates');

  // Open the Inventory section directly when linked with #inventory (e.g. after adding an item).
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash === '#inventory') {
      setSection('inventory');
    }
  }, []);

  const sections = [
    { id: 'rates' as const, label: 'Gold & Silver', icon: Coins },
    { id: 'shutdown' as const, label: 'Shutdown', icon: Zap },
    { id: 'inventory' as const, label: 'Inventory', icon: Package },
  ];

  const categories = [
    { id: 'all', name: t('totalItems'), icon: Package },
    { id: 'groceries', name: t('groceries'), icon: ShoppingCart },
    { id: 'medicines', name: t('medicines'), icon: Pill },
    { id: 'veggies', name: t('vegetables'), icon: Carrot },
    { id: 'kitchen', name: t('kitchen'), icon: Coffee },
  ];

  const formatUpdated = (ts: InventoryItemType['purchaseDate']) => {
    const d = ts && typeof (ts as { toDate?: () => Date }).toDate === 'function'
      ? (ts as { toDate: () => Date }).toDate()
      : null;
    return d ? d.toLocaleDateString() : '';
  };

  const matchesCategory = (item: InventoryItemType, tab: string) => {
    const c = (item.category || '').toLowerCase();
    switch (tab) {
      case 'all': return true;
      case 'groceries': return c.startsWith('grocer');
      case 'medicines': return c.startsWith('medicin');
      case 'veggies': return c.startsWith('veg');
      case 'kitchen': return c.startsWith('kitchen');
      default: return true;
    }
  };

  const visibleItems = (tab: string) =>
    items.filter(
      (i) =>
        matchesCategory(i, tab) &&
        (!search || i.name.toLowerCase().includes(search.toLowerCase())),
    );


  const handleQtyChange = (id: string, qty: number) => {
    updateItem(id, { quantity: qty }).catch(() => {});
  };
  const handleDeleteItem = (id: string) => {
    if (window.confirm('Delete this item?')) deleteItem(id).catch(() => {});
  };
  const handleEditItem = (id: string) => {
    router.push(`/add-item?id=${id}`);
  };

  return (
    <main className="min-h-screen bg-background text-foreground">
      <ModuleHeader title="Personal" subtitle="Your dashboard" />

      <section className="mx-auto max-w-6xl space-y-6 p-4">
        {/* Section selector */}
        <div className="grid grid-cols-3 gap-2 rounded-2xl border border-border bg-background p-1.5">
          {sections.map((s) => (
            <button
              key={s.id}
              onClick={() => setSection(s.id)}
              className={`flex flex-col items-center justify-center gap-1 rounded-xl py-3 text-sm font-semibold transition-colors ${
                section === s.id ? 'bg-primary text-primary-foreground shadow' : 'text-muted-foreground'
              }`}
            >
              <s.icon className="h-5 w-5" />
              {s.label}
            </button>
          ))}
        </div>

        {section === 'rates' && <GoldSilverRates />}
        {section === 'shutdown' && <ShutdownInfo />}

        {section === 'inventory' && (
          <>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                className="h-12 rounded-xl border border-border bg-card pl-12 text-base text-foreground shadow-sm placeholder:text-muted-foreground"
                placeholder={t('search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <Tabs defaultValue="all" className="w-full">
              <div className="-mx-4 overflow-x-auto px-4 pb-1 no-scrollbar">
                <TabsList className="inline-flex h-auto gap-2 bg-transparent p-0">
                  {categories.map((cat) => (
                    <TabsTrigger
                      key={cat.id}
                      value={cat.id}
                      className="flex h-10 items-center gap-1.5 whitespace-nowrap rounded-full border border-border bg-card px-4 text-sm font-medium text-muted-foreground shadow-sm transition-all data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                    >
                      <cat.icon className="h-4 w-4" />
                      {cat.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>

              {categories.map((cat) => {
                const list = visibleItems(cat.id);
                return (
                  <TabsContent key={cat.id} value={cat.id} className="mt-4">
                    {loading ? (
                      <p className="py-16 text-center text-muted-foreground">{t('loading')}</p>
                    ) : list.length === 0 ? (
                      <div className="py-16 text-center">
                        <p className="text-base text-muted-foreground">{t('noItems')}</p>
                        <Link href="/add-item" className="mt-2 inline-block text-primary">+ {t('addItem')}</Link>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {list.map((item) => (
                          <InventoryItem
                            key={item.id}
                            id={item.id}
                            name={item.name}
                            quantity={item.quantity}
                            unit={item.unit || 'units'}
                            category={item.category}
                            lowStockThreshold={item.lowStockThreshold ?? 0}
                            lastUpdated={formatUpdated(item.purchaseDate)}
                            dosage={item.dosage}
                            onQuantityChange={handleQtyChange}
                            onEdit={handleEditItem}
                            onDelete={handleDeleteItem}
                          />
                        ))}
                      </div>
                    )}
                  </TabsContent>
                );
              })}
            </Tabs>
          </>
        )}
      </section>

      {section === 'inventory' && (
        <div className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-4">
          <div className="flex justify-end">
            <Link
              href="/add-item"
              aria-label={t('addItem')}
              className="pointer-events-auto flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated transition-transform active:scale-95"
            >
              <Plus className="h-6 w-6" />
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
