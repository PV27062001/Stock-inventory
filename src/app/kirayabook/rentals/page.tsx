'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRentalsPage, getAllCustomers, Customer, Rental } from '@/firebase/kirayabook/firestore-service';
import type { QueryDocumentSnapshot } from 'firebase/firestore';
import { Search, Filter, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { BrandLoader, DataLoader } from '@/components/app/brand-loader';

const formatRentalDate = (date: Date | undefined) => {
  if (!date) return 'N/A';
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

function RentalsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const customerId = searchParams?.get('customerId') || '';

  const [rentals, setRentals] = useState<Rental[]>([]);
  const [customerNames, setCustomerNames] = useState<Record<string, string>>({});
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);
  const [customers, setCustomers] = useState<Customer[] | null>(null);
  const [debouncedTerm, setDebouncedTerm] = useState('');
  const [cursor, setCursor] = useState<QueryDocumentSnapshot | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [tooManyMatches, setTooManyMatches] = useState(false);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    getAllCustomers()
      .then((custs) => {
        setCustomers(custs);
        setCustomerNames(Object.fromEntries(custs.map((c) => [c.id || '', c.name])));
      })
      .catch((e) => {
        logger.error('Failed to load customers:', e);
        setCustomers([]);
      });
  }, []);

  // Debounce typing so each keystroke does not trigger a query.
  useEffect(() => {
    const t = setTimeout(() => setDebouncedTerm(searchTerm.trim()), 300);
    return () => clearTimeout(t);
  }, [searchTerm]);

  // Resolve the search text to at most 30 customer ids (name or phone digits).
  const resolveCustomerIds = (term: string): { ids: string[] | undefined; truncated: boolean } => {
    if (customerId) return { ids: [customerId], truncated: false };
    if (!term) return { ids: undefined, truncated: false };
    const lower = term.toLowerCase();
    const digits = term.replace(/\D/g, '');
    const phoneMode = digits.length >= 3 && digits.length >= term.replace(/\s/g, '').length - 1;
    const matches = (customers ?? []).filter((c) =>
      phoneMode
        ? (c.mobile || '').replace(/\D/g, '').includes(digits)
        : (c.name || '').toLowerCase().includes(lower),
    );
    return { ids: matches.slice(0, 30).map((c) => c.id as string), truncated: matches.length > 30 };
  };

  const fetchPage = async (reset: boolean) => {
    const { ids, truncated } = resolveCustomerIds(debouncedTerm);
    setTooManyMatches(truncated);
    if (reset) setIsLoading(true); else setIsLoadingMore(true);
    setLoadError('');
    try {
      const page = await getRentalsPage({
        pageSize: 20,
        cursor: reset ? null : cursor,
        customerIds: ids,
        status: filterStatus === 'All' ? undefined : (filterStatus as Rental['status']),
      });
      setRentals((prev) => (reset ? page.rentals : [...prev, ...page.rentals]));
      setCursor(page.cursor);
      setHasMore(page.hasMore);
    } catch (error) {
      logger.error('Failed to fetch rentals:', error);
      setLoadError('Could not load rentals. Please try again.');
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  };

  useEffect(() => {
    if (customers === null) return;
    fetchPage(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customers, customerId, debouncedTerm, filterStatus]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  const filteredAndSearchedRentals = rentals;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card sticky top-0 z-10 border-b border-border flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold">All Rentals</h1>
        <Link href="/kirayabook/new-rental">
          <Button className="bg-primary hover:bg-teal-700 text-primary-foreground rounded-full">
            <Plus className="w-4 h-4 mr-1" /> Add rental
          </Button>
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pb-24">
        <div className="relative mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone"
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 h-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-4 border-border bg-card text-foreground hover:bg-secondary">
                <Filter className="w-4 h-4" />
                <span className="ml-2 text-sm">{filterStatus}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-card border-border">
              <DropdownMenuItem onSelect={() => handleFilterChange('All')} className="cursor-pointer hover:bg-secondary text-foreground">All</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleFilterChange('Active')} className="cursor-pointer hover:bg-secondary text-foreground">Active</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleFilterChange('Completed')} className="cursor-pointer hover:bg-secondary text-foreground">Completed</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleFilterChange('Overdue')} className="cursor-pointer hover:bg-secondary text-foreground">Overdue</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <DataLoader label="Loading rentals…" />
        ) : loadError ? (
          <div className="text-center py-10 text-destructive">{loadError}</div>
        ) : filteredAndSearchedRentals.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            {searchTerm || filterStatus !== 'All' ? 'No rentals match your criteria.' : 'No rentals found.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSearchedRentals.map((rental) => (
              <Link key={rental.id} href={`/kirayabook/complete-rental/${rental.id}${customerId ? `?customerId=${customerId}` : ''}`}>
                <div className="bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-foreground">{customerNames[rental.customerId] || `Rental #${rental.id?.substring(0, 6)}`}</h3>
                      <p className="text-xs text-muted-foreground mt-1">
                        From: {formatRentalDate(rental.rentalFrom)}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      rental.status === 'Completed' ? 'bg-primary/20 text-primary' :
                      rental.status === 'Active' ? 'bg-brand-amber/20 text-brand-amber' :
                      'bg-destructive/20 text-destructive'
                    }`}>
                      {rental.status === 'Active' ? '⏱️ Active' : rental.status === 'Completed' ? '✓ Completed' : '⚠️ Overdue'}
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    <p>Items: {(rental.items ?? []).map(item => item.name).join(', ')}</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">To: {rental.rentalTo ? formatRentalDate(rental.rentalTo) : 'Not returned yet'}</p>
                </div>
              </Link>
            ))}
            {tooManyMatches && (
              <p className="text-xs text-center text-muted-foreground">Many customers match. Showing the first 30; type more to narrow down.</p>
            )}
            {hasMore && (
              <Button variant="outline" className="w-full" disabled={isLoadingMore} onClick={() => fetchPage(false)}>
                {isLoadingMore ? 'Loading…' : 'Load more'}
              </Button>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RentalsPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <RentalsContent />
    </Suspense>
  );
}
