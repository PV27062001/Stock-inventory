'use client';

import { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { getAllRentals, getRentalsByCustomerId, Rental } from '@/firebase/kirayabook/firestore-service';
import { Search, Filter, Plus } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('All');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    const fetchRentals = async () => {
      try {
        let fetchedRentals: Rental[] = [];
        if (customerId) {
          fetchedRentals = await getRentalsByCustomerId(customerId);
        } else {
          fetchedRentals = await getAllRentals();
        }
        setRentals(fetchedRentals);
      } catch (error) {
        console.error("Failed to fetch rentals:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchRentals();
  }, [customerId]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(e.target.value);
  };

  const handleFilterChange = (status: string) => {
    setFilterStatus(status);
  };

  const filteredAndSearchedRentals = rentals.filter((rental) => {
    const matchesStatus = filterStatus === 'All' || rental.status === filterStatus;
    // Basic search by rental ID, customer ID, or item name
    const matchesSearch =
      rental.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.customerId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rental.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()));

    return matchesStatus && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      <header className="bg-[#16213E] sticky top-0 z-10 border-b border-gray-700/50 flex items-center justify-between px-4 py-4">
        <h1 className="text-2xl font-bold">All Rentals</h1>
        <Link href="/kirayabook/new-rental">
          <Button className="bg-teal-600 hover:bg-teal-700 text-white rounded-full">
            <Plus className="w-4 h-4 mr-1" /> Add rental
          </Button>
        </Link>
      </header>

      <main className="max-w-md mx-auto px-4 py-4 pb-24">
        <div className="relative mb-6 flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
            <Input
              placeholder="Search rentals"
              value={searchTerm}
              onChange={handleSearch}
              className="pl-10 h-12 rounded-lg border border-gray-700 bg-[#16213E] text-white placeholder-gray-500 focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="h-12 px-4 border-gray-700 bg-[#16213E] text-white hover:bg-[#1A1A2E]">
                <Filter className="w-4 h-4" />
                <span className="ml-2 text-sm">All</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="bg-[#16213E] border-gray-700">
              <DropdownMenuItem onSelect={() => handleFilterChange('All')} className="cursor-pointer hover:bg-[#1A1A2E] text-white">All</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleFilterChange('Active')} className="cursor-pointer hover:bg-[#1A1A2E] text-white">Active</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleFilterChange('Completed')} className="cursor-pointer hover:bg-[#1A1A2E] text-white">Completed</DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleFilterChange('Overdue')} className="cursor-pointer hover:bg-[#1A1A2E] text-white">Overdue</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {isLoading ? (
          <div className="text-center py-10 text-gray-400">Loading rentals...</div>
        ) : filteredAndSearchedRentals.length === 0 ? (
          <div className="text-center py-10 text-gray-400">
            {searchTerm || filterStatus !== 'All' ? 'No rentals match your criteria.' : 'No rentals found.'}
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSearchedRentals.map((rental) => (
              <Link key={rental.id} href={`/kirayabook/complete-rental/${rental.id}${customerId ? `?customerId=${customerId}` : ''}`}>
                <div className="bg-[#16213E] border border-gray-700/50 rounded-lg p-4 hover:border-teal-500/30 transition-colors">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-bold text-white">Rental #{rental.id?.substring(0, 6)}</h3>
                      <p className="text-xs text-gray-400 mt-1">
                        From: {formatRentalDate(rental.rentalFrom)}
                      </p>
                    </div>
                    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
                      rental.status === 'Completed' ? 'bg-teal-500/20 text-teal-400' :
                      rental.status === 'Active' ? 'bg-amber-500/20 text-amber-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {rental.status === 'Active' ? '⏱️ Active' : rental.status === 'Completed' ? '✓ Completed' : '⚠️ Overdue'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-300">
                    <p>Items: {rental.items.map(item => item.name).join(', ')}</p>
                  </div>
                  <p className="text-xs text-gray-400 mt-2">To: {rental.rentalTo ? formatRentalDate(rental.rentalTo) : 'Not returned yet'}</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

export default function RentalsPage() {
  return (
    <Suspense fallback={<div className="text-center text-lg p-10 text-gray-400 bg-[#1A1A2E] min-h-screen">Loading rentals...</div>}>
      <RentalsContent />
    </Suspense>
  );
}
