'use client';

interface LoadingOverlayProps {
  show: boolean;
  message?: string;
}

export function LoadingOverlay({ show, message = 'Working...' }: LoadingOverlayProps) {
  if (!show) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-center bg-black/45 px-4 pt-28">
      <div className="h-fit w-full max-w-md rounded-lg border border-teal-400/30 bg-[#16213E] p-5 text-white shadow-xl">
        <div className="flex items-center gap-4">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-teal-300 border-t-transparent" />
          <div>
            <p className="text-base font-bold">{message}</p>
            <p className="text-sm text-gray-300">Please wait. This prevents duplicate actions.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
