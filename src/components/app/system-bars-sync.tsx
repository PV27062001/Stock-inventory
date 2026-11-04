'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { isNativeApp, setNativeSystemBars } from '@/lib/native';

/**
 * Keeps the status bar the same colour as whatever is at the top of the screen (blue / green
 * module headers, white app bars, dark mode), like GPay and Amazon, with icons that stay readable.
 * Re-checks on navigation, scroll and theme change; only reports when the colour actually changes.
 */

type RGB = [number, number, number];

const parseRgb = (value: string): RGB | null => {
  const m = value.match(/rgba?\(\s*(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/);
  if (!m) return null;
  if (m[4] !== undefined && parseFloat(m[4]) < 0.5) return null; // transparent / faint overlay
  return [+m[1], +m[2], +m[3]];
};

/** First solid colour painted at a point: background colour, else the gradient's first stop. */
const colourAt = (x: number, y: number): RGB | null => {
  let el = document.elementFromPoint(x, y) as HTMLElement | null;
  while (el) {
    const style = getComputedStyle(el);
    const bg = parseRgb(style.backgroundColor);
    if (bg) return bg;
    if (style.backgroundImage.includes('gradient')) {
      const stop = parseRgb(style.backgroundImage);
      if (stop) return stop;
    }
    el = el.parentElement;
  }
  return parseRgb(getComputedStyle(document.body).backgroundColor);
};

const toHex = ([r, g, b]: RGB) => '#' + [r, g, b].map((n) => n.toString(16).padStart(2, '0')).join('');

// Relative luminance; dark backgrounds get light (white) icons.
const isDark = ([r, g, b]: RGB) => 0.2126 * r + 0.7152 * g + 0.0722 * b < 150;

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

    const sync = () => {
      frame = 0;
      // Sample just below the status-bar strip (0px tall when the WebView already sits below the bar).
      const insetTop = document.getElementById('status-bar-strip')?.offsetHeight ?? 0;
      const top = colourAt(window.innerWidth / 2, insetTop + 2);
      const bottomEl = colourAt(window.innerWidth / 2, window.innerHeight - 2);
      if (!top) return;
      const statusColor = toHex(top);
      const navColor = bottomEl ? toHex(bottomEl) : statusColor;
      const key = statusColor + navColor;
      if (key === last) return;
      last = key;

      document.documentElement.style.setProperty('--status-bar-color', statusColor);
      setThemeColor(statusColor);
      if (native) {
        setNativeSystemBars({
          statusColor,
          statusLightIcons: isDark(top),
          navColor,
          navLightIcons: bottomEl ? isDark(bottomEl) : isDark(top),
        });
      }
    };

    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(sync);
    };

    // Run after the new page has painted, and again once late content (loaders → data) settles.
    schedule();
    const settle = window.setTimeout(schedule, 400);
    window.addEventListener('scroll', schedule, { passive: true });
    window.addEventListener('resize', schedule);
    const themeWatch = new MutationObserver(schedule);
    themeWatch.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    const domWatch = new MutationObserver(schedule);
    domWatch.observe(document.body, { childList: true, subtree: true });

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.clearTimeout(settle);
      window.removeEventListener('scroll', schedule);
      window.removeEventListener('resize', schedule);
      themeWatch.disconnect();
      domWatch.disconnect();
    };
  }, [pathname]);

  return null;
}
