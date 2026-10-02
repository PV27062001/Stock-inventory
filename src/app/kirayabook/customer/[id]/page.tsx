
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCustomerById, getRentalsByCustomerId, Customer, Rental } from '@/firebase/kirayabook/firestore-service';
import { ArrowLeft, Clock3, DollarSign, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import Link from 'next/link';

export default function CustomerDetailPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = (params?.id as string) || '';

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRentalsLoading, setIsRentalsLoading] = useState(true);
  const [error, setError] = useState('');

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
      console.error(e);
      setIsLoading(false);
    });
  }, [customerId]);

  useEffect(() => {
    if (!customerId) {
      setIsRentalsLoading(false);
      return;
    }
    setIsRentalsLoading(true);
    getRentalsByCustomerId(customerId).then((custRentals) => {
      setRentals(custRentals);
      setIsRentalsLoading(false);
    }).catch((e) => {
      console.error('Failed to load rentals for customer:', e);
      setIsRentalsLoading(false);
    });
  }, [customerId]);

  if (isLoading) {
    return <div className="text-center text-lg p-10 text-gray-400">Loading customer details...</div>;
  }

  if (error) {
    return <div className="text-center text-lg p-10 text-red-500">{error}</div>;
  }

  if (!customer) {
    return <div className="text-center text-lg p-10 text-gray-400">Customer not found.</div>;
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

  return (
    <div className="bg-[#1A1A2E] min-h-screen text-white font-sans max-w-md mx-auto">
      <header className="flex items-center p-4 bg-[#16213E] sticky top-0 z-10 border-b border-gray-700/50">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">{customer.name}</h1>
        <Button variant="link" onClick={() => router.push(`/kirayabook/edit-customer/${customerId}`)} className="ml-auto text-emerald-400 hover:text-emerald-500">
          Edit
        </Button>
      </header>

      <main className="p-4 pb-28">
        <div className="flex flex-col items-center mb-6">
          {customer.photoUrl ? (
            <img src={customer.photoUrl} alt="Customer Photo" className="w-32 h-32 rounded-full object-cover border-2 border-gray-600" />
          ) : (
            <div className="w-32 h-32 rounded-full bg-[#16213E] flex items-center justify-center text-4xl font-bold text-gray-500 border-2 border-dashed border-gray-600">
              {getInitials(customer.name)}
            </div>
          )}
          <h2 className="text-2xl font-bold mt-4">{customer.name}</h2>
          <p className="text-gray-400">{customer.mobile}</p>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="rounded-3xl border border-gray-700 bg-[#16213E] p-4 text-center">
            <div className="flex items-center justify-center text-emerald-400 mb-2">
              <CheckCircle className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase text-gray-500">Total Rentals</p>
            <p className="mt-2 text-2xl font-semibold text-white">{totalRentals}</p>
          </div>
          <div className="rounded-3xl border border-gray-700 bg-[#16213E] p-4 text-center">
            <div className="flex items-center justify-center text-yellow-400 mb-2">
              <Clock3 className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase text-gray-500">Active</p>
            <p className="mt-2 text-2xl font-semibold text-emerald-400">{activeRentals}</p>
          </div>
          <div className="rounded-3xl border border-gray-700 bg-[#16213E] p-4 text-center">
            <div className="flex items-center justify-center text-sky-400 mb-2">
              <DollarSign className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase text-gray-500">Advance Paid</p>
            <p className="mt-2 text-2xl font-semibold text-sky-400">₹{totalAdvancePaid.toFixed(0)}</p>
          </div>
          <div className="rounded-3xl border border-gray-700 bg-[#16213E] p-4 text-center">
            <div className="flex items-center justify-center text-red-400 mb-2">
              <AlertTriangle className="w-5 h-5" />
            </div>
            <p className="text-xs uppercase text-gray-500">Pending</p>
            <p className="mt-2 text-2xl font-semibold text-red-400">₹{totalPending.toFixed(0)}</p>
          </div>
        </div>

        <div className="space-y-4">
           <div>
                <label className="text-sm text-gray-400 mb-2 block">Address</label>
                <p className="text-base">{customer.address || 'N/A'}</p>
            </div>
            
            <div>
                <label className="text-sm text-gray-400 mb-2 block">Aadhaar</label>
                <p className="text-base">{customer.aadhaar || 'N/A'}</p>
                {customer.aadhaarPhotoUrl && (
                    <div className="mt-2">
                        <a href={customer.aadhaarPhotoUrl} target="_blank" rel="noopener noreferrer">
                            <img src={customer.aadhaarPhotoUrl} alt="Aadhaar" className="w-full h-auto rounded-lg" />
                        </a>
                    </div>
                )}
            </div>

            <div>
                <label className="text-sm text-gray-400 mb-2 block">PAN</label>
                <p className="text-base">{customer.pan || 'N/A'}</p>
                 {customer.panPhotoUrl && (
                    <div className="mt-2">
                         <a href={customer.panPhotoUrl} target="_blank" rel="noopener noreferrer">
                            <img src={customer.panPhotoUrl} alt="PAN" className="w-full h-auto rounded-lg" />
                        </a>
                    </div>
                )}
            </div>

             <div>
                <label className="text-sm text-gray-400 mb-2 block">Driving Licence</label>
                <p className="text-base">{customer.drivingLicence || 'N/A'}</p>
                 {customer.drivingLicencePhotoUrl && (
                    <div className="mt-2">
                        <a href={customer.drivingLicencePhotoUrl} target="_blank" rel="noopener noreferrer">
                            <img src={customer.drivingLicencePhotoUrl} alt="Driving Licence" className="w-full h-auto rounded-lg" />
                        </a>
                    </div>
                )}
            </div>
        </div>

        <section className="mt-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-400">Rental history</p>
              <h2 className="text-xl font-semibold">Recent activity</h2>
            </div>
            <Link href={`/kirayabook/rentals?customerId=${customerId}`} className="text-emerald-400 text-sm font-semibold hover:text-emerald-300">
              View all
            </Link>
          </div>

          {isRentalsLoading ? (
            <div className="text-center py-10 text-gray-400">Loading rentals...</div>
          ) : rentals.length === 0 ? (
            <div className="text-center py-10 text-gray-400">No rentals yet for this customer.</div>
          ) : (
            <div className="space-y-3">
              {rentals.slice(0, 4).map((rental) => (
                <Link
                  key={rental.id}
                  href={`/kirayabook/complete-rental/${rental.id}?customerId=${customerId}`}
                  className="block rounded-3xl border border-gray-700 bg-[#16213E] p-4 hover:border-emerald-400 transition-colors"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="text-sm text-gray-400">Rental #{rental.id?.slice(-6)}</p>
                      <p className="text-base font-semibold">{rental.status}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-400">Due</p>
                      <p className="font-semibold text-red-400">₹{(rental.balanceDue || 0).toFixed(0)}</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between text-sm text-gray-400">
                    <span>{rental.items.length} item{rental.items.length === 1 ? '' : 's'}</span>
                    <span>{rental.rentalFrom?.toDateString?.() ?? 'N/A'}</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

       <footer className="fixed bottom-4 inset-x-0 px-4 max-w-md mx-auto">
            <Link href={`/kirayabook/rentals?customerId=${customerId}`}>
                <Button className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 rounded-xl text-lg font-bold">
                    View all rentals
                </Button>
            </Link>
        </footer>
    </div>
  );
}
