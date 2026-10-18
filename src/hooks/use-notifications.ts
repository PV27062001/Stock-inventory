import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';

const ENABLED_KEY = 'notifications-enabled';

export function useNotifications() {
  const [permission, setPermission] = useState('default');
  // App-level mute switch, independent of the browser permission (which can't be revoked via JS).
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    // Guard: some in-app webviews don't expose the Notification API.
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setPermission(Notification.permission);
    }
    if (typeof window !== 'undefined') {
      const stored = window.localStorage.getItem(ENABLED_KEY);
      if (stored !== null) setEnabledState(stored === 'true');
    }
  }, []);

  const setEnabled = (value: boolean) => {
    setEnabledState(value);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(ENABLED_KEY, String(value));
    }
  };

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      logger.error("This browser does not support desktop notification");
      return;
    }

    const status = await Notification.requestPermission();
    setPermission(status);
    if (status === 'granted') setEnabled(true);
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted' || !enabled) {
      logger.warn("Notification permission not granted or notifications muted.");
      return;
    }

    const notification = new Notification(title, options);

    // Optional: handle clicks on the notification
    notification.onclick = () => {
        window.focus(); // Focus the window when the notification is clicked
        // You could also navigate to a specific page, e.g., window.location.href = '/alerts';
    };
  };

  return { requestPermission, showNotification, permission, enabled, setEnabled };
}
