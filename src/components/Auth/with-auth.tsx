
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthUser } from '@/firebase/auth/use-auth-user';

/**
 * A higher-order component that protects a page from unauthenticated access.
 */
export function withAuth<P extends object>(Component: React.ComponentType<P>) {
  return function WithAuth(props: P) {
    const { user, loading } = useAuthUser();
    const router = useRouter();

    useEffect(() => {
      if (!loading && !user) {
        router.push('/login');
      }
    }, [loading, user, router]);

    if (loading) {
      return <div>Loading...</div>; // Or a proper loading spinner
    }

    if (!user) {
      return null; // Don't render the component if the user is not authenticated
    }

    return <Component {...props} />;
  };
}
