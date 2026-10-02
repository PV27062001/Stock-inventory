
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useInventory } from '@/firebase/firestore/use-inventory';
import { useFileUpload } from '@/firebase/storage/use-file-upload';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { AppHeader } from '@/components/app/app-header';
import { LoadingOverlay } from '@/components/app/loading-overlay';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Timestamp } from 'firebase/firestore';
import { Upload, Pill, Utensils, Clock } from 'lucide-react';
import { Unit } from '@/types';

const units: Unit[] = ['g', 'kg', 'l', 'ml', 'units'];

export default function AddItemPage() {
  const router = useRouter();
  const { user } = useAuthUser();
  const { addItem } = useInventory();
  const { upload, loading: isUploading } = useFileUpload();
  
  const [category, setCategory] = useState<'Grocery' | 'Medicine' | '' >('');
  const [name, setName] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [unit, setUnit] = useState<Unit>('units');
  const [expiryDate, setExpiryDate] = useState('');
  const [lowStockThreshold, setLowStockThreshold] = useState<number | '' >('');
  const [dosage, setDosage] = useState<number | ''>(1);
  const [dailyAlert, setDailyAlert] = useState(false);
  const [reminderTimes, setReminderTimes] = useState<string[]>(['09:00']);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const numDosage = Number(dosage || 1);
    if (dailyAlert) {
      const newReminderTimes = Array.from({ length: numDosage }, (_, i) => {
        return reminderTimes[i] || `${String(9 + i * 2).padStart(2, '0')}:00`;
      });
      setReminderTimes(newReminderTimes);
    } else {
        setReminderTimes([]);
    }
  }, [dailyAlert, dosage]);

  const handleReminderTimeChange = (index: number, value: string) => {
    const newReminderTimes = [...reminderTimes];
    newReminderTimes[index] = value;
    setReminderTimes(newReminderTimes);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !category || isSaving) return;
    setIsSaving(true);
    setError('');

    try {
      let imageUrl: string | undefined;
      if (receipt) {
        imageUrl = await upload(receipt, `receipts/${user.uid}/${Date.now()}_${receipt.name}`);
      }

      const newItem: any = {
        name,
        quantity,
        category,
        expiryDate: expiryDate ? Timestamp.fromDate(new Date(expiryDate)) : null,
        lowStockThreshold: Number(lowStockThreshold) || null,
        imageUrl: imageUrl || null,
      };

      if (category === 'Grocery') {
        newItem.unit = unit;
      } else if (category === 'Medicine') {
        newItem.dosage = Number(dosage) || null;
        newItem.dailyAlert = dailyAlert;
        if(dailyAlert) {
          newItem.reminderTimes = reminderTimes;
        }
      }

      await addItem(newItem);
      router.push('/inventory');
    } catch (error) {
      console.error("Error adding item:", error);
      setError('Item was not saved. Please check the details and try again.');
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#1A1A2E] text-white">
      <AppHeader title="Add Inventory" subtitle="Home Stock" back switchTo="rental" />
      <LoadingOverlay show={isSaving || isUploading} message="Saving inventory..." />

      <main className="px-4 py-5 pb-24">
        {error && <p className="mb-4 rounded-lg border border-red-400/40 bg-red-500/15 px-4 py-3 text-base text-red-100">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-[#16213E] p-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-base text-gray-200">What are you adding?</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant={category === 'Grocery' ? 'default' : 'outline'} className="h-20 flex-col gap-2 text-base" onClick={() => setCategory('Grocery')}>
                <Utensils/>
                Grocery
              </Button>
               <Button type="button" variant={category === 'Medicine' ? 'default' : 'outline'} className="h-20 flex-col gap-2 text-base" onClick={() => setCategory('Medicine')}>
                <Pill/>
                Medicine
              </Button>
            </div>
          </div>

          {category && (
            <>
             {/* Common Fields */}
              <div className="space-y-2">
                <Label htmlFor="name">{category} Name</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={category === 'Grocery' ? 'e.g., Tomatoes' : 'e.g., Paracetamol'} required />
              </div>

              {/* Grocery-Specific Fields */}
              {category === 'Grocery' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity</Label>
                        <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                         <Select onValueChange={(value) => setUnit(value as Unit)} defaultValue="units">
                            <SelectTrigger id="unit">
                                <SelectValue/>
                            </SelectTrigger>
                            <SelectContent>
                                {units.map((u) => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
              )}

              {/* Medicine-Specific Fields */}
              {category === 'Medicine' && (
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="quantity">Quantity (pills)</Label>
                        <Input id="quantity" type="number" value={quantity} onChange={(e) => setQuantity(Number(e.target.value))} min="1" required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="dosage">Dosage (per day)</Label>
                        <Input id="dosage" type="number" value={dosage} onChange={(e) => setDosage(Number(e.target.value))} min="1" />
                    </div>
                </div>
              )}

              {/* More Common Fields */}
               <div className="space-y-2">
                <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
              </div>

               <div className="space-y-2">
                <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold (Optional)</Label>
                <Input id="lowStockThreshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 5" />
              </div>
              
              {category === 'Medicine' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <Label htmlFor="dailyAlert" className="font-medium">Enable consumption reminders</Label>
                        <p className="text-xs text-muted-foreground">Set reminders for each dose.</p>
                      </div>
                      <Switch id="dailyAlert" checked={dailyAlert} onCheckedChange={setDailyAlert} />
                  </div>
                  {dailyAlert && (
                     <div className="space-y-4 rounded-lg border p-4">
                        <Label>Reminder Times</Label>
                        {reminderTimes.map((time, index) => (
                            <div key={index} className="flex items-center gap-2">
                               <Clock className="w-4 h-4 text-muted-foreground"/>
                               <Input id={`reminderTime-${index}`} type="time" value={time} onChange={(e) => handleReminderTimeChange(index, e.target.value)} required />
                            </div>
                        ))}
                      </div>
                  )}
                </div>
              )}

              {/* Image Upload - still optional */}
              <div className="space-y-2">
                <Label htmlFor="receipt">Image (Optional)</Label>
                <Input id="receipt" type="file" accept="image/*" onChange={(e) => setReceipt(e.target.files ? e.target.files[0] : null)} className="flex-1" />
              </div>

              <Button type="submit" className="h-14 w-full rounded-xl bg-emerald-500 text-base font-bold hover:bg-emerald-600" disabled={isUploading || isSaving || !category}>
                {isSaving || isUploading ? 'Saving...' : `Add ${category}`}
              </Button>
            </>
          )}
        </form>
      </main>
    </div>
  );
}
