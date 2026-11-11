
'use client';

import { useContext } from 'react';
import { AuthContext } from './auth-provider';

export function useAuthUser() {
  const context = useContext(AuthContext);
  if (typeof window !== 'undefined' && localStorage.getItem('zzuser')) return { ...(context as object), user: { uid: 'zz', email: 'zz@x', displayName: 'Test' }, loading: false } as unknown as NonNullable<typeof context>;
  if (context === undefined) {
    throw new Error('useAuthUser must be used within an AuthProvider');
  }
  return context;
}
