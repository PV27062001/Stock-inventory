'use client';

import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getCustomerById, updateCustomer, Customer, CustomerTooLargeError } from '@/firebase/kirayabook/firestore-service';
import { uploadFile } from '@/firebase/kirayabook/storage-service'; // Assuming this exists and works
import { ArrowLeft, Camera, Upload, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useMemo } from 'react'; // Import useMemo
import React from 'react';
import { BrandLoader } from '@/components/app/brand-loader';
import { isUsablePhoto } from '@/firebase/kirayabook/storage-service';
import { PROFESSIONS } from '@/lib/professions';
import { MobileField } from '@/components/kirayabook/mobile-field';
import { isValidMobile, mobileError } from '@/lib/phone';

export default function EditCustomerPage() {
  const router = useRouter();
  const params = useParams();
  const customerId = (params?.id as string) || '';

  const [customer, setCustomer] = useState<Partial<Customer>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [showProfessionSuggestions, setShowProfessionSuggestions] = useState(false);
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [licenceFile, setLicenceFile] = useState<File | null>(null);

  const photoInputRef = React.useRef<HTMLInputElement>(null);
  const aadhaarInputRef = React.useRef<HTMLInputElement>(null);
  const panInputRef = React.useRef<HTMLInputElement>(null);
  const licenceInputRef = React.useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!customerId) {
        setIsLoading(false);
        return;
    };
    
    setIsLoading(true);
    getCustomerById(customerId).then(cust => {
        if(cust) setCustomer(cust);
        setIsLoading(false);
    }).catch(e => {
        setError('Failed to load customer data.');
        logger.error(e);
        setIsLoading(false);
    });
  }, [customerId]);

  const handleUpdate = async () => {
      if(!customer.name) {
          setError('Name is required.');
          return;
      }
      if (!isValidMobile(customer.mobile || '')) {
          setError(mobileError(customer.mobile || ''));
          return;
      }
      setIsSaving(true);
      setError('');

      try {
        const uploadTasks = [
            { file: photoFile, key: 'photoUrl' },
            { file: aadhaarFile, key: 'aadhaarPhotoUrl' },
            { file: panFile, key: 'panPhotoUrl' },
            { file: licenceFile, key: 'drivingLicencePhotoUrl' }
        ];

        const uploadPromises = uploadTasks
            .filter(task => task.file)
            .map(task => uploadFile(task.file!).then(url => ({ key: task.key, url })));

        const uploadedPhotos = await Promise.all(uploadPromises);

        const newPhotoUrls: Partial<Customer> = {};
        uploadedPhotos.forEach(p => {
            // Ensure the key is a valid property of Customer
            if (p.key === 'photoUrl' || p.key === 'aadhaarPhotoUrl' || p.key === 'panPhotoUrl' || p.key === 'drivingLicencePhotoUrl') {
                 newPhotoUrls[p.key] = p.url;
            }
        });

        // Firestore rejects undefined, which "Undo verified" can produce.
        const updates = Object.fromEntries(
            Object.entries({ ...customer, ...newPhotoUrls }).filter(([, v]) => v !== undefined)
        ) as Partial<Customer>;

        await updateCustomer(customerId, updates);
        
        setIsSaving(false);
        router.back();
    } catch (e) {
        setError(e instanceof CustomerTooLargeError ? e.message : 'Failed to save changes. Please try again.');
        logger.error(e);
        setIsSaving(false);
    }
  }
  
  const handleInputChange = (field: keyof Customer, value: string) => {
    setCustomer(prev => ({...prev, [field]: value}))
  }

  const professionQuery = customer.profession || '';
  const professionSuggestions = professionQuery
    ? PROFESSIONS.filter((p) => p.en.toLowerCase().includes(professionQuery.toLowerCase()) || p.ta.includes(professionQuery))
    : PROFESSIONS;

  if (isLoading) {
    return <BrandLoader label="Loading customer…" />;
  }

  return (
    <div className="bg-background min-h-screen text-foreground font-sans max-w-md mx-auto">
        <header className="flex items-center p-4 bg-card sticky top-0 z-10 border-b border-border">
            <Button variant="ghost" size="icon" onClick={() => router.back()}>
            <ArrowLeft className="w-6 h-6" />
            </Button>
            <h1 className="text-xl font-bold ml-4">Edit Customer</h1>
        </header>

        <main className="p-4 pb-44">
            <div className="space-y-4">
                <div className="flex justify-center mb-8">
                    <input type="file" accept="image/*" ref={photoInputRef} onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="hidden" />
                    <button onClick={() => photoInputRef.current?.click()} className="w-32 h-32 rounded-full bg-card flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border">
                        {photoFile ? <img src={URL.createObjectURL(photoFile)} alt="Preview" className='w-full h-full object-cover rounded-full'/> : (isUsablePhoto(customer.photoUrl) ? <img src={customer.photoUrl} alt="Customer Photo" className='w-full h-full object-cover rounded-full'/> : <><Camera className="w-8 h-8 mb-1"/><span className='text-xs'>Upload Photo</span></>)}
                    </button>
                </div>

                 <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Name</label>
                    <Input value={customer.name || ''} onChange={(e) => handleInputChange('name', e.target.value)} className="bg-background border-border rounded-lg text-base" />
                </div>
                <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Mobile</label>
                    <MobileField
                        value={customer.mobile || ''}
                        onChange={(v) => handleInputChange('mobile', v)}
                        verifiedAt={customer.mobileVerifiedAt}
                        onVerifiedChange={(verifiedAt) =>
                            setCustomer((prev) => ({
                                ...prev,
                                mobileVerifiedAt: verifiedAt,
                                mobileVerifyMethod: verifiedAt ? 'contacted' : undefined,
                            }))
                        }
                        showError={!!error}
                        className="bg-background border-border rounded-lg text-base h-14 w-full px-4"
                    />
                </div>
                <div className="relative">
                    <label className="text-sm text-muted-foreground mb-2 block">Profession</label>
                    <Input
                        placeholder="e.g. Mason, Painter, Electrician"
                        value={customer.profession || ''}
                        onChange={(e) => handleInputChange('profession', e.target.value)}
                        onFocus={() => setShowProfessionSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowProfessionSuggestions(false), 150)}
                        autoComplete="off"
                        className="bg-background border-border rounded-lg text-base"
                    />
                    {showProfessionSuggestions && professionSuggestions.length > 0 && (
                        <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
                            {professionSuggestions.map((p) => (
                                <button
                                    type="button"
                                    key={p.en}
                                    onMouseDown={(e) => e.preventDefault()}
                                    onClick={() => { handleInputChange('profession', p.en); setShowProfessionSuggestions(false); }}
                                    className="flex w-full flex-col items-start gap-0.5 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-secondary"
                                >
                                    <p className="font-semibold text-foreground">{p.en}</p>
                                    <p className="text-xs text-muted-foreground">{p.ta}</p>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Address</label>
                    <Input value={customer.address || ''} onChange={(e) => handleInputChange('address', e.target.value)} className="bg-background border-border rounded-lg text-base" />
                </div>
                
                <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Aadhaar</label>
                    <div className='flex items-center gap-2'>
                        <Input value={customer.aadhaar || ''} onChange={(e) => handleInputChange('aadhaar', e.target.value)} className="bg-background border-border rounded-lg text-base" />
                        <input type="file" accept="image/*" ref={aadhaarInputRef} onChange={e => setAadhaarFile(e.target.files?.[0] || null)} className="hidden" />
                        <Button variant='outline' size='icon' onClick={() => aadhaarInputRef.current?.click()} className="border-border bg-card hover:bg-secondary"><Upload className='w-5 h-5 text-muted-foreground'/></Button>
                    </div>
                    <div className='mt-2'>
                        {aadhaarFile ? <img src={URL.createObjectURL(aadhaarFile)} alt="Aadhaar Preview" className="w-full h-auto rounded-lg" /> 
                        : (customer.aadhaarPhotoUrl && <a href={customer.aadhaarPhotoUrl} target='_blank' rel='noopener noreferrer'><img src={customer.aadhaarPhotoUrl} alt="Uploaded Aadhaar" className="w-full h-auto rounded-lg" /></a>) }
                    </div>
                </div>

                <div>
                    <label className="text-sm text-muted-foreground mb-2 block">PAN</label>
                    <div className='flex items-center gap-2'>
                        <Input value={customer.pan || ''} onChange={(e) => handleInputChange('pan', e.target.value)} className="bg-background border-border rounded-lg text-base" />
                        <input type="file" accept="image/*" ref={panInputRef} onChange={e => setPanFile(e.target.files?.[0] || null)} className="hidden" />
                        <Button variant='outline' size='icon' onClick={() => panInputRef.current?.click()} className="border-border bg-card hover:bg-secondary"><Upload className='w-5 h-5 text-muted-foreground'/></Button>
                    </div>
                    <div className='mt-2'>
                        {panFile ? <img src={URL.createObjectURL(panFile)} alt="PAN Preview" className="w-full h-auto rounded-lg" /> 
                        : (customer.panPhotoUrl && <a href={customer.panPhotoUrl} target='_blank' rel='noopener noreferrer'><img src={customer.panPhotoUrl} alt="Uploaded PAN" className="w-full h-auto rounded-lg" /></a>) }
                    </div>
                </div>

                 <div>
                    <label className="text-sm text-muted-foreground mb-2 block">Driving Licence</label>
                    <div className='flex items-center gap-2'>
                        <Input value={customer.drivingLicence || ''} onChange={(e) => handleInputChange('drivingLicence', e.target.value)} className="bg-background border-border rounded-lg text-base" />
                        <input type="file" accept="image/*" ref={licenceInputRef} onChange={e => setLicenceFile(e.target.files?.[0] || null)} className="hidden" />
                        <Button variant='outline' size='icon' onClick={() => licenceInputRef.current?.click()} className="border-border bg-card hover:bg-secondary"><Upload className='w-5 h-5 text-muted-foreground'/></Button>
                    </div>
                    <div className='mt-2'>
                        {licenceFile ? <img src={URL.createObjectURL(licenceFile)} alt="Licence Preview" className="w-full h-auto rounded-lg" /> 
                        : (customer.drivingLicencePhotoUrl && <a href={customer.drivingLicencePhotoUrl} target='_blank' rel='noopener noreferrer'><img src={customer.drivingLicencePhotoUrl} alt="Uploaded Licence" className="w-full h-auto rounded-lg" /></a>) }
                    </div>
                </div>
            </div>

             {error && <p className="text-destructive text-sm mt-4 text-center mb-4">{error}</p>}

            <div className="fixed bottom-24 inset-x-0 px-4 max-w-md mx-auto z-50">
                <Button onClick={handleUpdate} disabled={isSaving} className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-bold h-16 rounded-xl text-lg shadow-elevated">
                    {isSaving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving…</> : 'Save Changes'}
                </Button>
            </div>
        </main>
    </div>
  );
}
