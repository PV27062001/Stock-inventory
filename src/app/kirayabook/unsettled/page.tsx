'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getAllCustomers, getUnsettledRentals, Customer, Rental } from '@/firebase/kirayabook/firestore-service';
import { AppHeader } from '@/components/app/app-header';
import { BrandLoader } from '@/components/app/brand-loader';
import Link from 'next/link';
import { formatMobile } from '@/lib/phone';
import { Phone, AlertTriangle, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';

type UnsettledRental = Rental & { 
  customerName: string; 
  customerMobile: string; 
  daysPending: number;
};

export default function UnsettledPage() {
  const router = useRouter();
  const [rentals, setRentals] = useState<UnsettledRental[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [activeFilter, setActiveFilter] = useState<string>('All');
  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custs, rents] = await Promise.all([
          getAllCustomers(),
          getUnsettledRentals(),
        ]);

        const customerMap = new Map<string, Customer>();
        custs.forEach((c) => customerMap.set(c.id!, c));

        const now = new Date();
        now.setHours(0, 0, 0, 0);

        const unsettled = rents
          .map(r => {
            const customer = r.customerId ? customerMap.get(r.customerId) : null;
            
            // Calculate days pending
            const rentalDate = new Date(r.rentalFrom);
            rentalDate.setHours(0, 0, 0, 0);
            
            const diffTime = Math.abs(now.getTime() - rentalDate.getTime());
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

            return {
              ...r,
              customerName: customer?.name || 'Unknown',
              customerMobile: customer?.mobile || '',
              daysPending: diffDays,
            };
          });

        // Sort by oldest first (highest days pending)
        unsettled.sort((a, b) => b.daysPending - a.daysPending);
        setRentals(unsettled);
      } catch (e) {
        logger.error('Failed to fetch unsettled data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  if (isLoading) {
    return <BrandLoader />;
  }

  // Bucket rentals
  const buckets = [
    { label: '10+ Days', min: 10, max: Infinity, color: 'text-destructive', bg: 'bg-destructive/10' },
    { label: '7-9 Days', min: 7, max: 9, color: 'text-orange-600', bg: 'bg-orange-600/10' },
    { label: '4-6 Days', min: 4, max: 6, color: 'text-amber-600', bg: 'bg-amber-600/10' },
    { label: '1-3 Days', min: 1, max: 3, color: 'text-primary', bg: 'bg-primary/10' },
    { label: 'Today', min: 0, max: 0, color: 'text-muted-foreground', bg: 'bg-muted' }
  ];
  
  const activeBucket = activeFilter === 'All' ? null : buckets.find(b => b.label === activeFilter);
  const visibleRentals = activeBucket 
    ? rentals.filter(r => r.daysPending >= activeBucket.min && r.daysPending <= activeBucket.max)
    : rentals;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title="Unsettled Accounts" subtitle="Ledger" back backHref="/kirayabook" switchTo="inventory" />
      
      {/* Horizontal filter chips */}
      <div className="sticky top-[60px] z-10 bg-background/80 backdrop-blur-md border-b border-border py-3">
        <div className="flex overflow-x-auto gap-2 px-4 no-scrollbar">
          <button
            onClick={() => setActiveFilter('All')}
            className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors ${
              activeFilter === 'All' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/70'
            }`}
          >
            All Pending
          </button>
          {buckets.map(bucket => {
            const count = rentals.filter(r => r.daysPending >= bucket.min && r.daysPending <= bucket.max).length;
            // Always show the button, even if count is 0
            return (
              <button
                key={bucket.label}
                onClick={() => setActiveFilter(bucket.label)}
                className={`whitespace-nowrap px-4 py-2 rounded-full text-sm font-semibold transition-colors flex items-center gap-2 ${
                  activeFilter === bucket.label ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground hover:bg-secondary/70'
                }`}
              >
                {bucket.label}
                {count > 0 && (
                  <span className={`px-1.5 py-0.5 rounded-full text-[10px] ${
                    activeFilter === bucket.label ? 'bg-white/20 text-white' : 'bg-background text-muted-foreground'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      <main className="px-4 py-6 pb-24 max-w-md mx-auto space-y-8">
        {visibleRentals.length === 0 ? (
          <div className="text-center py-20">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-secondary mb-4 text-muted-foreground">
               <AlertTriangle className="h-8 w-8" />
            </div>
            <h2 className="text-xl font-bold">No pending rentals</h2>
            <p className="text-muted-foreground mt-2">There are no orders pending for this time period.</p>
          </div>
        ) : (
          (activeBucket ? [activeBucket] : buckets).map(bucket => {
            const bucketRentals = visibleRentals.filter(r => r.daysPending >= bucket.min && r.daysPending <= bucket.max);
            
            if (bucketRentals.length === 0) return null;

            return (
              <section key={bucket.label} className="space-y-4">
                <div className="flex items-center gap-2">
                  <h2 className={`text-lg font-bold ${bucket.color}`}>{bucket.label}</h2>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${bucket.bg} ${bucket.color}`}>
                    {bucketRentals.length}
                  </span>
                </div>
                
                <div className="space-y-3">
                  {bucketRentals.map(rental => (
                    <Link 
                      key={rental.id} 
                      href={`/kirayabook/complete-rental/${rental.id}?customerId=${rental.customerId}`}
                      className="block rounded-xl border border-border bg-card p-4 shadow-sm hover:border-primary/40 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-lg">{rental.customerName}</h3>
                          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-0.5">
                            <Phone className="h-3.5 w-3.5" />
                            {formatMobile(rental.customerMobile)}
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-destructive text-lg">₹{rental.balanceDue}</p>
                          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Pending</p>
                        </div>
                      </div>
                      
                      <div className="mt-3 pt-3 border-t border-border/50 text-sm list-none">
                        <div className="flex justify-between text-muted-foreground items-center mb-1">
                          <span className="flex items-center gap-1.5">
                            <CalendarIcon className="h-3.5 w-3.5" />
                            {format(new Date(rental.rentalFrom), 'MMM d, yyyy')}
                          </span>
                          <span className={`font-bold ${bucket.color}`}>{rental.daysPending} days ago</span>
                        </div>
                        <p className="text-foreground mt-2 line-clamp-1">
                          <span className="text-muted-foreground">Items:</span> {rental.items.map(i => i.name).join(', ')}
                        </p>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>
            );
          })
        )}
      </main>
    </div>
  );
}
