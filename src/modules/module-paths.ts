/**
 * Which app (module) owns which routes. Plain data with no React or icons, so the root layout's
 * head script can use it before paint. The full app details live in `registry.ts`.
 * SPEC §5 Navigation: never hard-code a module list anywhere else.
 */
export type ModuleId = 'personal' | 'medicines' | 'milk' | 'money' | 'ledger';

export const MODULE_PREFIXES: { id: ModuleId; prefixes: string[] }[] = [
  { id: 'personal', prefixes: ['/inventory', '/add-item', '/add', '/alerts'] },
  { id: 'medicines', prefixes: ['/medicines'] },
  { id: 'milk', prefixes: ['/milk'] },
  { id: 'money', prefixes: ['/money'] },
  { id: 'ledger', prefixes: ['/kirayabook', '/ledger'] },
];

const matches = (path: string, prefix: string) => path === prefix || path.startsWith(prefix + '/');

export const moduleIdForPath = (path: string | null | undefined): ModuleId | null =>
  (path && MODULE_PREFIXES.find((m) => m.prefixes.some((p) => matches(path, p)))?.id) || null;

/** Head-script source that sets `data-module` before paint (same rule as `moduleIdForPath`). */
export const moduleScript = () =>
  `var m=${JSON.stringify(MODULE_PREFIXES)},p=location.pathname;` +
  `for(var i=0;i<m.length;i++){for(var j=0;j<m[i].prefixes.length;j++){var x=m[i].prefixes[j];` +
  `if(p===x||p.indexOf(x+'/')===0){document.documentElement.dataset.module=m[i].id;}}}`;
