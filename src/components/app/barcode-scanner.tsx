'use client';

import { useEffect, useRef, useState } from 'react';
import { Flashlight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

type Status = 'starting' | 'scanning' | 'denied' | 'unavailable';

const SCAN_INTERVAL_MS = 120;
const MAX_FRAME_WIDTH = 960;

/**
 * Full-screen live camera scanner for product barcodes (EAN / UPC). The number can also be typed,
 * for when the camera is refused or a barcode is too damaged to read.
 */
export function BarcodeScanner({ onDetected, onClose }: { onDetected: (code: string) => void; onClose: () => void }) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const trackRef = useRef<MediaStreamTrack | null>(null);
  const onDetectedRef = useRef(onDetected);
  onDetectedRef.current = onDetected;
  const [status, setStatus] = useState<Status>('starting');
  const [hasTorch, setHasTorch] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [typed, setTyped] = useState('');

  useEffect(() => {
    let stopped = false;
    let stream: MediaStream | null = null;
    let timer: ReturnType<typeof setTimeout>;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({
          audio: false,
          video: { facingMode: { ideal: 'environment' }, width: { ideal: 1280 }, height: { ideal: 720 } },
        });
      } catch (e) {
        if (!stopped) setStatus((e as Error).name === 'NotAllowedError' ? 'denied' : 'unavailable');
        return;
      }
      const video = videoRef.current;
      if (stopped || !video) return;

      video.srcObject = stream;
      await video.play().catch(() => {});
      const track = stream.getVideoTracks()[0];
      trackRef.current = track;
      const capabilities = (track.getCapabilities?.() ?? {}) as { torch?: boolean; focusMode?: string[] };
      setHasTorch(!!capabilities.torch);
      if (capabilities.focusMode?.includes('continuous')) {
        await track.applyConstraints({ advanced: [{ focusMode: 'continuous' } as MediaTrackConstraintSet] }).catch(() => {});
      }

      // Loaded here so the scanner code is only downloaded when someone opens it.
      const { BarcodeFormat, BinaryBitmap, DecodeHintType, HTMLCanvasElementLuminanceSource, HybridBinarizer, MultiFormatReader } = await import('@zxing/library');
      const reader = new MultiFormatReader();
      reader.setHints(new Map<number, unknown>([
        [DecodeHintType.POSSIBLE_FORMATS, [BarcodeFormat.EAN_13, BarcodeFormat.EAN_8, BarcodeFormat.UPC_A, BarcodeFormat.UPC_E]],
        [DecodeHintType.TRY_HARDER, true],
      ]));
      if (stopped) return;
      setStatus('scanning');

      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d', { willReadFrequently: true });
      let lastRead = '';

      const scanFrame = () => {
        if (stopped) return;
        const { videoWidth, videoHeight } = video;
        if (context && videoWidth) {
          // Only the middle of the picture, where the guide frame is.
          const cropWidth = videoWidth * 0.9;
          const cropHeight = videoHeight * 0.6;
          const scale = Math.min(1, MAX_FRAME_WIDTH / cropWidth);
          canvas.width = cropWidth * scale;
          canvas.height = cropHeight * scale;
          context.drawImage(video, (videoWidth - cropWidth) / 2, (videoHeight - cropHeight) / 2, cropWidth, cropHeight, 0, 0, canvas.width, canvas.height);
          try {
            const code = reader.decodeWithState(new BinaryBitmap(new HybridBinarizer(new HTMLCanvasElementLuminanceSource(canvas)))).getText();
            // The same number on two frames in a row, so a blurred frame can't enter a wrong product.
            if (code === lastRead) {
              navigator.vibrate?.(60);
              onDetectedRef.current(code);
              return;
            }
            lastRead = code;
          } catch {
            // No barcode in this frame; the normal case until it is lined up.
          }
        }
        timer = setTimeout(scanFrame, SCAN_INTERVAL_MS);
      };
      scanFrame();
    };

    start();
    return () => {
      stopped = true;
      clearTimeout(timer);
      stream?.getTracks().forEach((track) => track.stop());
      trackRef.current = null;
    };
  }, []);

  const toggleTorch = async () => {
    const next = !torchOn;
    await trackRef.current?.applyConstraints({ advanced: [{ torch: next } as MediaTrackConstraintSet] }).catch(() => {});
    setTorchOn(next);
  };

  const validTyped = /^\d{8,14}$/.test(typed);
  const message = {
    starting: 'Starting camera…',
    scanning: 'Line up the barcode inside the box',
    denied: 'Camera permission is off. Allow it in phone settings, or type the number below.',
    unavailable: 'The camera could not be opened. Type the number below.',
  }[status];

  return (
    <div className="fixed inset-0 z-[70] flex flex-col bg-black text-white">
      <div className="flex items-center justify-between px-4 pb-2 pt-[max(0.5rem,env(safe-area-inset-top))]">
        <h2 className="text-lg font-bold">Scan barcode</h2>
        <button type="button" onClick={onClose} aria-label="Close scanner" className="flex h-12 w-12 items-center justify-center rounded-full bg-white/15">
          <X className="h-6 w-6" />
        </button>
      </div>

      <div className="relative min-h-0 flex-1 overflow-hidden">
        <video ref={videoRef} muted playsInline className="absolute inset-0 h-full w-full object-cover" />
        {status === 'scanning' && (
          <div className="absolute left-1/2 top-1/2 h-40 w-[80%] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-2xl border-2 border-white shadow-[0_0_0_9999px_rgba(0,0,0,0.45)]" />
        )}
        <p role="status" className="absolute inset-x-4 bottom-4 rounded-xl bg-black/60 px-3 py-2 text-center text-sm font-medium">{message}</p>
      </div>

      <div className="space-y-3 p-4 pb-[max(1rem,env(safe-area-inset-bottom))]">
        {hasTorch && (
          <Button type="button" variant="secondary" onClick={toggleTorch} className="h-12 w-full gap-2 rounded-xl">
            <Flashlight className="h-5 w-5" /> {torchOn ? 'Turn torch off' : 'Turn torch on'}
          </Button>
        )}
        <div className="flex gap-2">
          <Input
            value={typed}
            onChange={(e) => setTyped(e.target.value.replace(/\D/g, ''))}
            inputMode="numeric"
            placeholder="Or type the barcode number"
            aria-label="Barcode number"
            className="h-12 rounded-xl border-white/30 bg-white/10 text-base text-white placeholder:text-white/70"
          />
          <Button type="button" disabled={!validTyped} onClick={() => onDetected(typed)} className="h-12 shrink-0 rounded-xl px-4">Use</Button>
        </div>
      </div>
    </div>
  );
}
