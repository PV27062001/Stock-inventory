'use client';

import { logger } from '@/lib/logger';
import { useState, useEffect, useMemo, Suspense } from 'react';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getRental, updateRental, getCustomerById, Rental, Customer } from '@/firebase/kirayabook/firestore-service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown, ArrowLeft, Share2, Printer, ArrowDownCircle, ArrowUpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { calcSettlement, clampNonNegative, isRentalClosed } from '@/lib/rental-calculations';
import { BrandLoader } from '@/components/app/brand-loader';
import { LoadingOverlay } from '@/components/app/loading-overlay';
import { SuccessOverlay } from '@/components/app/success-overlay';
import { shareBillOnWhatsApp } from '@/lib/bill';

function CompleteRentalByIdPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rentalId = (params?.id as string) || '';
  const customerId = searchParams?.get('customerId') || '';

  const [rental, setRental] = useState<Rental | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [returnTime, setReturnTime] = useState<string>('Morning');
  const [damageNotes, setDamageNotes] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<number>(0);
  const [amountReturned, setAmountReturned] = useState<number>(0);
  const [closedBalance, setClosedBalance] = useState<number>(0);
  const [closedRefund, setClosedRefund] = useState<number>(0);
  const [saved, setSaved] = useState(false);
  const [success, setSuccess] = useState<{ message: string; redirect?: string } | null>(null);

  const totalAmount = rental?.totalAmount || 0;
  const advanceAmount = rental?.advanceAmount || 0;
  const alreadyClosed = isRentalClosed(rental?.status);
  // Net of the bill, the advance and today's cash in/out.
  const settlement = useMemo(
    () => calcSettlement(totalAmount, advanceAmount, amountPaid, amountReturned),
    [totalAmount, advanceAmount, amountPaid, amountReturned],
  );
  // Position before any cash moves today.
  const opening = useMemo(() => calcSettlement(totalAmount, advanceAmount), [totalAmount, advanceAmount]);
  const isRefund = opening.refundDue > 0;

  useEffect(() => {
    if (!rentalId) {
      setError('Rental ID is missing.');
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    getRental(rentalId).then(rent => {
      if (rent) {
        setRental(rent);
        if (rent.customerId) {
          getCustomerById(rent.customerId)
            .then(setCustomer)
            .catch((e) => logger.warn('Could not load customer for bill:', e));
        }
        setReturnDate(rent.rentalTo || new Date());
        setDamageNotes(rent.damageNotes || '');
        const open = calcSettlement(rent.totalAmount || 0, rent.advanceAmount || 0);
        // Records closed before the refund field existed never saved refundDue — recompute
        // from the totals instead of trusting a stale balanceDue of 0.
        const hasRefundField = rent.refundDue !== undefined;
        setClosedBalance(hasRefundField ? rent.balanceDue || 0 : open.balanceDue);
        setClosedRefund(hasRefundField ? rent.refundDue || 0 : open.refundDue);
        setAmountPaid(isRentalClosed(rent.status) ? 0 : open.balanceDue);
        setAmountReturned(isRentalClosed(rent.status) ? 0 : open.refundDue);
      } else {
        setError('Rental not found.');
      }
      setIsLoading(false);
    }).catch(e => {
      setError('Failed to load rental.');
      logger.error(e);
      setIsLoading(false);
    });
  }, [rentalId]);

  const handleComplete = async () => {
    if (!rentalId) return;
    setIsSaving(true);
    setError('');
    try {
      if (alreadyClosed) {
        const updates = {
          damageNotes,
          balanceDue: clampNonNegative(closedBalance),
          refundDue: clampNonNegative(closedRefund),
        };
        await updateRental(rentalId, updates);
        setRental((r) => (r ? { ...r, ...updates } : r));
        setSaved(true);
        setIsSaving(false);
        setSuccess({ message: 'Changes saved' });
        return;
      }

      await updateRental(rentalId, {
        status: 'Completed',
        rentalTo: returnDate,
        damageNotes: damageNotes,
        balanceDue: settlement.balanceDue,
        refundDue: settlement.refundDue,
        settledDate: new Date(),
      });

      setSuccess({
        message: 'Rental closed',
        redirect: customerId ? `/kirayabook/customer/${customerId}` : '/kirayabook/rentals',
      });
    } catch(e) {
      setError('Failed to complete rental. Please try again.');
      logger.error(e);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <BrandLoader label="Loading rental…" />;
  }

  if (error) {
    return <div className="text-center p-10 text-destructive">{error}</div>;
  }

  if (!rental) {
    return <div className="text-center p-10 text-muted-foreground">Rental data not available.</div>;
  }

  return (
    <div className="bg-background min-h-screen text-foreground font-sans max-w-md mx-auto">
      <LoadingOverlay show={isSaving} message="Saving, please wait..." />
      <SuccessOverlay
        show={!!success}
        message={success?.message ?? ''}
        onDone={() => {
          const redirect = success?.redirect;
          setSuccess(null);
          if (redirect) router.push(redirect);
        }}
      />
      <header className="flex items-center p-4 bg-card sticky top-0 z-10 border-b border-border">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Complete Rental</h1>
      </header>

      <main className="p-4 pb-60">
        <div className="space-y-6">
          <div className="bg-card rounded-lg p-4">
            <h2 className="text-lg font-bold mb-2">Rental Period</h2>
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>From: {rental.rentalFrom ? format(rental.rentalFrom, 'PPP') : 'N/A'}</span>
              <span>To: {rental.rentalTo ? format(rental.rentalTo, 'PPP') : 'N/A'}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-2 block">Actual Return Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left h-12 bg-card border-border hover:bg-secondary text-foreground rounded-lg text-base flex items-center"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(returnDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-card border-border text-foreground">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={(date) => date && setReturnDate(date)}
                    className="bg-card text-foreground [&_day-today]:bg-emerald-500 [&_day-today]:text-foreground [&_day-outside]:text-muted-foreground [&_nav_button_svg]:text-foreground [&_caption_label]:text-foreground [&_table_th]:text-muted-foreground"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <label className="text-sm text-muted-foreground mb-2 block">Return Time</label>
              <div className="relative">
                <select
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full h-12 px-3 py-2 bg-card border border-border rounded-lg text-base appearance-none text-foreground pr-8 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-card rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">Billing Summary</h2>
            {alreadyClosed ? (
              <>
                <div className="flex justify-between mb-2 text-muted-foreground"><span>Total Amount</span><span>₹{totalAmount.toFixed(2)}</span></div>
                <div className="flex justify-between mb-2 text-muted-foreground"><span>Advance Paid</span><span>₹{advanceAmount.toFixed(2)}</span></div>
                <div className="flex justify-between mb-2 text-muted-foreground"><span>Settled On</span><span>{rental.settledDate ? format(rental.settledDate, 'PPP') : 'N/A'}</span></div>
                <hr className="border-border my-4" />
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 p-3 mb-3">
                  <label htmlFor="closedBalance" className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-emerald-500 text-white shadow-[0_6px_18px_rgba(16,185,129,0.35)]">
                      <ArrowDownCircle className="w-7 h-7" strokeWidth={2.5} />
                    </span>
                    <span className="sr-only">Yet to be collected from {customer?.name || 'customer'}</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-emerald-600">₹</span>
                    <Input
                      id="closedBalance"
                      type="number"
                      min={0}
                      value={closedBalance}
                      onChange={(e) => { setClosedBalance(parseFloat(e.target.value) || 0); setSaved(false); }}
                      className="w-28 text-right font-extrabold text-xl text-emerald-700 bg-background"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 to-primary/5 p-3">
                  <label htmlFor="closedRefund" className="flex items-center gap-3">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-white shadow-primary-glow">
                      <ArrowUpCircle className="w-7 h-7" strokeWidth={2.5} />
                    </span>
                    <span className="sr-only">Yet to be returned to {customer?.name || 'customer'}</span>
                  </label>
                  <div className="flex items-center gap-1">
                    <span className="text-lg font-bold text-primary">₹</span>
                    <Input
                      id="closedRefund"
                      type="number"
                      min={0}
                      value={closedRefund}
                      onChange={(e) => { setClosedRefund(parseFloat(e.target.value) || 0); setSaved(false); }}
                      className="w-28 text-right font-extrabold text-xl text-primary bg-background"
                    />
                  </div>
                </div>
              </>
            ) : (
              <>
            <div className={`rounded-lg p-3 mb-4 flex justify-between items-center border ${isRefund ? 'bg-brand-amber/10 border-brand-amber/30' : 'bg-primary/10 border-primary/20'}`}>
              <span className="font-semibold text-foreground">{isRefund ? 'Amount to Return' : 'Amount to Collect'}</span>
              <span className={`text-2xl font-bold ${isRefund ? 'text-brand-amber' : 'text-primary'}`}>
                ₹{(isRefund ? opening.refundDue : opening.balanceDue).toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between mb-2 text-muted-foreground">
              <span>Total Amount</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-muted-foreground">
              <span>Advance Paid</span>
              <span>- ₹{advanceAmount.toFixed(2)}</span>
            </div>
            {isRefund ? (
              <div className="flex items-center justify-between mb-4">
                <label htmlFor="amountReturned" className="text-sm text-muted-foreground block">Amount Returned Today</label>
                <Input
                  id="amountReturned"
                  type="number"
                  min={0}
                  value={amountReturned}
                  onChange={(e) => setAmountReturned(parseFloat(e.target.value) || 0)}
                  className="bg-transparent border-none text-right w-24 text-foreground focus:ring-0 p-0 font-bold text-base"
                />
              </div>
            ) : (
              <div className="flex items-center justify-between mb-4">
                <label htmlFor="amountPaid" className="text-sm text-muted-foreground block">Amount Paid Today</label>
                <Input
                  id="amountPaid"
                  type="number"
                  min={0}
                  value={amountPaid}
                  onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)}
                  className="bg-transparent border-none text-right w-24 text-foreground focus:ring-0 p-0 font-bold text-base"
                />
              </div>
            )}
            <hr className="border-border mb-4" />
            {settlement.refundDue > 0 ? (
              <div className="flex justify-between text-xl font-bold">
                <span>Still to Return</span>
                <span className="text-brand-amber">₹{settlement.refundDue.toFixed(2)}</span>
              </div>
            ) : (
              <div className="flex justify-between text-xl font-bold">
                <span>Balance Due</span>
                <span className={settlement.balanceDue > 0 ? 'text-destructive' : 'text-primary'}>₹{settlement.balanceDue.toFixed(2)}</span>
              </div>
            )}
              </>
            )}
          </div>

          <div>
            <label htmlFor="damageNotes" className="text-sm text-muted-foreground mb-2 block">Damage Notes (Optional)</label>
            <textarea
              id="damageNotes"
              value={damageNotes}
              onChange={(e) => { setDamageNotes(e.target.value); setSaved(false); }}
              className="w-full h-24 p-3 bg-card border border-border rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter any notes about damages..."
            />
          </div>
        </div>

        {error && <p className="text-destructive text-sm mt-4 text-center">{error}</p>}

        <div className="fixed bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4 space-y-2">
          <Button variant="outline" asChild className="w-full h-12 rounded-xl text-base font-semibold gap-2">
            <Link href={`/kirayabook/bill/${rentalId}`}>
              <Printer className="w-5 h-5" />
              View / Print Bill
            </Link>
          </Button>
          <Button
            variant="outline"
            onClick={() => shareBillOnWhatsApp(rental, customer)}
            className="w-full h-12 rounded-xl text-base font-semibold border-[#25D366]/40 text-[#25D366] hover:bg-[#25D366]/10 gap-2"
          >
            <Share2 className="w-5 h-5" />
            Send bill on WhatsApp
          </Button>
          <Button onClick={handleComplete} disabled={isSaving} className="w-full font-bold h-14 rounded-xl text-base bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed">
            {alreadyClosed
              ? (isSaving ? 'Saving...' : saved ? 'Saved' : 'Save changes')
              : isSaving
                ? 'Closing...'
                : settlement.refundDue > 0
                  ? `Close Rental (₹${settlement.refundDue.toFixed(0)} to return)`
                  : settlement.balanceDue > 0
                    ? `Close Rental (₹${settlement.balanceDue.toFixed(0)} due)`
                    : 'Close Rental'}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function CompleteRentalByIdPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <CompleteRentalByIdPageContent />
    </Suspense>
  );
}
