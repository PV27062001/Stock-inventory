'use client';
import { useEffect } from 'react';
export default function Shot() {
  useEffect(() => { const q = new URLSearchParams(location.search); localStorage.setItem('zzuser', '1'); localStorage.setItem('zzmock', 'many'); localStorage.setItem('simplestock_theme', q.get('t') || 'light'); location.replace(q.get('p') || '/'); }, []);
  return null;
}
