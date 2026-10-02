
import { useState, useEffect } from 'react';

export function useNotifications() {
  const [permission, setPermission] = useState('default');

  useEffect(() => {
    // Set initial permission state
    setPermission(Notification.permission);
  }, []);

  const requestPermission = async () => {
    if (!('Notification' in window)) {
      console.error("This browser does not support desktop notification");
      return;
    }

    const status = await Notification.requestPermission();
    setPermission(status);
  };

  const showNotification = (title: string, options?: NotificationOptions) => {
    if (permission !== 'granted') {
      console.warn("Notification permission not granted.");
      return;
    }

    const notification = new Notification(title, options);

    // Optional: handle clicks on the notification
    notification.onclick = () => {
        window.focus(); // Focus the window when the notification is clicked
        // You could also navigate to a specific page, e.g., window.location.href = '/alerts';
    };
  };

  return { requestPermission, showNotification, permission };
}
