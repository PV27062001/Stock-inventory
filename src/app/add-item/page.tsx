'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useInventory } from '@/firebase/firestore/use-inventory';
import { getSharedBarcode, saveSharedBarcode } from '@/firebase/firestore/barcode-list';
import { useFileUpload } from '@/firebase/storage/use-file-upload';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { AppHeader } from '@/components/app/app-header';
import { LoadingOverlay } from '@/components/app/loading-overlay';
import { BarcodeScanner } from '@/components/app/barcode-scanner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Timestamp } from 'firebase/firestore';
import { Pill, Utensils, Clock, ScanBarcode, Loader2, ChevronDown } from 'lucide-react';
import { Unit } from '@/types';
import { BrandLoader } from '@/components/app/brand-loader';
import { searchGroceries } from '@/lib/grocery-list';
import { MedicineEntry, searchMedicines } from '@/lib/medicine-search';
import { BUILT_IN_SCANNER_BUILD, getNativeBuild, isNativeApp, scanNativeBarcode } from '@/lib/native';
import { parseScannedCode } from '@/lib/scanned-code';

const units: Unit[] = ['g', 'kg', 'l', 'ml', 'units'];

function AddItemContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  // Set when a scan matches an item already in stock, which opens it here for editing.
  const [scannedItemId, setScannedItemId] = useState<string | null>(null);
  const linkedId = searchParams?.get('id') ?? null;
  const editId = scannedItemId ?? linkedId;
  const { user } = useAuthUser();
  const { addItem, updateItem, items } = useInventory();
  const { upload, loading: isUploading } = useFileUpload();
  // Read through refs because a scan finishes long after the render that started it.
  const itemsRef = useRef(items);
  itemsRef.current = items;
  const prefilledIdRef = useRef<string | null>(null);
  const topUpRef = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);

  const [category, setCategory] = useState<'Grocery' | 'Medicine'>('Grocery');
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [medicineSuggestions, setMedicineSuggestions] = useState<MedicineEntry[]>([]);
  const [barcode, setBarcode] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [isLookingUp, setIsLookingUp] = useState(false);
  const [isOpeningScanner, setIsOpeningScanner] = useState(false);
  const [showTypedCode, setShowTypedCode] = useState(false);
  const [typedCode, setTypedCode] = useState('');
  const [scanNote, setScanNote] = useState('');
  const [scannerNotice, setScannerNotice] = useState('');
  const [showMore, setShowMore] = useState(false);
  const [fileInputKey, setFileInputKey] = useState(0);

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

  useEffect(() => {
    if (category !== 'Medicine' || !showSuggestions) {
      setMedicineSuggestions([]);
      return;
    }
    let stale = false;
    searchMedicines(name).then((results) => {
      if (!stale) setMedicineSuggestions(results);
    });
    return () => {
      stale = true;
    };
  }, [category, name, showSuggestions]);

  // Prefill the form when editing an existing item (?id=...).
  useEffect(() => {
    if (!editId || prefilledIdRef.current === editId) return;
    const it = items.find((i) => i.id === editId);
    if (!it) return;
    prefilledIdRef.current = editId;
    setCategory(it.category === 'Medicine' ? 'Medicine' : 'Grocery');
    setName(it.name || '');
    setBarcode(it.barcode || '');
    setQuantity((it.quantity ?? 1) + (topUpRef.current ? 1 : 0));
    topUpRef.current = false;
    if (it.expiryDate || it.lowStockThreshold != null || it.imageUrl) setShowMore(true);
    if (it.unit) setUnit(it.unit);
    if (it.lowStockThreshold != null) setLowStockThreshold(it.lowStockThreshold);
    if (it.dosage != null) setDosage(it.dosage);
    if (it.dailyAlert != null) setDailyAlert(it.dailyAlert);
    if (it.reminderTimes?.length) setReminderTimes(it.reminderTimes);
    if (it.expiryDate) {
      const raw = it.expiryDate as { toDate?: () => Date };
      const d = raw?.toDate ? raw.toDate() : new Date(it.expiryDate as unknown as string);
      if (!isNaN(d.getTime())) setExpiryDate(d.toISOString().slice(0, 10));
    }
  }, [editId, items]);

  const handleReminderTimeChange = (index: number, value: string) => {
    const newReminderTimes = [...reminderTimes];
    newReminderTimes[index] = value;
    setReminderTimes(newReminderTimes);
  };

  const startScan = async () => {
    if (!isNativeApp()) {
      setIsScanning(true);
      return;
    }
    setIsOpeningScanner(true);
    const build = await getNativeBuild().catch(() => null);
    if ((build ?? 0) < BUILT_IN_SCANNER_BUILD) {
      setIsOpeningScanner(false);
      setScannerNotice('Update the app for a much better scanner. This older one may not read barcodes.');
      setIsScanning(true);
      return;
    }
    const result = await scanNativeBarcode();
    setIsOpeningScanner(false);
    if (result?.code) handleScanned(result.code);
    else if (result?.typed) setShowTypedCode(true);
    else if (result?.error) {
      setShowTypedCode(true);
      setScanNote(`Scanner problem: ${result.error}. Type the number under the barcode instead.`);
    }
  };

  const handleScanned = (raw: string) => {
    const scanned = parseScannedCode(raw);
    if (!scanned) {
      setIsScanning(false);
      setScanNote('This code has no product number. Scan the barcode with lines, or type the name.');
      return;
    }
    handleBarcode(scanned.code, scanned.expiry);
  };

  const handleBarcode = async (code: string, scannedExpiry?: string) => {
    setIsScanning(false);
    setShowTypedCode(false);
    setTypedCode('');
    // Already stocked: open that item with one more added, so it is topped up, not duplicated.
    const existing = itemsRef.current.find((item) => item.barcode === code);
    if (existing) {
      setScanNote('Already in your stock, so 1 was added. Change the quantity if needed.');
      topUpRef.current = true;
      setScannedItemId(existing.id);
      return;
    }

    setBarcode(code);
    setScanNote('');
    if (scannedExpiry) {
      setExpiryDate(scannedExpiry);
      setShowMore(true);
    }
    let found = false;
    setIsLookingUp(true);
    try {
      const shared = await getSharedBarcode(code);
      if (shared) {
        found = true;
        setName(shared.name);
        setCategory(shared.category);
        setScanNote('Found in your family list. Check the name, then add it.');
        return;
      }
      const res = await fetch(`/api/product-lookup?code=${code}`);
      const product = await res.json();
      if (product.found) {
        found = true;
        setName(product.name);
        setScanNote('Product found. Check the name, then add it.');
      } else if (product.unavailable) {
        setScanNote('Could not look this up right now. Type the name and the family list will remember it.');
      } else {
        setScanNote('Not in the product database. Type the name once and the family list will remember it.');
      }
    } catch {
      setScanNote('Could not look this up right now. Type the name and the family list will remember it.');
    } finally {
      setIsLookingUp(false);
      if (!found) nameRef.current?.focus();
    }
  };

  const resetForm = () => {
    setScannedItemId(null);
    prefilledIdRef.current = null;
    setName('');
    setBarcode('');
    setQuantity(1);
    setUnit('units');
    setExpiryDate('');
    setLowStockThreshold('');
    setDosage(1);
    setDailyAlert(false);
    setReceipt(null);
    setFileInputKey((key) => key + 1);
    setShowMore(false);
  };

  const saveItem = async (scanNext: boolean) => {
    if (!user || isSaving) return;
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
      };
      if (imageUrl) newItem.imageUrl = imageUrl;

      if (barcode) newItem.barcode = barcode;
      if (category === 'Grocery') {
        newItem.unit = unit;
      } else if (category === 'Medicine') {
        newItem.dosage = Number(dosage) || null;
        newItem.dailyAlert = dailyAlert;
        if(dailyAlert) {
          newItem.reminderTimes = reminderTimes;
        }
      }

      if (editId) {
        await updateItem(editId, newItem);
      } else {
        await addItem(newItem);
      }
      if (barcode) saveSharedBarcode(barcode, { name, category }, user.uid);
      if (scanNext) {
        resetForm();
        setScanNote(`${name} saved. Scan the next pack.`);
        setIsSaving(false);
        startScan();
        return;
      }
      // Land on the Inventory section (not the default Gold rates tab).
      router.push('/inventory#inventory');
    } catch (error) {
      logger.error("Error saving item:", error);
      setError('Item was not saved. Please check the details and try again.');
      setIsSaving(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveItem(false);
  };

  const saveAndScanNext = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (e.currentTarget.form?.reportValidity()) saveItem(true);
  };

  const grocerySuggestions = category === 'Grocery' ? searchGroceries(name) : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <AppHeader title={editId ? 'Edit Inventory' : 'Add Inventory'} subtitle="Home Stock" back backHref="/inventory#inventory" switchTo="rental" />
      <LoadingOverlay show={isSaving || isUploading} message="Saving inventory..." />
      {isScanning && <BarcodeScanner onDetected={handleScanned} onClose={() => setIsScanning(false)} notice={scannerNotice} />}

      <main className="px-4 py-5 pb-24">
        {error && <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/15 px-4 py-3 text-base text-destructive">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-6 rounded-lg bg-card p-4">
          {/* Category Selection */}
          <div className="space-y-2">
            <Label className="text-base text-muted-foreground">What are you adding?</Label>
            <div className="grid grid-cols-2 gap-4">
              <Button type="button" variant={category === 'Grocery' ? 'default' : 'outline'} className="h-12 gap-2 text-base" onClick={() => setCategory('Grocery')}>
                <Utensils/>
                Grocery
              </Button>
               <Button type="button" variant={category === 'Medicine' ? 'default' : 'outline'} className="h-12 gap-2 text-base" onClick={() => setCategory('Medicine')}>
                <Pill/>
                Medicine
              </Button>
            </div>
          </div>

          <>
             {!editId && (
                <div className="space-y-2">
                  <Button type="button" disabled={isLookingUp || isOpeningScanner} onClick={startScan} className="h-14 w-full gap-2 rounded-xl text-lg font-bold">
                    {isLookingUp || isOpeningScanner ? <Loader2 className="h-5 w-5 animate-spin" /> : <ScanBarcode className="h-5 w-5" />}
                    {isLookingUp ? 'Looking up product…' : isOpeningScanner ? 'Opening scanner…' : 'Scan barcode'}
                  </Button>
                  {showTypedCode ? (
                    <div className="flex gap-2">
                      <Input
                        value={typedCode}
                        onChange={(e) => setTypedCode(e.target.value.replace(/\D/g, ''))}
                        inputMode="numeric"
                        placeholder="Number under the barcode"
                        aria-label="Barcode number"
                      />
                      <Button type="button" disabled={!/^\d{8,14}$/.test(typedCode) || isLookingUp} onClick={() => handleBarcode(typedCode)} className="shrink-0">Look up</Button>
                    </div>
                  ) : (
                    <button type="button" onClick={() => setShowTypedCode(true)} className="min-h-11 w-full text-sm font-semibold text-primary">Type barcode number</button>
                  )}
                </div>
              )}
              {scanNote && <p role="status" className="rounded-lg bg-primary/10 px-3 py-2 text-sm text-foreground">{scanNote}</p>}

             {/* Common Fields */}
              <div className="space-y-2 relative">
                <Label htmlFor="name">{category} Name</Label>
                <Input
                  id="name"
                  ref={nameRef}
                  value={name}
                  onChange={(e) => { setName(e.target.value); setShowSuggestions(true); }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
                  placeholder={category === 'Grocery' ? 'e.g., Maida, Rava, Rice' : 'e.g., Paracetamol'}
                  autoComplete="off"
                  required
                />
                {category === 'Grocery' && showSuggestions && grocerySuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
                    {grocerySuggestions.map((g) => (
                      <button
                        type="button"
                        key={g.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setName(g.name); setShowSuggestions(false); }}
                        className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-secondary"
                      >
                        <span className="text-xl">{g.emoji}</span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{g.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{g.ta}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
                {showSuggestions && medicineSuggestions.length > 0 && (
                  <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
                    {medicineSuggestions.map((m) => (
                      <button
                        type="button"
                        key={m.name}
                        onMouseDown={(e) => e.preventDefault()}
                        onClick={() => { setName(m.name); setShowSuggestions(false); }}
                        className="flex w-full items-center gap-3 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-secondary"
                      >
                        <span className="text-xl">💊</span>
                        <div className="min-w-0">
                          <p className="truncate font-semibold text-foreground">{m.name}</p>
                          <p className="truncate text-xs text-muted-foreground">{m.composition}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
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
                         <Select onValueChange={(value) => setUnit(value as Unit)} value={unit}>
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

              {/* Optional details stay folded away so a pack is quick to add. */}
              <button type="button" aria-expanded={showMore} onClick={() => setShowMore((open) => !open)} className="flex min-h-11 w-full items-center justify-between text-base font-semibold text-primary">
                More details
                <ChevronDown className={`h-5 w-5 transition-transform ${showMore ? 'rotate-180' : ''}`} />
              </button>
              {showMore && (
                <div className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="expiryDate">Expiry Date (Optional)</Label>
                    <Input id="expiryDate" type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} />
                    {barcode && !expiryDate && <p className="text-xs text-muted-foreground">Barcodes don't include the expiry date. Copy it from the pack.</p>}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lowStockThreshold">Low Stock Alert Threshold (Optional)</Label>
                    <Input id="lowStockThreshold" type="number" value={lowStockThreshold} onChange={(e) => setLowStockThreshold(e.target.value === '' ? '' : Number(e.target.value))} placeholder="e.g., 5" />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="receipt">Image (Optional)</Label>
                    <Input key={fileInputKey} id="receipt" type="file" accept="image/*" onChange={(e) => setReceipt(e.target.files ? e.target.files[0] : null)} className="flex-1" />
                  </div>
                </div>
              )}

              <Button type="submit" className="h-12 w-full rounded-xl bg-emerald-500 text-base font-bold hover:bg-emerald-600" disabled={isUploading || isSaving}>
                {isSaving || isUploading ? 'Saving...' : editId ? 'Update item' : `Add ${category}`}
              </Button>
              {!linkedId && (
                <Button type="button" variant="outline" onClick={saveAndScanNext} className="h-12 w-full gap-2 rounded-xl text-base font-bold" disabled={isUploading || isSaving}>
                  <ScanBarcode className="h-5 w-5" /> Save & scan next
                </Button>
              )}
          </>
        </form>
      </main>
    </div>
  );
}

export default function AddItemPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <AddItemContent />
    </Suspense>
  );
}
