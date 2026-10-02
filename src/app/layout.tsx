
import type {Metadata} from 'next';
import './globals.css';
import { LanguageProvider } from '@/hooks/use-language';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ConditionalBottomNav } from '@/components/ui/conditional-bottom-nav';
import { AuthProvider } from '@/firebase/auth/auth-provider';
import { AlertProvider } from '@/components/alert-provider';

export const metadata: Metadata = {
  title: 'SimpleStock - Inventory & Ledger',
  description: 'A unified home inventory and rental ledger dashboard',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Noto+Sans+Tamil:wght@400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased bg-background min-h-screen pb-24 md:pb-0 overflow-x-hidden">
        <FirebaseClientProvider>
          <AuthProvider>
            <LanguageProvider>
              <AlertProvider>
                <div className="max-w-md mx-auto min-h-screen bg-background shadow-xl md:border-x overflow-x-hidden">
                  {children}
                  <ConditionalBottomNav />
                </div>
                <Toaster />
              </AlertProvider>
            </LanguageProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
