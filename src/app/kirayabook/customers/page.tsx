'use client';

import { logger } from '@/lib/logger';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Plus, Phone, Search, Sparkles, UserPlus, Users, MessageCircle, X, CheckCircle2, AlertTriangle } from 'lucide-react';
import { formatMobile, isVerificationStale, toCallNumber, toWhatsAppNumber } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Customer, getAllCustomers } from '@/firebase/kirayabook/firestore-service';
import { isUsablePhoto } from '@/firebase/kirayabook/storage-service';

const getInitials = (name: string) => {
  const names = name.trim().split(' ');
  return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0]?.[0] || '';
};

export default function CustomersPage() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [viewer, setViewer] = useState<Customer | null>(null);

  useEffect(() => {
    let isMounted = true;

    getAllCustomers()
      .then((custs) => {
        if (isMounted) {
          setCustomers(custs);
        }
      })
      .catch((e) => {
        logger.error('Failed to fetch customers:', e);
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
      customer.mobile.includes(normalizedSearch) ||
      (customer.profession || '').toLowerCase().includes(normalizedSearch)
    );
  }, [customers, normalizedSearch]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card sticky top-0 z-10 border-b border-border flex items-center justify-between px-4 py-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">KirayaBook</p>
          <h1 className="text-2xl font-bold">Customers</h1>
        </div>
        <Link href="/kirayabook/add-customer">
          <Button className="rounded-full">
            <Plus className="w-4 h-4 mr-1" /> Add new
          </Button>
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pb-24">
        <section className="grid grid-cols-2 gap-3 mb-4">
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-transparent p-4 shadow-soft">
            <div className="flex items-center gap-2 text-primary">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary/15"><Users className="w-4 h-4" /></div>
              <span className="text-xs font-semibold uppercase tracking-wide">Total</span>
            </div>
            <p className="mt-2 text-3xl font-bold">{customers.length}</p>
          </div>
          <Link href="/kirayabook/add-customer" className="rounded-2xl border border-brand-green/20 bg-gradient-to-br from-brand-green/10 to-transparent p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-elevated">
            <div className="flex items-center gap-2 text-brand-green">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-green/15"><UserPlus className="w-4 h-4" /></div>
              <span className="text-xs font-semibold uppercase tracking-wide">Fast add</span>
            </div>
            <p className="mt-2 text-sm font-semibold text-foreground">New customer</p>
          </Link>
        </section>

        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, mobile or profession"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-12 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
          />
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="bg-card border border-border rounded-2xl p-4 shadow-soft animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-28 rounded bg-muted" />
                    <div className="h-3 w-24 rounded bg-muted" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : displayedCustomers.length === 0 ? (
          <div className="bg-card border border-border rounded-lg p-6 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Sparkles className="h-6 w-6" />
            </div>
            <h2 className="text-lg font-bold text-foreground">
              {searchTerm ? 'No matching customers' : 'Build your customer book'}
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              {searchTerm ? 'Try a different name, mobile number or profession.' : 'Add customers once and searches will stay instant on this screen.'}
            </p>
            {!searchTerm && (
              <Link href="/kirayabook/add-customer" className="mt-5 inline-flex">
                <Button className="rounded-full">
                  <Plus className="w-4 h-4 mr-1" /> Add customer
                </Button>
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-3">
            {displayedCustomers.map((customer) => (
              <div
                key={customer.id}
                onClick={() => router.push(`/kirayabook/customer/${customer.id}`)}
                className="bg-card border border-border rounded-2xl p-4 flex items-center shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elevated cursor-pointer"
              >
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); setViewer(customer); }}
                  aria-label={`View ${customer.name} photo`}
                  className="w-12 h-12 shrink-0 rounded-full overflow-hidden bg-gradient-to-br from-[#4C9AFF] to-[#1A73E8] flex items-center justify-center text-white font-bold mr-3 shadow-soft"
                >
                  {isUsablePhoto(customer.photoUrl) ? (
                    <img src={customer.photoUrl} alt={customer.name} className="w-full h-full object-cover" />
                  ) : (
                    getInitials(customer.name)
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <h2 className="font-semibold text-foreground truncate">{customer.name}</h2>
                  <p className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Phone className="h-3.5 w-3.5 text-primary" />
                    {formatMobile(customer.mobile)}
                    {customer.mobileVerifiedAt && !isVerificationStale(customer.mobileVerifiedAt) && (
                      <CheckCircle2 className="h-3.5 w-3.5 text-brand-green" aria-label="Number verified" />
                    )}
                    {customer.mobileVerifiedAt && isVerificationStale(customer.mobileVerifiedAt) && (
                      <AlertTriangle
                        className="h-3.5 w-3.5 text-brand-amber"
                        aria-label="Number not confirmed in over 6 months"
                      />
                    )}
                  </p>
                  {customer.profession && (
                    <span className="mt-1 inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                      {customer.profession}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold px-3 py-1 rounded-full bg-primary/15 text-primary">Saved</span>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* WhatsApp-style photo viewer with quick call / message actions */}
      {viewer && (
        <div
          className="fixed inset-0 z-[60] flex flex-col items-center justify-center bg-black/80 p-6"
          onClick={() => setViewer(null)}
        >
          <button
            type="button"
            onClick={() => setViewer(null)}
            aria-label="Close"
            className="absolute top-5 right-5 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 text-white"
          >
            <X className="h-6 w-6" />
          </button>

          <div className="flex flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {isUsablePhoto(viewer.photoUrl) ? (
              <img
                src={viewer.photoUrl}
                alt={viewer.name}
                className="max-h-[60vh] w-auto max-w-[85vw] rounded-2xl object-contain shadow-elevated"
              />
            ) : (
              <div className="flex h-56 w-56 items-center justify-center rounded-full bg-gradient-to-br from-[#4C9AFF] to-[#1A73E8] text-6xl font-bold text-white shadow-elevated">
                {getInitials(viewer.name)}
              </div>
            )}
            <h3 className="mt-5 text-xl font-bold text-white">{viewer.name}</h3>
            <p className="text-sm text-white/70">{viewer.mobile}</p>

            <div className="mt-6 flex items-center gap-4">
              <a
                href={`tel:${toCallNumber(viewer.mobile)}`}
                className="flex flex-col items-center gap-2 text-white"
                aria-label="Call"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-primary shadow-elevated active:scale-95">
                  <Phone className="h-7 w-7" />
                </span>
                <span className="text-sm font-medium">Call</span>
              </a>
              <a
                href={`https://wa.me/${toWhatsAppNumber(viewer.mobile)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex flex-col items-center gap-2 text-white"
                aria-label="WhatsApp"
              >
                <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[#25D366] shadow-elevated active:scale-95">
                  <MessageCircle className="h-7 w-7" />
                </span>
                <span className="text-sm font-medium">WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
