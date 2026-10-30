'use client';

import { useEffect } from 'react';
import { useInventory } from '@/firebase/firestore/use-inventory';
import { useNotifications } from '@/hooks/use-notifications';

const todayKey = () => new Date().toDateString();

/**
 * Fires a local low-stock notification (once per day) when items fall to or
 * below their alert threshold — only if the user has granted permission.
 * Goes through useNotifications so it works in the browser and in the Android app.
 */
export function NotificationWatcher() {
  const { items } = useInventory();
  const { permission, showNotification } = useNotifications();

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (permission !== 'granted') return;
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
    showNotification('Sri Amman — Low stock', {
      body: `${low.length} item${low.length > 1 ? 's' : ''} running low: ${names}`,
      icon: '/icon.svg',
      badge: '/icon.svg',
    });
    // showNotification is recreated each render; re-running on it would re-check daily dedupe only.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, permission]);

  return null;
}
