
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { getAllCustomers, getCustomerById, getAllRentals, Customer, Rental } from '@/firebase/kirayabook/firestore-service';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

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
  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custs, rents] = await Promise.all([
          getAllCustomers(),
          getAllRentals(),
        ]);
        setCustomers(custs);
        setRentals(rents);
      } catch (e) {
        console.error('Failed to fetch data:', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // Handle search with 4+ character threshold
  useEffect(() => {
    if (searchTimeout.current) {
      clearTimeout(searchTimeout.current);
    }

    if (searchTerm.length >= 4) {
      setIsSearching(true);
      searchTimeout.current = setTimeout(() => {
        const results = customers.filter(customer =>
          customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          customer.mobile.includes(searchTerm)
        );
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

  // Calculate money received and pending
  const moneyReceived = rentals
    .filter(r => r.status === 'Completed')
    .reduce((sum, r) => sum + (r.advanceAmount || 0), 0);

  const pendingAmount = rentals
    .filter(r => r.status === 'Active' || r.status === 'Overdue')
    .reduce((sum, r) => sum + (r.balanceDue || 0), 0);

  // Create customer ID to name map
  const customerMap = new Map(customers.map(c => [c.id, c.name]));

  // Recent transactions (mix of advance and balance due)
  const recentTransactions = rentals
    .sort((a, b) => (b.rentalFrom?.getTime?.() || 0) - (a.rentalFrom?.getTime?.() || 0))
    .slice(0, 3)
    .map(r => ({
      id: r.id,
      customerId: r.customerId,
      customerName: customerMap.get(r.customerId) || r.customerId,
      description: `${customerMap.get(r.customerId) || r.customerId} — ${r.status === 'Settled' || r.status === 'Completed' ? 'Completed' : 'Pending'}`,
      amount: r.status === 'Settled' || r.status === 'Completed' ? r.advanceAmount : r.balanceDue,
      type: r.status === 'Settled' || r.status === 'Completed' ? 'received' : 'pending',
      status: r.status,
    }));

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      <header className="bg-[#16213E] sticky top-0 z-10 border-b border-gray-700/50">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-2xl font-bold">Ledger</h1>
        </div>
      </header>

      <main className="max-w-md mx-auto pb-24">
        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-4 p-4">
          <div className="bg-[#16213E] border border-teal-500/30 rounded-2xl p-4">
            <p className="text-xs font-semibold text-teal-400 uppercase tracking-wide">Money Received</p>
            <p className="text-2xl font-bold text-teal-300 mt-2">₹{moneyReceived.toFixed(0)}</p>
          </div>
          <div className="bg-[#16213E] border border-red-500/30 rounded-2xl p-4">
            <p className="text-xs font-semibold text-red-400 uppercase tracking-wide">Pending</p>
            <p className="text-2xl font-bold text-red-400 mt-2">₹{pendingAmount.toFixed(0)}</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative px-4 py-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search by name or mobile"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12 rounded-lg border border-gray-700 bg-[#16213E] text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
            {searchTerm.length > 0 && searchTerm.length < 4 && (
              <p className="text-xs text-gray-400 mt-1">Enter at least 4 characters to search</p>
            )}
          </div>

          {/* Search Results Dropdown */}
          {searchTerm.length >= 4 && searchResults.length > 0 && (
            <div className="absolute left-4 right-4 top-16 bg-[#16213E] border border-gray-700 rounded-lg shadow-lg z-20 overflow-hidden">
              <div className="max-h-48 overflow-y-auto">
                {searchResults.map((customer) => (
                  <Link
                    key={customer.id}
                    href={`/kirayabook/customer/${customer.id}`}
                    className="block px-4 py-3 hover:bg-[#1A1A2E] border-b border-gray-700/50 last:border-b-0"
                  >
                    <p className="font-medium text-white">{customer.name}</p>
                    <p className="text-sm text-gray-400">{customer.mobile}</p>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {searchTerm.length >= 4 && searchResults.length === 0 && !isSearching && (
            <p className="text-sm text-gray-500 mt-2">No customers found</p>
          )}
        </div>

        {/* Recent Entries */}
        <div className="px-4 py-4">
          <h2 className="text-lg font-bold mb-3">Recent entries</h2>
          <div className="space-y-3">
            {recentTransactions.map((txn, idx) => (
              <div key={idx} className="bg-[#16213E] border border-gray-700/50 rounded-lg p-3 flex justify-between items-center">
                <div>
                  <p className="text-sm font-medium text-gray-300">{txn.description}</p>
                </div>
                <span className={`text-sm font-semibold ${txn.type === 'received' ? 'text-teal-400' : 'text-red-400'}`}>
                  {txn.type === 'received' ? '+' : '-'}₹{Math.abs(txn.amount || 0).toFixed(0)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
