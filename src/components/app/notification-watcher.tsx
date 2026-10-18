'use client';

import { useEffect } from 'react';
import { useInventory } from '@/firebase/firestore/use-inventory';

const todayKey = () => new Date().toDateString();

/**
 * Fires a local low-stock notification (once per day) when items fall to or
 * below their alert threshold — only if the user has granted permission.
 */
export function NotificationWatcher() {
  const { items } = useInventory();

  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) return;
    if (Notification.permission !== 'granted') return;
    if (localStorage.getItem('notifications-enabled') === 'false') return;
    if (!items.length) return;

    const low = items.filter(
      (i) => i.lowStockThreshold != null && i.quantity <= (i.lowStockThreshold as number),
    );
    if (!low.length) return;

    try {
      if (localStorage.getItem('lowstock_notified') === todayKey()) return;
      localStorage.setItem('lowstock_notified', todayKey());
    } catch {
      /* ignore storage errors */
    }

    const names = low.slice(0, 3).map((i) => i.name).join(', ');
    new Notification('Sri Amman — Low stock', {
      body: `${low.length} item${low.length > 1 ? 's' : ''} running low: ${names}`,
      icon: '/icon.svg',
      badge: '/icon.svg',
    });
  }, [items]);

  return null;
}
