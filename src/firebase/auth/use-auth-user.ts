
'use client';

import { useContext } from 'react';
import { AuthContext } from './auth-provider';

export function useAuthUser() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthUser must be used within an AuthProvider');
  }
  return context;
}
