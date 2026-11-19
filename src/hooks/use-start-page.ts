'use client';

import { useEffect, useState } from 'react';
import { getModule, type ModuleId } from '@/modules/registry';

/** The screen `/` opens: the Apps launcher, or one app's home. */
export type StartPage = 'apps' | ModuleId;

const KEY = 'start-page';

// Values saved before the launcher existed.
const LEGACY: Record<string, StartPage> = { inventory: 'personal', kirayabook: 'ledger', ask: 'apps' };

export const readStartPage = (): StartPage => {
  if (typeof window === 'undefined') return 'apps';
  let v: string | null = null;
  try {
    v = window.localStorage.getItem(KEY);
  } catch {
    return 'apps';
  }
  if (!v) return 'apps';
  const mapped = LEGACY[v] ?? v;
  return mapped === 'apps' || getModule(mapped as ModuleId) ? (mapped as StartPage) : 'apps';
};

/** Where `/` should send the user. */
export const startPath = (page: StartPage) => (page === 'apps' ? '/apps' : getModule(page)?.homePath ?? '/apps');

export function useStartPage() {
  const [startPage, setStartPageState] = useState<StartPage>('apps');
  // Preference lives in localStorage, so it is unknown until mounted.
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setStartPageState(readStartPage());
    setLoaded(true);
  }, []);

  const setStartPage = (value: StartPage) => {
    setStartPageState(value);
    try {
      if (value === 'apps') window.localStorage.removeItem(KEY);
      else window.localStorage.setItem(KEY, value);
    } catch {
      // Storage blocked: the choice still applies for this visit.
    }
  };

  return { startPage, setStartPage, loaded };
}
