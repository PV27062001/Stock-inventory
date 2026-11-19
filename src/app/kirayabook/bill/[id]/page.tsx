'use client';

import { logger } from '@/lib/logger';
import { useEffect, useRef, useState } from 'react';
import { useParams } from 'next/navigation';
import { Download, Printer, Share2 } from 'lucide-react';
import { HeaderButton, PageHeader } from '@/components/ui/page-header';
import { getRental, getCustomerById, type Rental, type Customer } from '@/firebase/kirayabook/firestore-service';
import { BrandLoader } from '@/components/app/brand-loader';
import { PrintableBill } from '@/components/kirayabook/printable-bill';
import { buildPrintableBill } from '@/lib/printable-bill';
import { billNo } from '@/lib/bill';

export default function RentalBillPage() {
  const params = useParams();
  const rentalId = (params?.id as string) || '';

  const [rental, setRental] = useState<Rental | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [exportMessage, setExportMessage] = useState('');
  const billRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!rentalId) {
      setError('Rental ID is missing.');
      setIsLoading(false);
      return;
    }
    getRental(rentalId)
      .then((rent) => {
        if (!rent) {
          setError('Rental not found.');
          setIsLoading(false);
          return;
        }
        setRental(rent);
        if (rent.customerId) {
          getCustomerById(rent.customerId)
            .then(setCustomer)
            .catch((e) => logger.warn('Could not load customer for bill:', e));
        }
        setIsLoading(false);
      })
      .catch((e) => {
        setError('Failed to load rental.');
        logger.error(e);
        setIsLoading(false);
      });
  }, [rentalId]);

  const handlePrint = () => window.print();

  const handleExportJpeg = async () => {
    if (!billRef.current) return;
    setIsExporting(true);
    setExportMessage('Preparing image…');
    try {
      const { default: html2canvas } = await import('html2canvas');
      await document.fonts.ready;
      const canvas = await html2canvas(billRef.current, { scale: 2, backgroundColor: '#ffffff', logging: false });
      const blob: Blob | null = await new Promise((resolve) => canvas.toBlob(resolve, 'image/jpeg', 0.95));
      if (!blob) throw new Error('The image could not be created.');
      const filename = `bill-${billNo(rentalId)}.jpg`;
      const file = new File([blob], filename, { type: 'image/jpeg' });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file] });
          setExportMessage('Bill shared.');
          return;
        } catch (shareError) {
          if ((shareError as Error).name === 'AbortError') {
            setExportMessage('Sharing cancelled.');
            return;
          }
        }
      }

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 60_000);
      setExportMessage('Image downloaded.');
    } catch (e) {
      logger.error('JPEG export failed:', e);
      setExportMessage('Could not create the image. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) return <BrandLoader label="Loading bill…" />;
  if (error) return <div className="text-center p-10 text-destructive">{error}</div>;
  if (!rental) return <div className="text-center p-10 text-muted-foreground">Rental data not available.</div>;

  const bill = buildPrintableBill(rental, customer);

  return (
    <div className="min-h-screen bg-secondary/40">
      <PageHeader
        title="Rental Bill"
        className="no-print"
        actions={
          <>
            <HeaderButton icon={Printer} label="Print" onClick={handlePrint} title="Print / Save as PDF" />
            <HeaderButton
              icon={isExporting ? Download : Share2}
              label={isExporting ? 'Wait…' : 'Share'}
              onClick={handleExportJpeg}
              disabled={isExporting}
              title="Share on WhatsApp as a picture"
            />
          </>
        }
      />

      {exportMessage && (
        <p className="no-print px-4 py-2 text-center text-sm text-muted-foreground">{exportMessage}</p>
      )}

      <main className="flex justify-center overflow-x-auto p-4">
        <div className="shadow-elevated">
          <PrintableBill ref={billRef} bill={bill} />
        </div>
      </main>
    </div>
  );
}
