
'use client';

import { useAuthUser } from '@/firebase/auth/use-auth-user';
import { BottomNav } from './bottom-nav';

export function ConditionalBottomNav() {
  const { user } = useAuthUser();

  if (!user) {
    return null;
  }

  return <BottomNav />;
}
