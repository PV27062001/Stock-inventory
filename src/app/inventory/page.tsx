'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { InventoryItem } from '@/components/ui/inventory-item';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { ShoppingCart, Pill, Carrot, Coffee, Package, Search, LayoutGrid, Settings, WalletCards, LogOut } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { signOut } from '@/firebase/auth/auth-service';

export default function InventoryPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const [selectedModule, setSelectedModule] = useState<'ledger' | 'inventory' | 'settings'>('ledger');

  const categories = [
    { id: 'all', name: t('totalItems'), icon: Package },
    { id: 'groceries', name: t('groceries'), icon: ShoppingCart },
    { id: 'medicines', name: t('medicines'), icon: Pill },
    { id: 'veggies', name: t('vegetables'), icon: Carrot },
    { id: 'kitchen', name: t('kitchen'), icon: Coffee },
  ];

  const handleModuleSelect = (module: 'ledger' | 'inventory' | 'settings') => {
    setSelectedModule(module);
    if (module === 'ledger') router.push('/kirayabook');
    if (module === 'inventory') router.push('/inventory');
    if (module === 'settings') router.push('/settings');
  };

  const handleLogout = async () => {
    await signOut();
    router.push('/login');
  };

  return (
    <main className="min-h-screen bg-[#1A1A2E] p-4 text-white md:p-6">
      <section className="mx-auto max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 rounded-3xl border border-gray-700/60 bg-[#16213E] p-4 shadow-lg md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="h-12 rounded-2xl border border-gray-700 bg-[#1A1A2E] px-4 text-left text-white hover:bg-[#1F2840]">
                  <div className="flex items-center gap-2">
                    <LayoutGrid className="h-4 w-4" />
                    <span className="font-medium">{selectedModule === 'ledger' ? 'Ledger' : selectedModule === 'inventory' ? 'Inventory' : 'Settings'}</span>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-56 border-gray-700 bg-[#16213E] p-2 text-white">
                <DropdownMenuItem onSelect={() => handleModuleSelect('ledger')} className="min-h-11 cursor-pointer rounded-md text-base focus:bg-[#1A1A2E] focus:text-white">
                  <WalletCards className="mr-2 h-4 w-4" />
                  Ledger
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleModuleSelect('inventory')} className="min-h-11 cursor-pointer rounded-md text-base focus:bg-[#1A1A2E] focus:text-white">
                  <Package className="mr-2 h-4 w-4" />
                  Inventory
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => handleModuleSelect('settings')} className="min-h-11 cursor-pointer rounded-md text-base focus:bg-[#1A1A2E] focus:text-white">
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-gray-700" />
                <DropdownMenuItem onSelect={handleLogout} className="min-h-11 cursor-pointer rounded-md text-base text-red-300 focus:bg-red-500/15 focus:text-red-200">
                  <LogOut className="mr-2 h-4 w-4" />
                  Logout
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          <div>
            <p className="text-sm font-medium text-teal-300">{t('inventory')}</p>
            <h1 className="text-3xl font-bold tracking-tight">{t('inventoryDashboard')}</h1>
          </div>
          <Card className="rounded-3xl border border-gray-700/60 bg-[#1A1A2E] p-4 shadow-sm">
            <p className="text-xs uppercase tracking-[0.2em] text-gray-400">{t('home')}</p>
            <p className="mt-2 text-lg font-semibold">{t('inventory')}</p>
          </Card>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-6 w-6 text-gray-500" />
          <Input
            className="h-16 rounded-2xl border border-gray-700 bg-[#16213E] pl-12 text-lg text-white shadow-sm placeholder:text-gray-500"
            placeholder={t('search')}
          />
        </div>

        <Tabs defaultValue="all" className="w-full">
          <div className="-mx-6 overflow-x-auto px-6 pb-4 no-scrollbar">
            <TabsList className="inline-flex h-auto gap-3 bg-transparent">
              {categories.map((cat) => (
                <TabsTrigger
                  key={cat.id}
                  value={cat.id}
                  className="flex h-14 items-center gap-2 whitespace-nowrap rounded-2xl border border-gray-700 bg-[#16213E] px-6 text-lg font-medium text-gray-300 shadow-sm transition-all data-[state=active]:bg-teal-500 data-[state=active]:text-white"
                >
                  <cat.icon className="h-5 w-5" />
                  {cat.name}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          <TabsContent value="all" className="mt-6">
            <div className="space-y-4">
              <InventoryItem
                name="Milk"
                quantity={2}
                unit="Packets"
                category={t('groceries')}
                lowStockThreshold={1}
                lastUpdated={t('justNow')}
              />
              <InventoryItem
                name="Eggs"
                quantity={12}
                unit="pcs"
                category={t('groceries')}
                lowStockThreshold={6}
                lastUpdated={`1 ${t('daysAgo')}`}
              />
              <InventoryItem
                name="Bread"
                quantity={1}
                unit="Loaf"
                category={t('groceries')}
                lowStockThreshold={1}
                lastUpdated={t('justNow')}
              />
              <InventoryItem
                name="Tomato"
                quantity={3}
                unit="kg"
                category={t('vegetables')}
                lowStockThreshold={1}
                lastUpdated={`3 ${t('daysAgo')}`}
              />
            </div>
          </TabsContent>

          <TabsContent value="medicines" className="mt-6">
            <div className="space-y-4">
              <InventoryItem
                name="Paracetamol"
                quantity={1}
                unit="Box"
                category={t('medicines')}
                lowStockThreshold={2}
                lastUpdated={`5 ${t('daysAgo')}`}
              />
              <InventoryItem
                name="Vitamin C"
                quantity={10}
                unit="Tablets"
                category={t('medicines')}
                lowStockThreshold={5}
                lastUpdated={`10 ${t('daysAgo')}`}
              />
            </div>
          </TabsContent>

          <TabsContent value="veggies" className="mt-6">
            <div className="space-y-4">
              <InventoryItem
                name="Tomato"
                quantity={3}
                unit="kg"
                category={t('vegetables')}
                lowStockThreshold={1}
                lastUpdated={`3 ${t('daysAgo')}`}
              />
            </div>
          </TabsContent>

          <TabsContent value="kitchen" className="mt-6">
            <div className="space-y-4">
              <InventoryItem
                name="Coffee"
                quantity={4}
                unit="Bags"
                category={t('kitchen')}
                lowStockThreshold={2}
                lastUpdated={`2 ${t('daysAgo')}`}
              />
            </div>
          </TabsContent>
        </Tabs>
      </section>
    </main>
  );
}
