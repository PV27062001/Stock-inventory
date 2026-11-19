'use client';

import { useEffect, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isNativeApp, setNativeSystemBars } from '@/lib/native';

/**
 * Sets the module colour (green = Ledger, blue = everything else) and hands it to the system bars.
 * Like Amazon, every screen has a dark brand bar at the top, so the phone's status icons are white
 * everywhere and never have to switch. The colour comes from --app-bar in globals.css, not from
 * what happens to be on screen, so it cannot be wrong while a page is loading or scrolling.
 */

// Null for a see-through colour, which would otherwise read as black.
const toHex = (rgb: string) => {
  const m = rgb.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
  if (m?.[4] !== undefined && Number(m[4]) === 0) return null;
  return m ? '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join('') : null;
};

const setThemeColor = (hex: string) => {
  let meta = document.querySelector<HTMLMetaElement>('meta[name="theme-color"]');
  if (!meta) {
    meta = document.createElement('meta');
    meta.name = 'theme-color';
    document.head.appendChild(meta);
  }
  meta.content = hex;
};

export function SystemBarsSync() {
  const pathname = usePathname();

  // Before paint, so a new screen never shows a frame of the other module's colour.
  useLayoutEffect(() => {
    if (pathname?.startsWith('/kirayabook')) document.documentElement.dataset.module = 'ledger';
    else delete document.documentElement.dataset.module;
  }, [pathname]);

  useEffect(() => {
    const native = isNativeApp();
    let last = '';
    let frame = 0;

    const sync = () => {
      frame = 0;
      const strip = document.getElementById('status-bar-strip');
      const statusColor = strip && toHex(getComputedStyle(strip).backgroundColor);
      if (!statusColor) return;
      // The bottom bar joins the app's bottom nav where there is one, else the page itself. Found by
      // id: a page's own fixed element (such as the A-Z index on Customers) must never be picked.
      const base = document.getElementById('app-bottom-nav') ?? document.body;
      const navColor = toHex(getComputedStyle(base).backgroundColor) ?? statusColor;
      const key = statusColor + navColor;
      if (key === last) return;
      last = key;

      document.documentElement.style.setProperty('--nav-bar-color', navColor);
      setThemeColor(statusColor);
      if (native) setNativeSystemBars({ statusColor, navColor });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    schedule();
    // Theme switches, and the bottom nav appearing once sign-in resolves.
    const themeWatch = new MutationObserver(schedule);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const domWatch = new MutationObserver(schedule);
    domWatch.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      themeWatch.disconnect();
      domWatch.disconnect();
    };
  }, [pathname]);

  return null;
}
