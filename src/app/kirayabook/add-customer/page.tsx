
'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { addCustomer } from '@/firebase/kirayabook/firestore-service';
import { uploadFile } from '@/firebase/kirayabook/storage-service';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Camera, Upload } from 'lucide-react';

export default function AddCustomerPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [mobile, setMobile] = useState('');
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
    if (!name || !mobile) {
      setError('Full Name and Mobile Number are required.');
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

      await addCustomer({ 
          name, mobile, address, aadhaar, pan, drivingLicence: licence, 
          photoUrl: newPhotoUrls.photoUrl,
          aadhaarPhotoUrl: newPhotoUrls.aadhaarPhotoUrl,
          panPhotoUrl: newPhotoUrls.panPhotoUrl,
          drivingLicencePhotoUrl: newPhotoUrls.drivingLicencePhotoUrl
      });

      router.push('/kirayabook');
    } catch (e) {
      setError('Failed to save customer. Please try again.');
      console.error(e);
    }
    setIsSaving(false);
  };

  return (
    <div className="p-4 bg-[#1A1A2E] min-h-screen text-white">
      <header className="flex items-center mb-8">
        <Button variant="ghost" size="icon" onClick={() => router.back()}>
          <ArrowLeft className="w-6 h-6" />
        </Button>
        <h1 className="text-xl font-bold ml-4">Add New Customer</h1>
      </header>

      <div className="space-y-6">
        <div className="flex justify-center mb-8">
            <input type="file" accept="image/*" ref={photoInputRef} onChange={e => setPhotoFile(e.target.files?.[0] || null)} className="hidden" />
            <button onClick={() => photoInputRef.current?.click()} className="w-32 h-32 rounded-full bg-[#16213E] flex flex-col items-center justify-center text-gray-400 border-2 border-dashed border-gray-600">
                {photoFile ? <img src={URL.createObjectURL(photoFile)} alt="Preview" className='w-full h-full object-cover rounded-full'/> : <><Camera className="w-8 h-8 mb-1"/><span className='text-xs'>Upload Photo</span></>}
            </button>
        </div>

        <Input placeholder="Full Name" value={name} onChange={(e) => setName(e.target.value)} className="bg-[#16213E] border-none h-14 rounded-lg text-lg w-full placeholder-gray-500" />
        <Input type="tel" placeholder="Mobile Number" value={mobile} onChange={(e) => setMobile(e.target.value)} className="bg-[#16213E] border-none h-14 rounded-lg text-lg w-full placeholder-gray-500" />
        <Input placeholder="Address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-[#16213E] border-none h-14 rounded-lg text-lg w-full placeholder-gray-500" />
        
        <div className='flex items-center gap-2'>
            <Input placeholder="Aadhaar Number" value={aadhaar} onChange={(e) => setAadhaar(e.target.value)} className="bg-[#16213E] border-none h-14 rounded-lg text-lg w-full placeholder-gray-500" />
            <input type="file" accept="image/*" ref={aadhaarInputRef} onChange={e => setAadhaarFile(e.target.files?.[0] || null)} className="hidden" />
            <Button variant='outline' size='icon' onClick={() => aadhaarInputRef.current?.click()} className="border-gray-700 bg-[#16213E] hover:bg-[#16213E]/80"><Upload className='w-5 h-5 text-gray-400'/></Button>
        </div>
        {aadhaarFile && <img src={URL.createObjectURL(aadhaarFile)} alt="Aadhaar Preview" className="w-full h-auto rounded-lg mt-2" />}

        <div className='flex items-center gap-2'>
            <Input placeholder="PAN Number" value={pan} onChange={(e) => setPan(e.target.value)} className="bg-[#16213E] border-none h-14 rounded-lg text-lg w-full placeholder-gray-500" />
            <input type="file" accept="image/*" ref={panInputRef} onChange={e => setPanFile(e.target.files?.[0] || null)} className="hidden" />
            <Button variant='outline' size='icon' onClick={() => panInputRef.current?.click()} className="border-gray-700 bg-[#16213E] hover:bg-[#16213E]/80"><Upload className='w-5 h-5 text-gray-400'/></Button>
        </div>
        {panFile && <img src={URL.createObjectURL(panFile)} alt="PAN Preview" className="w-full h-auto rounded-lg mt-2" />}

        <div className='flex items-center gap-2'>
            <Input placeholder="Driving Licence / ID Number" value={licence} onChange={(e) => setLicence(e.target.value)} className="bg-[#16213E] border-none h-14 rounded-lg text-lg w-full placeholder-gray-500" />
            <input type="file" accept="image/*" ref={licenceInputRef} onChange={e => setLicenceFile(e.target.files?.[0] || null)} className="hidden" />
            <Button variant='outline' size='icon' onClick={() => licenceInputRef.current?.click()} className="border-gray-700 bg-[#16213E] hover:bg-[#16213E]/80"><Upload className='w-5 h-5 text-gray-400'/></Button>
        </div>
        {licenceFile && <img src={URL.createObjectURL(licenceFile)} alt="Licence Preview" className="w-full h-auto rounded-lg mt-2" />}
      </div>

      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}

      <div className="mt-10">
        <Button onClick={handleSave} disabled={isSaving} className="w-full bg-[#1D9E75] hover:bg-emerald-600 text-white font-bold h-14 rounded-lg text-lg">
          {isSaving ? 'Saving...' : 'Save Customer'}
        </Button>
      </div>
    </div>
  );
}
