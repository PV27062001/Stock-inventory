'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCustomerById, getRentalsByCustomerId, deleteCustomer, Customer, Rental } from '@/firebase/kirayabook/firestore-service';
import { ArrowLeft, Clock3, DollarSign, CheckCircle, AlertTriangle, Trash2, Loader2, CheckCircle2 } from 'lucide-react';
import { formatMobile, isVerificationStale } from '@/lib/phone';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { RENTALS_ENABLED } from '@/lib/features';
import { BrandLoader, DataLoader } from '@/components/app/brand-loader';
import { IdCardViewer } from '@/components/app/id-card-viewer';
import { isUsablePhoto } from '@/firebase/kirayabook/storage-service';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = (params?.id as string) || '';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRentalsLoading, setIsRentalsLoading] = useState(true);
  const [error, setError] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteCustomer(customerId);
      router.push('/kirayabook/customers');
    } catch (e) {
      logger.error('Failed to delete customer:', e);
      setError('Failed to delete customer. Please try again.');
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };

  useEffect(() => {
    if (!customerId) {
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getCustomerById(customerId).then(cust => {
      if (cust) {
        setCustomer(cust);
      } else {
        setError('Customer not found.');
      }
      setIsLoading(false);
    }).catch(e => {
      setError('Failed to load customer.');
      logger.error(e);
      setIsLoading(false);
    });
  }, [customerId]);

  useEffect(() => {
    if (!customerId || !RENTALS_ENABLED) {
      setIsRentalsLoading(false);
      return;
    }
    setIsRentalsLoading(true);
    getRentalsByCustomerId(customerId).then((custRentals) => {
      setRentals(custRentals);
      setIsRentalsLoading(false);
    }).catch((e) => {
      logger.error('Failed to load rentals for customer:', e);
      setIsRentalsLoading(false);
    });
  }, [customerId]);

  if (isLoading) {
    return <BrandLoader label="Loading customer…" />;
  }

  if (error) {
    return <div className="text-center text-lg p-10 text-destructive">{error}</div>;
  }

  if (!customer) {
    return <div className="text-center text-lg p-10 text-muted-foreground">Customer not found.</div>;
  }

  const getInitials = (name: string) => {
    const names = name.split(' ');
    return names.length > 1 ? `${names[0][0]}${names[1][0]}` : names[0]?.[0] || '';
  };

  const totalRentals = rentals.length;
  const activeRentals = rentals.filter(rental => rental.status === 'Active').length;
  const settledRentals = rentals.filter(rental => rental.status === 'Settled' || rental.status === 'Completed').length;
  const overdueRentals = rentals.filter(rental => rental.status === 'Overdue').length;
  const totalAdvancePaid = rentals.reduce((sum, rental) => sum + (rental.advanceAmount || 0), 0);
  const totalPending = rentals.reduce((sum, rental) => sum + (rental.balanceDue || 0), 0);
  const totalRefundOwed = rentals.reduce((sum, rental) => sum + (rental.refundDue || 0), 0);

  return (
    <div className="bg-background min-h-screen text-foreground font-sans max-w-md mx-auto">
      <header className="flex items-center p-4 bg-card sticky top-0 z-10 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">{customer.name}</h1>
        <Button variant="link" onClick={() => router.push(`/kirayabook/edit-customer/${customerId}`)} className="ml-auto text-primary hover:text-primary/80">
          Edit
        </Button>
        <Button variant="ghost" size="icon" onClick={() => setConfirmDelete(true)} aria-label="Delete customer" className="text-destructive hover:bg-destructive/10">
          <Trash2 className="w-5 h-5" />
        </Button>
      </header>

      <main className="p-4 pb-44">
        <div className="flex flex-col items-center mb-6">
          {isUsablePhoto(customer.photoUrl) ? (
            <img src={customer.photoUrl} alt="Customer Photo" className="w-28 h-28 rounded-full object-cover shadow-elevated ring-4 ring-primary/10" />
          ) : (
            <div className="w-28 h-28 rounded-full bg-gradient-to-br from-[#4C9AFF] to-[#1A73E8] flex items-center justify-center text-4xl font-bold text-white shadow-primary-glow">
              {getInitials(customer.name)}
            </div>
          )}
          <h2 className="text-2xl font-bold mt-4">{customer.name}</h2>
          <p className="flex items-center gap-1.5 text-muted-foreground">
            {formatMobile(customer.mobile)}
            {customer.mobileVerifiedAt && !isVerificationStale(customer.mobileVerifiedAt) && (
              <CheckCircle2 className="h-4 w-4 text-brand-green" aria-label="Number verified" />
            )}
          </p>
          {(!customer.mobileVerifiedAt || isVerificationStale(customer.mobileVerifiedAt)) && (
            <button
              type="button"
              onClick={() => router.push(`/kirayabook/edit-customer/${customerId}`)}
              className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-brand-amber/15 px-3 py-1 text-xs font-medium text-brand-amber"
            >
              <AlertTriangle className="h-3.5 w-3.5" />
              {customer.mobileVerifiedAt ? 'Number not confirmed in 6 months' : 'Number not verified'} — verify
            </button>
          )}
          {customer.profession && (
            <span className="mt-2 inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {customer.profession}
            </span>
          )}
        </div>

        {RENTALS_ENABLED && (
        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-2xl border border-primary/15 bg-gradient-to-br from-primary/10 to-transparent p-4 shadow-soft">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/15 text-primary mb-3">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Total Rentals</p>
            <p className="mt-1 text-2xl font-bold text-foreground">{totalRentals}</p>
          </div>
          <div className="rounded-2xl border border-brand-amber/20 bg-gradient-to-br from-brand-amber/10 to-transparent p-4 shadow-soft">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-amber/15 text-brand-amber mb-3">
              <Clock3 className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Active</p>
            <p className="mt-1 text-2xl font-bold text-brand-amber">{activeRentals}</p>
          </div>
          <div className="rounded-2xl border border-brand-green/20 bg-gradient-to-br from-brand-green/10 to-transparent p-4 shadow-soft">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-green/15 text-brand-green mb-3">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Advance Paid</p>
            <p className="mt-1 text-2xl font-bold text-brand-green">₹{totalAdvancePaid.toFixed(0)}</p>
          </div>
          <div className="rounded-2xl border border-destructive/20 bg-gradient-to-br from-destructive/10 to-transparent p-4 shadow-soft">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-destructive/15 text-destructive mb-3">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Pending</p>
            <p className="mt-1 text-2xl font-bold text-destructive">₹{Math.max(0, totalPending).toFixed(0)}</p>
          </div>
        </div>
        )}

        {RENTALS_ENABLED && totalRefundOwed > 0 && (
          <div className="mb-6 rounded-2xl border border-brand-amber/30 bg-brand-amber/10 p-4 shadow-soft flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">To Return</p>
              <p className="text-xs text-muted-foreground mt-0.5">Advance was more than the bill</p>
            </div>
            <p className="text-2xl font-bold text-brand-amber">₹{totalRefundOwed.toFixed(0)}</p>
          </div>
        )}

        <div className="rounded-2xl border border-border bg-card p-5 shadow-soft">
            <div className="pb-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Address</p>
                <p className="mt-1 text-base font-medium">{customer.address || 'N/A'}</p>
            </div>

            <div className="border-t border-border py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Aadhaar</p>
                <p className="mt-1 text-base font-medium">{customer.aadhaar || 'N/A'}</p>
                {customer.aadhaarPhotoUrl && <IdCardViewer url={customer.aadhaarPhotoUrl} label="Aadhaar" />}
            </div>

            <div className="border-t border-border py-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">PAN</p>
                <p className="mt-1 text-base font-medium">{customer.pan || 'N/A'}</p>
                {customer.panPhotoUrl && <IdCardViewer url={customer.panPhotoUrl} label="PAN" />}
            </div>

            <div className="border-t border-border pt-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Driving Licence</p>
                <p className="mt-1 text-base font-medium">{customer.drivingLicence || 'N/A'}</p>
                {customer.drivingLicencePhotoUrl && <IdCardViewer url={customer.drivingLicencePhotoUrl} label="Driving Licence" />}
            </div>
        </div>

        {RENTALS_ENABLED && (
        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Rental history</p>
              <h2 className="text-xl font-semibold">Recent activity</h2>
            </div>
            <Link href={`/kirayabook/rentals?customerId=${customerId}`} className="text-primary text-sm font-semibold hover:text-primary/80">
              View all
            </Link>
          </div>

          {isRentalsLoading ? (
            <DataLoader label="Loading rentals…" />
          ) : rentals.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">No rentals yet for this customer.</div>
          ) : (
            <div className="space-y-3">
              {rentals.slice(0, 4).map((rental) => (
                <Link
                  key={rental.id}
                  href={`/kirayabook/complete-rental/${rental.id}?customerId=${customerId}`}
                  className="block rounded-2xl border border-border bg-card p-4 shadow-soft transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:shadow-elevated"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-muted-foreground">Rental #{rental.id?.slice(-6)}</p>
                      <p className="text-base font-semibold">{rental.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-muted-foreground">Due</p>
                      <p className="font-semibold text-destructive">₹{(rental.balanceDue || 0).toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{(rental.items?.length ?? 0)} item{(rental.items?.length ?? 0) === 1 ? '' : 's'}</span>
                    <span>{rental.rentalFrom?.toDateString?.() ?? 'N/A'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
        )}
      </main>

       {RENTALS_ENABLED && (
       <footer className="fixed bottom-24 inset-x-0 px-4 max-w-md mx-auto z-50">
            <Link href={`/kirayabook/rentals?customerId=${customerId}`}>
                <Button className="w-full h-14 rounded-xl text-lg font-bold shadow-elevated">
                    View all rentals
                </Button>
            </Link>
        </footer>
       )}

      {confirmDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 p-6" onClick={() => !isDeleting && setConfirmDelete(false)}>
          <div className="w-full max-w-sm rounded-2xl bg-card p-6 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/15 text-destructive">
              <Trash2 className="h-7 w-7" />
            </div>
            <h3 className="text-center text-lg font-bold text-foreground">Delete {customer.name}?</h3>
            <p className="mt-2 text-center text-sm text-muted-foreground">This removes the customer permanently. Their rental records will remain.</p>
            <div className="mt-6 flex gap-3">
              <Button variant="outline" className="h-12 flex-1 rounded-xl" onClick={() => setConfirmDelete(false)} disabled={isDeleting}>
                Cancel
              </Button>
              <Button className="h-12 flex-1 rounded-xl bg-destructive text-white hover:bg-destructive/90" onClick={handleDelete} disabled={isDeleting}>
                {isDeleting ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Deleting…</> : 'Delete'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
