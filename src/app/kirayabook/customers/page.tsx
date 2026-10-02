'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, Phone, Search, Sparkles, UserPlus, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Customer, getAllCustomers } from '@/firebase/kirayabook/firestore-service';

const getInitials = (name: string) => {
  const names = name.trim().split(' ');
  return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0]?.[0] || '';
};

export default function CustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    getAllCustomers()
      .then((custs) => {
        if (isMounted) {
          setCustomers(custs);
        }
      })
      .catch((e) => {
        console.error('Failed to fetch customers:', e);
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const normalizedSearch = searchTerm.trim().toLowerCase();

  const displayedCustomers = useMemo(() => {
    if (!normalizedSearch) {
      return customers;
    }

    return customers.filter((customer) =>
      customer.name.toLowerCase().includes(normalizedSearch) ||
      customer.mobile.includes(normalizedSearch)
    );
  }, [customers, normalizedSearch]);

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      <header className="bg-[#16213E] sticky top-0 z-10 border-b border-gray-700/50 flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-teal-400">KirayaBook</p>
          <h1 className="text-2xl font-bold">Customers</h1>
        </div>
        <Link href="/kirayabook/add-customer">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-full">
            <Plus className="w-4 h-4 mr-1" /> Add new
          </Button>
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pb-24">
        <section className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-[#16213E] border border-teal-500/30 rounded-lg p-4">
            <div className="flex items-center gap-2 text-teal-300">
              <Users className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Total</span>
            </div>
            <p className="mt-2 text-3xl font-bold">{customers.length}</p>
          </div>
          <Link href="/kirayabook/add-customer" className="bg-[#16213E] border border-sky-500/30 rounded-lg p-4 hover:border-sky-400/60 transition-colors">
            <div className="flex items-center gap-2 text-sky-300">
              <UserPlus className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wide">Fast add</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-white">New customer</p>
          </Link>
        </section>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
          <Input
            placeholder="Search by name or mobile"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 rounded-lg border border-gray-700 bg-[#16213E] text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-[#16213E] border border-gray-700/50 rounded-lg p-4 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gray-700/70" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 rounded bg-gray-700/70" />
                    <div className="h-3 w-24 rounded bg-gray-700/50" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedCustomers.length === 0 ? (
          <div className="bg-[#16213E] border border-gray-700/50 rounded-lg p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-teal-500/15 text-teal-300">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-white">
              {searchTerm ? 'No matching customers' : 'Build your customer book'}
            </h2>
            <p className="mt-2 text-sm text-gray-400">
              {searchTerm ? 'Try a different name or mobile number.' : 'Add customers once and searches will stay instant on this screen.'}
            </p>
            {!searchTerm && (
              <Link href="/kirayabook/add-customer" className="mt-5 inline-flex">
                <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-full">
                  <Plus className="w-4 h-4 mr-1" /> Add customer
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedCustomers.map((customer) => (
              <Link key={customer.id} href={`/kirayabook/customer/${customer.id}`}>
                <div className="bg-[#16213E] border border-gray-700/50 rounded-lg p-4 flex items-center hover:border-teal-500/40 transition-colors">
                  <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-white font-bold mr-3">
                    {getInitials(customer.name)}
                  </div>
                  <div className="flex-1">
                    <h2 className="font-semibold text-white">{customer.name}</h2>
                    <p className="flex items-center gap-1.5 text-sm text-gray-400">
                      <Phone className="h-3.5 w-3.5 text-teal-400" />
                      {customer.mobile}
                    </p>
                  </div>
                  <span className="text-xs font-semibold px-3 py-1 rounded-full bg-teal-500/15 text-teal-300">Saved</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
