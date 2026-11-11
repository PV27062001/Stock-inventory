
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
  return function WithAuth(props: P) { return <Component {...props} />; };
}
