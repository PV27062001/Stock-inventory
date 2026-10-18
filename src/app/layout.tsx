
import type {Metadata, Viewport} from 'next';
import './globals.css';
import { LanguageProvider } from '@/hooks/use-language';
import { Toaster } from '@/components/ui/toaster';
import { FirebaseClientProvider } from '@/firebase/client-provider';
import { ConditionalBottomNav } from '@/components/ui/conditional-bottom-nav';
import { AuthProvider } from '@/firebase/auth/auth-provider';
import { AlertProvider } from '@/components/alert-provider';
import { PWARegister } from '@/components/pwa-register';
import { InstallBanner } from '@/components/install-banner';
import { NotificationWatcher } from '@/components/app/notification-watcher';

export const metadata: Metadata = {
  title: 'Sri Amman - Inventory & Ledger',
  description: 'Inventory and rental ledger for the shop',
  manifest: '/manifest.webmanifest',
  icons: { icon: '/icon.svg', apple: '/icon.svg' },
  appleWebApp: { capable: true, statusBarStyle: 'default', title: 'Sri Amman' },
};

export const viewport: Viewport = {
  themeColor: '#1A73E8',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  viewportFit: 'cover',
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
        {/* Apply saved theme before paint to avoid a flash. */}
        <script
          dangerouslySetInnerHTML={{
            __html:
              "(function(){try{if(localStorage.getItem('simplestock_theme')==='dark'){document.documentElement.classList.add('dark');}}catch(e){}})();",
          }}
        />
      </head>
      <body className="font-body antialiased bg-background min-h-screen pb-24 md:pb-0 overflow-x-hidden">
        <PWARegister />
        <FirebaseClientProvider>
          <AuthProvider>
            <LanguageProvider>
              <AlertProvider>
                <div className="max-w-md mx-auto min-h-screen bg-background shadow-xl md:border-x overflow-x-hidden">
                  {children}
                  <ConditionalBottomNav />
                </div>
                <NotificationWatcher />
                <InstallBanner />
                <Toaster />
              </AlertProvider>
            </LanguageProvider>
          </AuthProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
