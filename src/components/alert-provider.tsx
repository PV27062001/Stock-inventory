'use client';

import { useEffect, useRef } from 'react';
import { useAlerts } from '@/hooks/use-alerts';
import { useNotifications } from '@/hooks/use-notifications';

export function AlertProvider({ children }: { children: React.ReactNode }) {
  const { alerts } = useAlerts();
  const { permission, requestPermission, showNotification } = useNotifications();
  const shownAlerts = useRef<Set<string>>(new Set());

  useEffect(() => {
    // Request permission as soon as the component mounts
    if (permission === 'default') {
      requestPermission();
    }
  }, [permission, requestPermission]);

  useEffect(() => {
    if (permission === 'granted') {
      alerts.forEach(alert => {
        // If we haven't shown this alert before, show it and add to the set.
        if (!shownAlerts.current.has(alert.id)) {
          showNotification(alert.message, {
            body: alert.type === 'medicine' ? `Take your dose at ${alert.time}` : `Quantity: ${alert.item.quantity}`,
            tag: alert.id, // Using a tag prevents duplicate notifications for the same alert
            renotify: true, // Renotify even if a notification with the same tag is active
          } as NotificationOptions); // <-- Cast to NotificationOptions to bypass the TS definition limitation
          
          shownAlerts.current.add(alert.id);
        }
      });
    }
  }, [alerts, permission, showNotification]);

  // This component doesn't render anything itself, it just provides the alert logic.
  return <>{children}</>;
}
