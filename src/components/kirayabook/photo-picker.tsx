'use client';

import { useRef, useState } from 'react';
import { Camera, Image as ImageIcon } from 'lucide-react';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';

/**
 * Lets the user take a photo with the camera or pick one from the phone, from a bottom sheet.
 * Two inputs because `capture` is what makes Android open the camera instead of the gallery.
 */
export function PhotoPicker({
  title,
  onPick,
  children,
}: {
  title: string;
  onPick: (file: File) => void;
  children: (open: () => void) => React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const cameraRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) onPick(file);
    e.target.value = ''; // so picking the same photo again still fires
  };

  const choose = (input: HTMLInputElement | null) => {
    setIsOpen(false);
    input?.click();
  };

  const options = [
    { label: 'Take photo', hint: 'Open the camera', icon: Camera, ref: cameraRef },
    { label: 'Choose from phone', hint: 'Pick from your gallery or files', icon: ImageIcon, ref: galleryRef },
  ];

  return (
    <>
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" onChange={handleChange} className="hidden" />
      <input ref={galleryRef} type="file" accept="image/*" onChange={handleChange} className="hidden" />
      {children(() => setIsOpen(true))}
      <Sheet open={isOpen} onOpenChange={setIsOpen}>
        <SheetContent side="bottom" onOpenAutoFocus={(e) => e.preventDefault()} className="mx-auto max-w-md rounded-t-2xl p-4">
          <SheetHeader className="pb-2 text-left">
            <SheetTitle className="text-base">{title}</SheetTitle>
          </SheetHeader>
          <div className="space-y-2">
            {options.map((option) => (
              <button
                key={option.label}
                type="button"
                onClick={() => choose(option.ref.current)}
                className="flex min-h-14 w-full items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-left hover:bg-secondary"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <option.icon className="h-5 w-5" />
                </span>
                <span>
                  <span className="block text-base font-semibold text-foreground">{option.label}</span>
                  <span className="block text-sm text-muted-foreground">{option.hint}</span>
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
