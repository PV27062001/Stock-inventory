'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAllCustomers, getRecentRentals, getRentalsByDate, getLedgerTotals, Customer, Rental } from '@/firebase/kirayabook/firestore-service';
import { Input } from '@/components/ui/input';
import { Search, Settings, LogOut, LayoutGrid, Plus, CalendarIcon, X } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { ModuleHeader } from '@/components/ui/module-header';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { signOut } from '@/firebase/auth/auth-service';

const getStatusBadgeColor = (status: string) => {
  switch (status) {
    case 'Completed':
      return 'bg-green-600 text-white';
    case 'Active':
      return 'bg-yellow-600 text-white';
    case 'Overdue':
      return 'bg-red-600 text-white';
    default:
      return 'bg-gray-600 text-white';
  }
};

export default function LedgerHomePage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [totals, setTotals] = useState({ moneyReceived: 0, pendingAmount: 0, refundOwed: 0 });
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    getAllCustomers().then(setCustomers).catch((e) => logger.error('Failed to fetch customers:', e));
    getLedgerTotals().then(setTotals).catch((e) => logger.error('Failed to fetch totals:', e));
  }, []);

  // Entries list: latest 30, or only the chosen day. Never the whole collection.
  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    (selectedDate ? getRentalsByDate(selectedDate) : getRecentRentals(30))
      .then((rents) => { if (!cancelled) setRentals(rents); })
      .catch((e) => logger.error('Failed to fetch entries:', e))
      .finally(() => { if (!cancelled) setIsLoading(false); });
    return () => { cancelled = true; };
  }, [selectedDate]);

  // Handle search with 4+ character threshold
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchTerm.length >= 4) {
      setIsSearching(true);
      searchTimeout.current = setTimeout(() => {
        const q = searchTerm.toLowerCase();
        const digits = searchTerm.replace(/\D/g, '');
        const results = customers.filter(customer =>
          customer.name.toLowerCase().includes(q) ||
          (digits.length >= 3 && (customer.mobile || '').replace(/\D/g, '').includes(digits)) ||
          (customer.profession || '').toLowerCase().includes(q)
        ).slice(0, 20);
        setSearchResults(results);
        setIsSearching(false);
      }, 300);
    } else {
      setSearchResults([]);
      setIsSearching(false);
    }

    return () => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current);
      }
    };
  }, [searchTerm, customers]);

  const { moneyReceived, pendingAmount, refundOwed } = totals;

  // Create customer ID to name map
  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  // Entries are already ordered newest-first and bounded by the query.
  const recentTransactions = rentals
    .map(r => {
      const closed = r.status === 'Settled' || r.status === 'Completed';
      const refund = r.refundDue || 0;
      const name = customerMap.get(r.customerId) || r.customerId;
      // A refund is money going back out, so it reads as an outflow.
      const label = refund > 0 ? 'To return' : closed ? 'Completed' : 'Pending';
      return {
        id: r.id,
        customerId: r.customerId,
        customerName: name,
        description: `${name} — ${label}`,
        amount: refund > 0 ? refund : closed ? (r.advanceAmount || 0) : (r.balanceDue || 0),
        type: refund > 0 ? 'refund' : closed ? 'received' : 'pending',
        status: r.status,
      };
    });

  return (
    <div className="min-h-screen bg-background text-foreground">
      <ModuleHeader
        title="Ledger"
        subtitle="Rental book"
        right={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-11 w-11 rounded-xl bg-white/15 text-white hover:bg-white/25" aria-label="Menu">
                <LayoutGrid className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 border-border bg-card p-2 text-foreground">
              <DropdownMenuItem onSelect={() => router.push('/settings')} className="min-h-11 cursor-pointer rounded-md text-base focus:bg-secondary focus:text-foreground">
                <Settings className="mr-2 h-4 w-4" />
                Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-border" />
              <DropdownMenuItem onSelect={async () => { await signOut(); router.push('/login'); }} className="min-h-11 cursor-pointer rounded-md text-base text-destructive focus:bg-destructive/15 focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" />
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        }
      />

      <main className="max-w-md mx-auto pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-transparent p-4 shadow-soft">
            <p className="text-xs font-semibold text-primary uppercase tracking-wide">Money Received</p>
            <p className="text-2xl font-bold text-primary mt-2">₹{moneyReceived.toFixed(0)}</p>
          </div>
          <Link href="/kirayabook/unsettled" className="rounded-2xl border border-destructive/20 bg-gradient-to-br from-destructive/10 to-transparent p-4 shadow-soft hover:shadow-elevated transition-shadow block active:scale-[0.98]">
            <p className="text-xs font-semibold text-destructive uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-destructive mt-2">₹{pendingAmount.toFixed(0)}</p>
          </Link>
        </div>

        {refundOwed > 0 && (
          <div className="px-4 pb-2">
            <div className="rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-4 shadow-soft flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-brand-amber uppercase tracking-wide">To Return</p>
                <p className="text-xs text-muted-foreground mt-0.5">Owed back to customers</p>
              </div>
              <p className="text-2xl font-bold text-brand-amber">₹{refundOwed.toFixed(0)}</p>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name, mobile or profession"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {searchTerm.length > 0 && searchTerm.length < 4 && (
              <p className="text-xs text-muted-foreground mt-1">Enter at least 4 characters to search</p>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchTerm.length >= 4 && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-16 bg-card border border-border rounded-lg shadow-lg z-20 overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {searchResults.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/kirayabook/customer/${customer.id}`}
                    className="block px-4 py-3 hover:bg-secondary border-b border-border last:border-b-0"
                  >
                    <p className="font-medium text-foreground">{customer.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {customer.mobile}
                      {customer.profession ? ` · ${customer.profession}` : ''}
                    </p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {searchTerm.length >= 4 && searchResults.length === 0 && !isSearching && (
            <p className="text-sm text-muted-foreground mt-2">No customers found</p>
          )}
        </div>

        {/* Recent Entries */}
        <div className="px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold">
              {selectedDate ? `Entries on ${format(selectedDate, 'dd MMM yyyy')}` : 'Recent entries'}
            </h2>
            <div className="flex items-center gap-1">
              {selectedDate && (
                <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => setSelectedDate(undefined)} aria-label="Clear date">
                  <X className="h-4 w-4" />
                </Button>
              )}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9" aria-label="Pick date">
                    <CalendarIcon className="h-4 w-4" />
                  </Button>
                </PopoverTrigger>
                <PopoverContent align="end" className="w-auto p-0 bg-card border-border text-foreground">
                  <Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} disabled={{ after: new Date() }} initialFocus />
                </PopoverContent>
              </Popover>
            </div>
          </div>
          <div className="space-y-3">
            {isLoading ? (
              <p className="text-sm text-muted-foreground">Loading…</p>
            ) : recentTransactions.length === 0 ? (
              <p className="text-sm text-muted-foreground">{selectedDate ? 'No entries on this date.' : 'No entries yet.'}</p>
            ) : (
              recentTransactions.map((txn, idx) => (
                <Link
                  key={idx}
                  href={`/kirayabook/customer/${txn.customerId}`}
                  className="bg-card border border-border rounded-lg p-3 flex justify-between items-center transition-colors hover:border-primary/50 active:scale-[0.99]"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">{txn.description}</p>
                  </div>
                  <span className={`text-sm font-semibold ${txn.type === 'received' ? 'text-primary' : txn.type === 'refund' ? 'text-brand-amber' : 'text-destructive'}`}>
                    {txn.type === 'received' ? '+' : '-'}₹{Math.abs(txn.amount || 0).toFixed(0)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Floating add button (above the bottom nav) for quick new rental */}
      <div className="pointer-events-none fixed bottom-24 left-1/2 z-40 w-full max-w-md -translate-x-1/2 px-6">
        <div className="flex justify-end">
          <Link
            href="/kirayabook/new-rental"
            aria-label="New rental"
            className="pointer-events-auto flex h-16 w-16 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-elevated transition-transform active:scale-95"
          >
            <Plus className="h-8 w-8" />
          </Link>
        </div>
      </div>
    </div>
  );
}
