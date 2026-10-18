'use client';

import { useEffect, useState } from 'react';

export type StartPage = 'ask' | 'inventory' | 'kirayabook';

const KEY = 'start-page';

export const readStartPage = (): StartPage => {
  if (typeof window === 'undefined') return 'ask';
  const v = window.localStorage.getItem(KEY);
  return v === 'inventory' || v === 'kirayabook' ? v : 'ask';
};

export function useStartPage() {
  const [startPage, setStartPageState] = useState<StartPage>('ask');
  // Preference lives in localStorage, so it is unknown until mounted.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStartPageState(readStartPage());
    setLoaded(true);
  }, []);

  const setStartPage = (value: StartPage) => {
    setStartPageState(value);
    if (typeof window !== 'undefined') {
      if (value === 'ask') window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, value);
    }
  };

  return { startPage, setStartPage, loaded };
}
