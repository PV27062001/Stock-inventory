
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { BrandLoader } from '@/components/app/brand-loader';
import { isEmailAllowed } from '@/lib/allowed-users';
import { signOut } from '@/firebase/auth/auth-service';

/**
 * A higher-order component that protects a page from unauthenticated access.
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function WithAuth(props: P) {
    const { user, loading } = useAuthUser();
    const router = useRouter();
    const allowed = isEmailAllowed(user?.email);

    useEffect(() => {
      if (loading) return;
      if (!user) {
        router.push('/login');
        return;
      }
      // Catches the redirect sign-in flow, which can't be checked at call time.
      if (!allowed) {
        signOut().finally(() => router.push('/login?denied=1'));
      }
    }, [loading, user, allowed, router]);

    if (loading) {
      return <BrandLoader />;
    }

    if (!user || !allowed) {
      return null; // Don't render the component if the user is not authenticated
    }

    return <Component {...props} />;
  };
}
