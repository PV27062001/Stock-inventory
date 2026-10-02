
'use client';

import { useState, useEffect, useMemo, Suspense } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { getRental, updateRental, Rental } from '@/firebase/kirayabook/firestore-service'; // Corrected import
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronDown, ArrowLeft } from 'lucide-react'; // Added ArrowLeft
import { format } from 'date-fns';

function CompleteRentalPageContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const rentalId = (params?.id as string) || '';
  const customerId = searchParams?.get('customerId') || '';

  const [rental, setRental] = useState<Rental | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  const [returnDate, setReturnDate] = useState<Date>(new Date());
  const [returnTime, setReturnTime] = useState<string>('Morning'); // This state is not used in the logic, but kept for UI
  const [damageNotes, setDamageNotes] = useState<string>('');
  const [amountPaid, setAmountPaid] = useState<number>(0);

  // Calculate totalAmount and balanceDue based on fetched rental data
  const totalAmount = rental?.totalAmount || 0;
  const advanceAmount = rental?.advanceAmount || 0;
  const balanceDue = useMemo(() => totalAmount - advanceAmount - amountPaid, [totalAmount, advanceAmount, amountPaid]);

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
        // Initialize state with fetched data
        setReturnDate(rent.rentalTo || new Date()); 
        setDamageNotes(rent.damageNotes || '');
        setAmountPaid(0);
      } else {
        setError('Rental not found.');
      }
      setIsLoading(false);
    }).catch(e => {
      setError('Failed to load rental.');
      console.error(e);
      setIsLoading(false);
    });
  }, [rentalId]);

  const handleComplete = async () => {
    if (!rentalId) return; // Should not happen if previous checks passed
    setIsSaving(true);
    setError('');
    try {
      // Ensure balanceDue is correctly calculated and passed
      const finalBalanceDue = totalAmount - advanceAmount - amountPaid;

      await updateRental(rentalId, {
        status: 'Completed',
        rentalTo: returnDate, // Update return date
        damageNotes: damageNotes,
        // Update balance due based on amount paid today
        balanceDue: finalBalanceDue < 0 ? 0 : finalBalanceDue, // Ensure balance due is not negative
        settledDate: new Date(),
      });

      // Redirect to customer details page if customerId is available
      if (customerId) {
        router.push(`/kirayabook/customer/${customerId}`);
      } else {
        // Fallback or default redirect if customerId is not available
        router.push('/kirayabook/rentals'); 
      }
      
    } catch(e) {
      setError('Failed to complete rental. Please try again.');
      console.error(e);
    }
    setIsSaving(false);
  };

  if (isLoading) {
    return <div className="text-center p-10 text-gray-400">Loading rental details...</div>;
  }

  if (error) {
    return <div className="text-center p-10 text-red-500">{error}</div>;
  }

  if (!rental) {
    return <div className="text-center p-10 text-gray-400">Rental data not available.</div>;
  }

  return (
    <div className="bg-[#1A1A2E] min-h-screen text-white font-sans max-w-md mx-auto">
      <header className="flex items-center p-4 bg-[#16213E] sticky top-0 z-10 border-b border-gray-700/50">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Complete Rental</h1>
      </header>

      <main className="p-4 pb-44">
        <div className="space-y-6">
          {/* Rental Period Display */}
          <div className="bg-[#16213E] rounded-lg p-4">
            <h2 className="text-lg font-bold mb-2">Rental Period</h2>
            <div className="flex justify-between text-sm text-gray-300">
              <span>From: {format(rental.rentalFrom, 'PPP')}</span>
              <span>To: {rental.rentalTo ? format(rental.rentalTo, 'PPP') : 'N/A'}</span>
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Actual Return Date</label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant={"outline"}
                    className="w-full justify-start text-left h-12 bg-[#16213E] border-gray-700 hover:bg-[#1A1A2E] text-white rounded-lg text-base flex items-center"
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {format(returnDate, 'PPP')}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0 bg-[#16213E] border-gray-700 text-white">
                  <Calendar
                    mode="single"
                    selected={returnDate}
                    onSelect={(date) => date && setReturnDate(date)}
                    className="bg-[#16213E] text-white [&_day-today]:bg-emerald-500 [&_day-today]:text-white [&_day-outside]:text-gray-500 [&_nav_button_svg]:text-white [&_caption_label]:text-white [&_table_th]:text-gray-400"
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className="flex-1">
              <label className="text-sm text-gray-400 mb-2 block">Return Time</label>
              <div className="relative">
                <select
                  value={returnTime}
                  onChange={(e) => setReturnTime(e.target.value)}
                  className="w-full h-12 px-3 py-2 bg-[#16213E] border border-gray-700 rounded-lg text-base appearance-none text-white pr-8 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                >
                  <option value="Morning">Morning</option>
                  <option value="Afternoon">Afternoon</option>
                  <option value="Evening">Evening</option>
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="bg-[#16213E] rounded-lg p-4">
            <h2 className="text-lg font-bold mb-4">Billing Summary</h2>
            <div className="flex justify-between mb-2 text-gray-300">
              <span>Total Amount</span>
              <span>₹{totalAmount.toFixed(2)}</span>
            </div>
            <div className="flex justify-between mb-2 text-gray-300">
              <span>Advance Paid</span>
              <span>- ₹{advanceAmount.toFixed(2)}</span>
            </div>
             <div className="flex items-center justify-between mb-4">
                <label htmlFor="amountPaid" className="text-sm text-gray-400 block">Amount Paid Today</label>
                <Input 
                    id="amountPaid"
                    type="number" 
                    value={amountPaid} 
                    onChange={(e) => setAmountPaid(parseFloat(e.target.value) || 0)} 
                    className="bg-transparent border-none text-right w-24 text-white focus:ring-0 p-0 font-bold text-base" 
                />
            </div>
            <hr className="border-gray-700 mb-4" />
            <div className="flex justify-between text-xl font-bold">
              <span>Balance Due</span>
              <span className={`text-red-500`}>₹{balanceDue.toFixed(2)}</span>
            </div>
          </div>

          <div>
            <label htmlFor="damageNotes" className="text-sm text-gray-400 mb-2 block">Damage Notes (Optional)</label>
            <textarea
              id="damageNotes"
              value={damageNotes}
              onChange={(e) => setDamageNotes(e.target.value)}
              className="w-full h-24 p-3 bg-[#16213E] border border-gray-700 rounded-lg text-base focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
              placeholder="Enter any notes about damages..."
            />
          </div>
        </div>

        {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

        <div className="fixed bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
          <Button onClick={handleComplete} disabled={isSaving} className="w-full font-bold h-14 rounded-xl text-base bg-emerald-500 hover:bg-emerald-600 disabled:bg-gray-600 disabled:cursor-not-allowed">
            {isSaving ? 'Closing...' : balanceDue > 0 ? 'Close Rental with Balance Due' : 'Close Rental'}
          </Button>
        </div>
      </main>
    </div>
  );
}

export default function CompleteRentalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#1A1A2E] text-white p-10 text-center">Loading...</div>}>
      <CompleteRentalPageContent />
    </Suspense>
  );
}
