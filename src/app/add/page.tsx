'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useLanguage } from '@/hooks/use-language';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { useRouter } from 'next/navigation';
import { Switch } from '@/components/ui/switch';
import { Camera, Loader2 } from 'lucide-react';
import { processReceipt } from '@/ai/flows/receipt-processor';
import { useFirestore, useUser } from '@/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { withAuth } from '@/components/Auth/with-auth';
import { PageHeader, headerButtonClass } from '@/components/ui/page-header';

function AddItemPage() {
  const { t } = useLanguage();
  const router = useRouter();
  const db = useFirestore();
  const { user } = useUser();
  
  const [isMedicine, setIsMedicine] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Form State
  const [name, setName] = useState('');
  const [qty, setQty] = useState('');
  const [unit, setUnit] = useState('pcs');
  const [category, setCategory] = useState('groceries');
  const [threshold, setThreshold] = useState('10');
  const [dosage, setDosage] = useState('1');

  const handleSave = async () => {
    if (!user || !name || !qty) return;
    setIsSaving(true);
    
    try {
      const itemData = {
        name,
        quantity: parseFloat(qty),
        unit,
        category,
        lowStockThreshold: parseFloat(threshold),
        isMedicine,
        lastUpdated: serverTimestamp(),
        ...(isMedicine ? { dosage: { frequencyPerDay: parseInt(dosage), notes: '' } } : {})
      };

      const inventoryRef = collection(db, 'users', user.uid, 'inventory');
      await addDoc(inventoryRef, itemData);
      router.push('/');
    } catch (err) {
      logger.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsScanning(true);
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUri = event.target?.result as string;
      try {
        const result = await processReceipt({ photoDataUri: dataUri });
        if (result.items.length > 0) {
          const item = result.items[0];
          setName(item.name);
          setQty(item.quantity.toString());
          setCategory(item.category);
        }
      } catch (err) {
        logger.error("Scanning failed", err);
      } finally {
        setIsScanning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <>
      <PageHeader
        title={t('addItem')}
        actions={
        <div className="relative">
          <Input 
            type="file" 
            accept="image/*" 
            className="hidden" 
            id="receipt-upload" 
            onChange={handleFileUpload}
            disabled={isScanning}
          />
          <Label 
            htmlFor="receipt-upload" 
            className={`${headerButtonClass()} cursor-pointer`}
          >
            {isScanning ? <Loader2 className="animate-spin" /> : <Camera />}
            {t('scanReceipt')}
          </Label>
        </div>
        }
      />

      <main className="p-4">
      <Card className="p-4 space-y-6 border-none shadow-sm">
        <div className="space-y-4">
          <Label htmlFor="name" className="text-base font-semibold">{t('itemName')}</Label>
          <Input 
            id="name" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Milk, Paracetamol" 
            className="h-12 text-base rounded-xl bg-muted/50 border-none px-5"
          />
        </div>

        <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
          <Label htmlFor="is-med" className="text-base font-semibold">{t('isMedicine')}</Label>
          <Switch id="is-med" checked={isMedicine} onCheckedChange={setIsMedicine} />
        </div>

        {isMedicine && (
          <div className="space-y-4 p-4 bg-primary/5 rounded-2xl border border-primary/10 animate-in fade-in slide-in-from-top-2">
            <Label className="text-base font-semibold flex items-center gap-2">
              {t('dosage')}
            </Label>
            <div className="flex items-center gap-4">
              <Input 
                type="number" 
                value={dosage}
                onChange={(e) => setDosage(e.target.value)}
                className="h-12 w-24 text-center text-lg font-bold rounded-xl"
              />
              <span className="text-muted-foreground">{t('timesPerDay')}</span>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <div className="space-y-4">
            <Label htmlFor="qty" className="text-base font-semibold">{t('quantity')}</Label>
            <Input 
              id="qty" 
              type="number" 
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              placeholder="0" 
              className="h-12 text-lg text-center font-bold rounded-xl bg-muted/50 border-none"
            />
          </div>
          <div className="space-y-4">
            <Label htmlFor="unit" className="text-base font-semibold">{t('unit')}</Label>
            <Select value={unit} onValueChange={setUnit}>
              <SelectTrigger id="unit" className="h-12 text-base rounded-xl bg-muted/50 border-none px-5">
                <SelectValue placeholder="Unit" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="kg">kg</SelectItem>
                <SelectItem value="liters">liters</SelectItem>
                <SelectItem value="packets">packets</SelectItem>
                <SelectItem value="pcs">pcs</SelectItem>
                <SelectItem value="boxes">boxes</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="space-y-4">
          <Label className="text-base font-semibold">{t('lowStockAlert')}</Label>
          <div className="flex items-center gap-4">
            <Input 
              type="number" 
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
              className="h-12 w-24 text-center text-lg font-bold rounded-xl bg-muted/50 border-none"
            />
            <span className="text-muted-foreground">{unit}</span>
          </div>
        </div>

        <div className="space-y-4">
          <Label htmlFor="category" className="text-base font-semibold">{t('category')}</Label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger id="category" className="h-12 text-base rounded-xl bg-muted/50 border-none px-5">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="groceries">{t('groceries')}</SelectItem>
              <SelectItem value="medicines">{t('medicines')}</SelectItem>
              <SelectItem value="vegetables">{t('vegetables')}</SelectItem>
              <SelectItem value="kitchen">{t('kitchen')}</SelectItem>
              <SelectItem value="household">{t('household')}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="pt-6 flex flex-col gap-4">
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !name || !qty}
            className="h-12 text-xl font-bold rounded-2xl shadow-lg"
          >
            {isSaving ? <Loader2 className="w-6 h-6 animate-spin" /> : t('save')}
          </Button>
          <Button variant="ghost" onClick={() => router.back()} className="h-12 text-lg rounded-2xl text-muted-foreground">
            {t('cancel')}
          </Button>
        </div>
      </Card>
      </main>
    </>
  );
}

export default withAuth(AddItemPage);
