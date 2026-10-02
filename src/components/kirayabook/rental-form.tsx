'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarIcon, Minus, Plus } from 'lucide-react';
import { format } from 'date-fns';
import { addRental, Customer, getAllCustomers, RentalItem } from '@/firebase/kirayabook/firestore-service';
import { getInventoryItems, InventoryItem as RentableInventoryItem } from '@/firebase/kirayabook/inventory-service';
import { AppHeader } from '@/components/app/app-header';
import { LoadingOverlay } from '@/components/app/loading-overlay';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { SearchableSelect, SearchableSelectOption } from '@/components/ui/searchable-select';

const emptyRentalItem: RentalItem = { itemId: '', name: '', quantity: 1, rate: 0 };

export function RentalForm() {
  const router = useRouter();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventoryItems, setInventoryItems] = useState<RentableInventoryItem[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [rentalFrom, setRentalFrom] = useState<Date>(new Date());
  const [rentalTo, setRentalTo] = useState<Date | undefined>(undefined);
  const [items, setItems] = useState<RentalItem[]>([emptyRentalItem]);
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    let isMounted = true;
    router.prefetch('/kirayabook/rentals');

    Promise.all([getAllCustomers(), getInventoryItems()])
      .then(([customerList, inventoryList]) => {
        if (!isMounted) return;
        setCustomers(customerList);
        setInventoryItems(inventoryList);
      })
      .catch((e) => {
        console.error('Failed to load rental form data:', e);
        if (isMounted) {
          setError('Could not load customers or inventory. Please try again.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [router]);

  const customerOptions = useMemo<SearchableSelectOption[]>(() => (
    customers.map((customer) => ({
      value: customer.id || '',
      label: customer.name,
      description: customer.mobile,
    })).filter((option) => option.value)
  ), [customers]);

  const inventoryOptions = useMemo<SearchableSelectOption[]>(() => (
    inventoryItems.map((item) => ({
      value: item.id || '',
      label: item.name,
      description: `Rs.${item.price} per day`,
    })).filter((option) => option.value)
  ), [inventoryItems]);

  const totalAmount = useMemo(
    () => items.reduce((sum, item) => sum + (item.quantity * item.rate), 0),
    [items]
  );
  const balanceDue = totalAmount - advanceAmount;

  const updateItem = (index: number, updates: Partial<RentalItem>) => {
    setItems((currentItems) =>
      currentItems.map((item, itemIndex) => itemIndex === index ? { ...item, ...updates } : item)
    );
  };

  const handleSelectInventoryItem = (index: number, itemId: string) => {
    const selectedItem = inventoryItems.find((item) => item.id === itemId);
    if (!selectedItem) {
      updateItem(index, { itemId: '', name: '', rate: 0 });
      return;
    }

    updateItem(index, {
      itemId: selectedItem.id || '',
      name: selectedItem.name,
      rate: selectedItem.price,
    });
  };

  const handleAddItem = () => {
    setItems((currentItems) => [...currentItems, { ...emptyRentalItem }]);
  };

  const handleRemoveItem = (index: number) => {
    setItems((currentItems) => currentItems.length === 1 ? currentItems : currentItems.filter((_, itemIndex) => itemIndex !== index));
  };

  const handleSaveRental = async () => {
    if (isSaving) return;
    if (!selectedCustomerId) {
      setError('Please select a customer.');
      return;
    }
    if (items.some((item) => !item.itemId || !item.name || item.quantity <= 0 || item.rate < 0)) {
      setError('Please select each item and enter a valid quantity.');
      return;
    }
    if (!rentalTo || rentalTo < rentalFrom) {
      setError('Please select a return date after the rental start date.');
      return;
    }

    setIsSaving(true);
    setError('');
    try {
      await addRental({
        customerId: selectedCustomerId,
        items,
        rentalFrom,
        rentalTo,
        advanceAmount,
        totalAmount,
        balanceDue,
        status: 'Active',
        remarks: '',
      });
      router.push('/kirayabook/rentals');
    } catch (e) {
      console.error(e);
      setError('Rental was not saved. Please check your connection and try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      <AppHeader title="New Rental" subtitle="Rental" back switchTo="inventory" />
      <LoadingOverlay show={isSaving} message="Saving rental..." />

      <main className="px-4 py-5 pb-44">
        {error && (
          <div className="mb-4 rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-3 text-base font-medium text-red-100">
            {error}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-16 animate-pulse rounded-lg bg-[#16213E]" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <SearchableSelect
              label="Customer"
              placeholder="Search customer name or mobile"
              options={customerOptions}
              value={selectedCustomerId}
              onChange={setSelectedCustomerId}
              emptyText="No customers found"
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-2 block text-base font-medium text-gray-300">Rental From</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-14 w-full justify-start rounded-lg border-gray-700 bg-[#16213E] text-left text-lg text-white hover:bg-[#1A1A2E]">
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {format(rentalFrom, 'PPP')}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-gray-700 bg-[#16213E] p-0 text-white">
                    <Calendar mode="single" selected={rentalFrom} onSelect={(date) => date && setRentalFrom(date)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>

              <div>
                <label className="mb-2 block text-base font-medium text-gray-300">Return Date</label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="h-14 w-full justify-start rounded-lg border-gray-700 bg-[#16213E] text-left text-lg text-white hover:bg-[#1A1A2E]">
                      <CalendarIcon className="mr-2 h-5 w-5" />
                      {rentalTo ? format(rentalTo, 'PPP') : 'Pick a date'}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto border-gray-700 bg-[#16213E] p-0 text-white">
                    <Calendar mode="single" selected={rentalTo} onSelect={(date) => date && setRentalTo(date)} initialFocus />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-bold">Items</h2>
                <Button type="button" onClick={handleAddItem} className="h-12 rounded-full bg-teal-600 px-5 text-base hover:bg-teal-700">
                  <Plus className="mr-2 h-5 w-5" />
                  Add
                </Button>
              </div>

              {items.map((item, index) => (
                <div key={index} className="space-y-3 rounded-lg border border-gray-700/70 bg-[#16213E] p-4">
                  <SearchableSelect
                    label={`Item ${index + 1}`}
                    placeholder="Search inventory item"
                    options={inventoryOptions}
                    value={item.itemId}
                    onChange={(itemId) => handleSelectInventoryItem(index, itemId)}
                    emptyText="No inventory items found"
                  />
                  <div className="grid grid-cols-[1fr_1fr_auto] gap-3">
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Qty</label>
                      <Input
                        type="number"
                        min={1}
                        value={item.quantity}
                        onChange={(event) => updateItem(index, { quantity: parseInt(event.target.value, 10) || 0 })}
                        className="h-14 rounded-lg border-gray-700 bg-[#1A1A2E] text-lg text-white"
                      />
                    </div>
                    <div>
                      <label className="mb-2 block text-sm text-gray-400">Rate</label>
                      <Input
                        type="number"
                        min={0}
                        value={item.rate}
                        onChange={(event) => updateItem(index, { rate: parseFloat(event.target.value) || 0 })}
                        className="h-14 rounded-lg border-gray-700 bg-[#1A1A2E] text-lg text-white"
                      />
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveItem(index)}
                      className="mt-7 h-14 w-14 text-red-300 hover:bg-red-500/15 hover:text-red-200"
                      aria-label="Remove item"
                    >
                      <Minus className="h-6 w-6" />
                    </Button>
                  </div>
                </div>
              ))}
            </section>

            <div>
              <label className="mb-2 block text-base font-medium text-gray-300">Advance Amount</label>
              <Input
                type="number"
                min={0}
                value={advanceAmount}
                onChange={(event) => setAdvanceAmount(parseFloat(event.target.value) || 0)}
                className="h-14 rounded-lg border-gray-700 bg-[#16213E] text-lg text-white"
              />
            </div>

            <div className="rounded-lg bg-[#16213E] p-4">
              <h2 className="mb-4 text-lg font-bold">Billing Summary</h2>
              <div className="mb-2 flex justify-between text-base text-gray-300">
                <span>Total Amount</span>
                <span>Rs.{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xl font-bold">
                <span>Balance Due</span>
                <span className={balanceDue > 0 ? 'text-red-400' : 'text-teal-300'}>Rs.{balanceDue.toFixed(2)}</span>
              </div>
            </div>
          </div>
        )}
      </main>

      <div className="fixed bottom-24 left-1/2 z-30 w-full max-w-md -translate-x-1/2 px-4">
        <Button onClick={handleSaveRental} disabled={isSaving || isLoading} className="h-14 w-full rounded-xl bg-emerald-500 text-base font-bold text-white hover:bg-emerald-600 disabled:bg-gray-600">
          {isSaving ? 'Saving...' : 'Create Rental'}
        </Button>
      </div>
    </div>
  );
}
