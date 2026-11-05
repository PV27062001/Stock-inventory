'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isNativeApp, setNativeSystemBars } from '@/lib/native';

/**
 * Keeps the system bars the same colour as the page (blue / green module headers, white app bars,
 * dark mode). Like Amazon, the bar stays steady while scrolling: it is set per screen and theme,
 * so the phone's time and signal icons do not flip colour as content moves underneath.
 */

type RGB = [number, number, number];

const parseRgb = (value: string): RGB | null => {
  const m = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
  if (!m) return null;
  if (m[4] !== undefined && parseFloat(m[4]) < 0.5) return null; // transparent / faint overlay
  return [+m[1], +m[2], +m[3]];
};

/** Top-most solid colour painted at a point: background colour, else the gradient's first stop. */
const colourAt = (x: number, y: number): RGB | null => {
  for (const el of document.elementsFromPoint(x, y)) {
    const style = getComputedStyle(el);
    const bg = parseRgb(style.backgroundColor);
    if (bg) return bg;
    if (style.backgroundImage.includes('gradient')) {
      const stop = parseRgb(style.backgroundImage);
      if (stop) return stop;
    }
  }
  return parseRgb(getComputedStyle(document.body).backgroundColor);
};

const toHex = ([r, g, b]: RGB) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');

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

  useEffect(() => {
    const native = isNativeApp();
    let last = '';
    let frame = 0;
    let forced = true;

    const sync = () => {
      frame = 0;
      // Scrolled content must not recolour the bar; only a new screen or theme may.
      if (window.scrollY > 8 && !forced) return;
      forced = false;
      // Sample just below the status-bar strip (0px tall when the WebView already sits below the bar).
      const insetTop = document.getElementById('status-bar-strip')?.offsetHeight ?? 0;
      const top = colourAt(window.innerWidth / 2, insetTop + 2);
      const bottom = colourAt(window.innerWidth / 2, window.innerHeight - 2);
      if (!top) return;
      const statusColor = toHex(top);
      const navColor = toHex(bottom ?? top);
      const key = statusColor + navColor;
      if (key === last) return;
      last = key;

      document.documentElement.style.setProperty('--status-bar-color', statusColor);
      setThemeColor(statusColor);
      if (native) setNativeSystemBars({ statusColor, navColor });
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };
    const forceSync = () => {
      forced = true;
      schedule();
    };

    // Run after the new page has painted, and again once late content (loaders → data) settles.
    schedule();
    const settle = window.setTimeout(forceSync, 400);
    window.addEventListener('resize', schedule);
    const themeWatch = new MutationObserver(forceSync);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const domWatch = new MutationObserver(schedule);
    domWatch.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener('resize', schedule);
      themeWatch.disconnect();
      domWatch.disconnect();
    };
  }, [pathname]);

  return null;
}
