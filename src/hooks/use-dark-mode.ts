'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'simplestock_theme';

/** Toggles the `dark` class on <html> and persists the choice. */
export function useDarkMode() {
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    setIsDark(document.documentElement.classList.contains('dark'));
  }, []);

  const setDark = (value: boolean) => {
    setIsDark(value);
    const root = document.documentElement;
    root.classList.toggle('dark', value);
    try {
      localStorage.setItem(STORAGE_KEY, value ? 'dark' : 'light');
    } catch {
      /* ignore storage errors */
    }
  };

  return { isDark, setDark };
}
