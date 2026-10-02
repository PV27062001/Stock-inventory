'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getRental, updateRental, Rental, RentalItem } from '@/firebase/kirayabook/firestore-service';
import { useInventory } from '@/hooks/use-inventory';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

function EditRentalContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const rentalId = searchParams?.get('rentalId') || '';
  const customerId = searchParams?.get('customerId') || '';
  const { inventory, isLoading: isInventoryLoading } = useInventory();

  const [rental, setRental] = useState<Rental | null>(null);
  
  // Use the RentalItem type for the state to ensure type safety
  const [items, setItems] = useState<RentalItem[]>([{ itemId: '', name: '', quantity: 1, rate: 0 }]);
  const [rentalFrom, setRentalFrom] = useState('');
  const [advanceAmount, setAdvanceAmount] = useState(0);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!rentalId) return;
    getRental(rentalId).then(rental => {
        setRental(rental);
        if (rental) {
            setItems(rental.items.map((item: RentalItem) => {
                const inventoryItem = inventory.find(i => i.name === item.name);
                return { 
                  itemId: item.itemId || inventoryItem?.id || '',
                  name: item.name,
                  quantity: item.quantity,
                  rate: item.rate ?? inventoryItem?.price ?? 0 
                };
            }));
            setRentalFrom(new Date(rental.rentalFrom).toISOString().split('T')[0]);
            setAdvanceAmount(rental.advanceAmount || 0);
            setRemarks(rental.remarks || '');
        }
    });
  }, [rentalId, inventory]);

  const handleItemChange = (index: number, field: keyof RentalItem, value: string | number) => {
    setItems((prevItems) =>
      prevItems.map((item, i) => {
        if (i !== index) return item;

        if (field === 'name') {
          const selectedItem = inventory.find((inv) => inv.name === value);
          return {
            ...item,
            name: value as string,
            itemId: selectedItem?.id || '',
            rate: selectedItem?.price || 0,
          };
        }

        if (field === 'quantity') {
          const parsed = typeof value === 'number' ? value : parseInt(value, 10);
          return { ...item, quantity: isNaN(parsed) ? 0 : parsed };
        }

        if (field === 'rate') {
          const parsed = typeof value === 'number' ? value : parseFloat(value);
          return { ...item, rate: isNaN(parsed) ? 0 : parsed };
        }

        return { ...item, [field]: value as string };
      })
    );
  };

  const addItemField = () => setItems([...items, { itemId: '', name: '', quantity: 1, rate: 0 }]);
  const removeItemField = (index: number) => setItems(items.filter((_, i) => i !== index));

  const handleUpdate = async () => {
    if (!rentalId || !customerId || items.some(i => !i.name) || !rentalFrom) {
      setError('Please fill all required fields: Rented Items and Rental Date.');
      return;
    }
    setIsSaving(true);
    setError('');
    try {
      const validItems = items.filter(i => i.name);
      
      await updateRental(rentalId, {
        items: validItems,
        rentalFrom: new Date(rentalFrom),
        advanceAmount,
        remarks,
      });
      router.push(`/kirayabook/customer/${customerId}`);
    } catch (e) {
      setError('Failed to update rental entry. Please try again.');
      console.error(e);
    }
    setIsSaving(false);
  };
  
  if (isInventoryLoading || !rental) {
      return <div className="text-center text-lg p-10">Loading...</div>
  }

  return (
    <div className="bg-[#1A1A2E] min-h-screen text-white font-sans max-w-md mx-auto">
        <header className="flex items-center p-4 bg-[#16213E] sticky top-0 z-10 border-b border-gray-700/50">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
                <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold ml-4">Edit Rental Entry</h1>
        </header>

        <main className="p-4 pb-24">
            {/* Rented Items Section */}
            <div className="mb-6">
                <h2 className="text-lg font-semibold mb-3">Rented Items</h2>
                <div className="space-y-3">
                {items.map((item, index) => (
                    <div key={index} className="flex items-center gap-2">
                         <Input
                            list="inventory-items"
                            placeholder="Item Name"
                            value={item.name}
                            onChange={(e) => handleItemChange(index, 'name', e.target.value)}
                            className="bg-[#16213E] border-none rounded-lg text-base placeholder-gray-500 flex-grow"
                        />
                        <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value, 10))}
                            className="bg-[#16213E] border-none rounded-lg text-base placeholder-gray-500 w-24"
                            min="1"
                        />
                        <Button variant='destructive' size='icon' onClick={() => removeItemField(index)}><Trash2 className="w-4 h-4"/></Button>
                    </div>
                ))}
                </div>
                <datalist id="inventory-items">
                    {inventory.map(item => <option key={item.id} value={item.name} />)}
                </datalist>
                <Button variant="outline" className='mt-4 w-full' onClick={addItemField}>+ Add Another Item</Button>
            </div>

             {/* Date Section */}
            <div className="mb-6">
                <label className='text-sm text-gray-400 mb-2 block'>Rental From</label>
                <Input type="date" value={rentalFrom} onChange={e => setRentalFrom(e.target.value)} className="bg-[#16213E] border-none rounded-lg text-base"/>
            </div>

            {/* Amount Section */}
             <div className="mb-6">
                <label className='text-sm text-gray-400 mb-2 block'>Advance Amount</label>
                <Input type="number" placeholder='e.g. 1000' value={advanceAmount || ''} onChange={e => setAdvanceAmount(Number(e.target.value))} className="bg-[#16213E] border-none rounded-lg text-base"/>
            </div>

             <div className="mb-6">
                <label className='text-sm text-gray-400 mb-2 block'>Remarks</label>
                <Textarea value={remarks} onChange={e => setRemarks(e.target.value)} className="bg-[#16213E] border-none rounded-lg text-base" placeholder="Any notes about the rental..."/>
            </div>

            {error && <p className="text-red-500 text-sm mt-4 text-center mb-4">{error}</p>}

        </main>
        <div className="fixed bottom-4 inset-x-0 px-4 max-w-md mx-auto">
            <Button onClick={handleUpdate} disabled={isSaving} className="w-full bg-[#1D9E75] hover:bg-emerald-600 text-white font-bold h-16 rounded-xl text-lg">
                {isSaving ? 'Updating Entry...' : 'Update Rental Entry'}
            </Button>
        </div>
    </div>
  );
}

export default function EditRentalPage() {
  return (
    <Suspense fallback={<div className="text-center text-lg p-10 text-white bg-[#1A1A2E] min-h-screen">Loading...</div>}>
      <EditRentalContent />
    </Suspense>
  );
}
