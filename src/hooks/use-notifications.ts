import { logger } from '@/lib/logger';

import { useState, useEffect } from 'react';
import {
  isNativeApp,
  checkNativeNotifyPermission,
  requestNativeNotifyPermission,
  showNativeNotification,
} from '@/lib/native';

const ENABLED_KEY = 'notifications-enabled';

export function useNotifications() {
  const [permission, setPermission] = useState('default');
  // App-level mute switch, independent of the browser permission (which can't be revoked via JS).
  const [enabled, setEnabledState] = useState(true);

  useEffect(() => {
    if (isNativeApp()) {
      // The Android WebView has no Notification API; ask the native plugin instead.
      checkNativeNotifyPermission().then(setPermission).catch((e) => logger.warn('Notification permission check failed:', e));
    } else if (typeof window !== 'undefined' && 'Notification' in window) {
      // Guard: some in-app webviews don't expose the Notification API.
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
    if (isNativeApp()) {
      const status = await requestNativeNotifyPermission();
      setPermission(status);
      if (status === 'granted') setEnabled(true);
      return;
    }

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

    if (isNativeApp()) {
      showNativeNotification(title, options?.body).catch((e) => logger.error('Failed to show notification:', e));
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
