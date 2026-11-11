'use client';
// TEMPORARY - removed after the run.
import { useEffect, useState } from 'react';
const pause = (ms: number) => fetch(`/api/zz-audit?ms=${ms}&t=${Math.random()}`);
const until = async (fn: () => unknown, ms = 8000) => { for (let i = 0; i < ms / 100; i++) { if (fn()) return true; await pause(100); } return false; };
const ROUTES = ['/kirayabook', '/kirayabook/customers', '/kirayabook/inventory', '/kirayabook/add-customer', '/kirayabook/customer/c0', '/kirayabook/edit-customer/c0', '/kirayabook/unsettled', '/inventory', '/add-item', '/add', '/alerts', '/settings', '/'];
const hex = (rgb: string) => { const m = rgb.match(/(\d+)[,\s]+(\d+)[,\s]+(\d+)(?:[,\s/]+([\d.]+))?/); if (!m) return 'none'; if (m[4] !== undefined && Number(m[4]) === 0) return 'transparent'; return '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join(''); };
export default function Audit() {
  const [done, setDone] = useState('running');
  useEffect(() => { (async () => {
    const out: Record<string, unknown>[] = [];
    localStorage.setItem('zzuser', '1'); localStorage.setItem('zzmock', 'many');
    for (const theme of ['light', 'dark']) {
      localStorage.setItem('simplestock_theme', theme);
      for (const path of ROUTES) {
        const f = document.createElement('iframe'); f.style.cssText = 'width:393px;height:852px;border:0'; document.body.appendChild(f);
        f.src = path; await new Promise((r) => { f.onload = r; });
        const w = f.contentWindow as Window & typeof globalThis; const d = w.document;
        const loaded = await until(() => d.querySelector('main, form, h1') && !d.body.innerText.includes('Loading inventory'), 8000); await pause(1500);
        const measure = (state: string) => {
          const nav = d.querySelector('nav.fixed.bottom-0') as HTMLElement | null;
          const nr = nav?.getBoundingClientRect();
          // The element painted at the top of the screen, below the status strip.
          const topEl = d.elementFromPoint(196, 4) as HTMLElement | null;
          let bar: HTMLElement | null = topEl; while (bar && bar.parentElement && bar.parentElement !== d.body && bar.getBoundingClientRect().height < 40) bar = bar.parentElement;
          const header = d.querySelector('header') as HTMLElement | null;
          const hr = header?.getBoundingClientRect();
          const sw = d.querySelector('[aria-pressed]')?.closest('div.sticky') as HTMLElement | null;
          out.push({ theme, path, state, loaded, switchBottom: sw ? Math.round(sw.getBoundingClientRect().bottom) : null, title2: (d.querySelector('h1')?.getBoundingClientRect().height ?? 0) > 0,
            navVar: getComputedStyle(d.documentElement).getPropertyValue('--nav-bar-color').trim(),
            navBg: nav ? hex(getComputedStyle(nav).backgroundColor) : 'no-nav', navH: nr ? Math.round(nr.height) : 0, navBottom: nr ? Math.round(852 - nr.bottom) : null,
            topColor: topEl ? hex(getComputedStyle(topEl).backgroundColor) : 'none',
            headerTop: hr ? Math.round(hr.top) : null, headerH: hr ? Math.round(hr.height) : null, headerBg: header ? hex(getComputedStyle(header).backgroundColor) : 'none',
            width: d.documentElement.scrollWidth, fixedNavs: d.querySelectorAll('nav.fixed').length, title: (d.querySelector('h1')?.textContent || '').slice(0, 20) });
        };
        measure('top');
        w.scrollTo(0, 600); await pause(500); measure('scrolled');
        f.remove();
      }
    }
    localStorage.setItem('simplestock_theme', 'light');
    const setValue = (w: Window & typeof globalThis, el: HTMLInputElement, v: string) => { Object.getOwnPropertyDescriptor(w.HTMLInputElement.prototype, 'value')!.set!.call(el, v); el.dispatchEvent(new w.Event('input', { bubbles: true })); };
    for (const path of ['/kirayabook', '/kirayabook/customers']) {
      const f = document.createElement('iframe'); f.style.cssText = 'width:393px;height:852px;border:0'; document.body.appendChild(f);
      f.src = path; await new Promise((r) => { f.onload = r; });
      const w = f.contentWindow as Window & typeof globalThis; const d = w.document;
      await until(() => d.querySelector('input[inputmode]'), 8000); await pause(1200);
      const input = d.querySelector('input[inputmode]') as HTMLInputElement;
      const toggle = [...d.querySelectorAll('button')].find((b) => b.textContent === 'ABC') as HTMLButtonElement | undefined;
      const r = input?.getBoundingClientRect(); const tr = toggle?.getBoundingClientRect();
      const numeric = input?.inputMode === 'numeric';
      input.focus(); setValue(w, input, '543213'); await pause(900);
      const found = d.body.innerText.includes('Devi 3'); const others = d.body.innerText.includes('Arun 0');
      toggle?.click(); await pause(300);
      const text = input.inputMode === 'text' && d.activeElement === input && [...d.querySelectorAll('button')].some((b) => b.textContent === '123');
      setValue(w, input, 'chitra'); await pause(900); const byName = d.body.innerText.includes('Chitra 2');
      out.push({ check: 'search', path, numeric, text, found, others, byName, toggleSize: tr ? `${Math.round(tr.width)}x${Math.round(tr.height)}` : 'none', fits: r ? r.left >= 0 && r.right <= 393 : false, placeholder: input?.placeholder });
      f.remove();
    }
    localStorage.removeItem('zzuser'); localStorage.removeItem('zzmock'); localStorage.setItem('simplestock_theme', 'light');
    await fetch('/api/zz-audit', { method: 'POST', body: JSON.stringify(out) }); setDone('finished');
  })().catch(async (e) => { await fetch('/api/zz-audit', { method: 'POST', body: JSON.stringify([{ crash: String(e?.stack || e) }]) }); setDone('crashed'); }); }, []);
  return <pre id="state">{done}</pre>;
}
