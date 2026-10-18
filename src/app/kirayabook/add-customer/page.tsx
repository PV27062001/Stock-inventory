'use client';

import { logger } from '@/lib/logger';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addCustomer } from '@/firebase/kirayabook/firestore-service';
import { uploadFile } from '@/firebase/kirayabook/storage-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload, Loader2 } from 'lucide-react';
import { PROFESSIONS } from '@/lib/professions';
import { MobileField } from '@/components/kirayabook/mobile-field';
import { isValidMobile, mobileError } from '@/lib/phone';

export default function AddCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
  const [mobileVerifiedAt, setMobileVerifiedAt] = useState<Date | undefined>(undefined);
  const [profession, setProfession] = useState('');
  const [showProfessionSuggestions, setShowProfessionSuggestions] = useState(false);
  const [address, setAddress] = useState('');
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [licence, setLicence] = useState('');
  
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);
  const [panFile, setPanFile] = useState<File | null>(null);
  const [licenceFile, setLicenceFile] = useState<File | null>(null);

  const [error, setError] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const photoInputRef = useRef<HTMLInputElement>(null);
  const aadhaarInputRef = useRef<HTMLInputElement>(null);
  const panInputRef = useRef<HTMLInputElement>(null);
  const licenceInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    if (!name) {
      setError('Full Name is required.');
      return;
    }
    if (!isValidMobile(mobile)) {
      setError(mobileError(mobile));
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

        const newPhotoUrls: { [key: string]: string } = {};
        uploadedPhotos.forEach(p => {
            newPhotoUrls[p.key] = p.url;
        });

      // Only spread uploaded photo keys so Firestore never receives undefined fields.
      await addCustomer({
          name, mobile, profession, address, aadhaar, pan, drivingLicence: licence,
          ...(mobileVerifiedAt ? { mobileVerifiedAt, mobileVerifyMethod: 'contacted' as const } : {}),
          ...newPhotoUrls,
      });

      router.push('/kirayabook');
    } catch (e) {
      setError('Failed to save customer. Please try again.');
      logger.error(e);
    }
    setIsSaving(false);
  };

  const professionSuggestions = profession
    ? PROFESSIONS.filter((p) => p.en.toLowerCase().includes(profession.toLowerCase()) || p.ta.includes(profession))
    : PROFESSIONS;

  return (
    <div className="p-4 bg-background min-h-screen text-foreground">
      <header className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Add New Customer</h1>
      </header>

      <div className="space-y-6">
        <div className="flex justify-center mb-8">
            <input type="file" accept="image/*" ref={photoInputRef} onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => photoInputRef.current?.click()} className="w-32 h-32 rounded-full bg-card flex flex-col items-center justify-center text-muted-foreground border-2 border-dashed border-border shadow-soft transition-shadow hover:shadow-elevated">
                {photoFile ? <img src={URL.createObjectURL(photoFile)} alt="Preview" className='w-full h-full object-cover rounded-full'/> : <><Camera className="w-8 h-8 mb-1"/><span className='text-xs'>Upload Photo</span></>}
            </button>
        </div>

        <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-card border border-border/60 h-14 rounded-xl text-lg w-full px-4 placeholder:text-muted-foreground shadow-soft transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary focus-visible:shadow-elevated" />
        <MobileField
          value={mobile}
          onChange={setMobile}
          verifiedAt={mobileVerifiedAt}
          onVerifiedChange={setMobileVerifiedAt}
          showError={!!error && !isValidMobile(mobile)}
        />
        <div className="relative">
          <Input
            placeholder="Profession (e.g. Mason, Painter, Electrician)"
            value={profession}
            onChange={(e) => { setProfession(e.target.value); setShowProfessionSuggestions(true); }}
            onFocus={() => setShowProfessionSuggestions(true)}
            onBlur={() => setTimeout(() => setShowProfessionSuggestions(false), 150)}
            autoComplete="off"
            className="bg-card border border-border/60 h-14 rounded-xl text-lg w-full px-4 placeholder:text-muted-foreground shadow-soft transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary focus-visible:shadow-elevated"
          />
          {showProfessionSuggestions && professionSuggestions.length > 0 && (
            <div className="absolute left-0 right-0 top-full z-30 mt-1 max-h-72 overflow-y-auto rounded-xl border border-border bg-card shadow-elevated">
              {professionSuggestions.map((p) => (
                <button
                  type="button"
                  key={p.en}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => { setProfession(p.en); setShowProfessionSuggestions(false); }}
                  className="flex w-full flex-col items-start gap-0.5 border-b border-border px-4 py-3 text-left last:border-b-0 hover:bg-secondary"
                >
                  <p className="font-semibold text-foreground">{p.en}</p>
                  <p className="text-xs text-muted-foreground">{p.ta}</p>
                </button>
              ))}
            </div>
          )}
        </div>
        <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-card border border-border/60 h-14 rounded-xl text-lg w-full px-4 placeholder:text-muted-foreground shadow-soft transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary focus-visible:shadow-elevated" />
        
        <div className='flex items-center gap-2'>
            <Input placeholder="Aadhaar Number" value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} className="bg-card border border-border/60 h-14 rounded-xl text-lg w-full px-4 placeholder:text-muted-foreground shadow-soft transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary focus-visible:shadow-elevated" />
            <input type="file" accept="image/*" ref={aadhaarInputRef} onChange={e => setAadhaarFile(e.target.files?.[0] || null)} className="hidden" />
            <Button variant='outline' size='icon' onClick={() => aadhaarInputRef.current?.click()} className="h-14 w-14 rounded-xl border-border/60 bg-card shadow-soft hover:bg-secondary"><Upload className='w-5 h-5 text-muted-foreground'/></Button>
        </div>
        {aadhaarFile && <img src={URL.createObjectURL(aadhaarFile)} alt="Aadhaar Preview" className="w-full h-auto rounded-lg mt-2" />}

        <div className='flex items-center gap-2'>
            <Input placeholder="PAN Number" value={pan} onChange={(e) => setPan(e.target.value)} className="bg-card border border-border/60 h-14 rounded-xl text-lg w-full px-4 placeholder:text-muted-foreground shadow-soft transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary focus-visible:shadow-elevated" />
            <input type="file" accept="image/*" ref={panInputRef} onChange={e => setPanFile(e.target.files?.[0] || null)} className="hidden" />
            <Button variant='outline' size='icon' onClick={() => panInputRef.current?.click()} className="h-14 w-14 rounded-xl border-border/60 bg-card shadow-soft hover:bg-secondary"><Upload className='w-5 h-5 text-muted-foreground'/></Button>
        </div>
        {panFile && <img src={URL.createObjectURL(panFile)} alt="PAN Preview" className="w-full h-auto rounded-lg mt-2" />}

        <div className='flex items-center gap-2'>
            <Input placeholder="Driving Licence / ID Number" value={licence} onChange={(e) => setLicence(e.target.value)} className="bg-card border border-border/60 h-14 rounded-xl text-lg w-full px-4 placeholder:text-muted-foreground shadow-soft transition-shadow focus-visible:ring-2 focus-visible:ring-primary/40 focus-visible:border-primary focus-visible:shadow-elevated" />
            <input type="file" accept="image/*" ref={licenceInputRef} onChange={e => setLicenceFile(e.target.files?.[0] || null)} className="hidden" />
            <Button variant='outline' size='icon' onClick={() => licenceInputRef.current?.click()} className="h-14 w-14 rounded-xl border-border/60 bg-card shadow-soft hover:bg-secondary"><Upload className='w-5 h-5 text-muted-foreground'/></Button>
        </div>
        {licenceFile && <img src={URL.createObjectURL(licenceFile)} alt="Licence Preview" className="w-full h-auto rounded-lg mt-2" />}
      </div>

      {error && <p className="text-destructive text-sm mt-4 text-center">{error}</p>}

      <div className="mt-10">
        <Button onClick={handleSave} disabled={isSaving} className="w-full bg-primary hover:bg-emerald-600 text-primary-foreground font-bold h-14 rounded-xl text-lg shadow-primary-glow transition-shadow">
          {isSaving ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving…</> : 'Save Customer'}
        </Button>
      </div>
    </div>
  );
}
