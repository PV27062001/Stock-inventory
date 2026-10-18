'use client';

import { logger } from '@/lib/logger';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ShoppingBasket, BookOpen } from 'lucide-react';
import { signInWithGoogle, signOut, UnauthorizedEmailError } from '@/firebase/auth/auth-service';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { BrandLoader } from '@/components/app/brand-loader';
import { isEmailAllowed } from '@/lib/allowed-users';

function LoginContent() {
  const { user, loading } = useAuthUser();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState(
    searchParams?.get('denied') ? 'This Google account is not allowed to use this app.' : ''
  );

  useEffect(() => {
    if (loading) return;

    if (user) {
      if (isEmailAllowed(user.email)) {
        router.push('/');
      } else {
        // Handle the case where they logged in via mobile redirect (signInWithRedirect).
        // They arrive authenticated in Firebase, but aren't allowed. We must sign them out.
        signOut().finally(() => {
          setError('This Google account is not allowed to use this app.');
          router.replace('/login?denied=1');
        });
      }
    }
  }, [user, loading, router]);

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await signInWithGoogle();
    } catch (e) {
      logger.error(e);
      setError(
        e instanceof UnauthorizedEmailError
          ? 'This Google account is not allowed to use this app.'
          : 'Sign-in failed. Please try again.'
      );
    }
  };

  if (loading) {
    return <BrandLoader />;
  }

  return (
    <main className="min-h-screen p-6 flex flex-col justify-center items-center bg-background">
      <div className="mb-10 text-center">
        <div className="w-20 h-20 bg-gradient-to-br from-primary/20 to-brand-blue/20 rounded-3xl flex items-center justify-center mx-auto mb-4">
          <div className="flex gap-2">
            <ShoppingBasket className="w-5 h-5 text-primary" />
            <BookOpen className="w-5 h-5 text-brand-blue" />
          </div>
        </div>
        <h1 className="text-4xl font-bold text-primary mb-2">Sri Amman</h1>
        <p className="text-muted-foreground text-lg font-medium mb-1">Samayal Pathirakadai</p>
        <p className="text-sm text-muted-foreground/70 max-w-sm mx-auto">
          Manage your inventory and rental records all in one place. Track groceries, medicines, and customer transactions effortlessly.
        </p>
      </div>

      <Card className="w-full max-w-sm p-8 border-none shadow-xl rounded-[2.5rem]">
        <h2 className="text-2xl font-bold mb-2 text-center">Welcome</h2>
        <p className="text-sm text-muted-foreground text-center mb-6">Sign in to access Inventory and Ledger</p>

        {error && (
          <p className="mb-4 rounded-lg border border-destructive/40 bg-destructive/15 px-4 py-3 text-center text-sm font-medium text-destructive">
            {error}
          </p>
        )}
        
        <Button 
          variant="outline" 
          onClick={handleGoogleSignIn}
          className="w-full h-14 text-lg rounded-2xl border-2"
        >
          <svg className="w-5 h-5 mr-2" viewBox="0 0 48 48" aria-hidden="true">
            <path fill="#FFC107" d="M43.611 20.083H42V20H24v8h11.303c-1.649 4.657-6.08 8-11.303 8-6.627 0-12-5.373-12-12s5.373-12 12-12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 12.955 4 4 12.955 4 24s8.955 20 20 20 20-8.955 20-20c0-1.341-.138-2.65-.389-3.917z"/>
            <path fill="#FF3D00" d="M6.306 14.691l6.571 4.819C14.655 15.108 18.961 12 24 12c3.059 0 5.842 1.154 7.961 3.039l5.657-5.657C34.046 6.053 29.268 4 24 4 16.318 4 9.656 8.337 6.306 14.691z"/>
            <path fill="#4CAF50" d="M24 44c5.166 0 9.86-1.977 13.409-5.192l-6.19-5.238A11.91 11.91 0 0124 36c-5.202 0-9.619-3.317-11.283-7.946l-6.522 5.025C9.505 39.556 16.227 44 24 44z"/>
            <path fill="#1976D2" d="M43.611 20.083H42V20H24v8h11.303a12.04 12.04 0 01-4.087 5.571l.003-.002 6.19 5.238C36.971 39.205 44 34 44 24c0-1.341-.138-2.65-.389-3.917z"/>
          </svg>
          Sign in with Google
        </Button>
      </Card>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<BrandLoader />}>
      <LoginContent />
    </Suspense>
  );
}
