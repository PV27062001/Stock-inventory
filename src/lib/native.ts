// Helpers for running inside the Android app (Capacitor shell that loads this site).
// The native bridge is injected into the live site by the shell, so these work on the
// deployed web code. In a normal browser every helper falls back to a no-op / web API.

type CapacitorGlobal = { isNativePlatform?: () => boolean };

/** True only inside the Sri Amman Android app. */
export const isNativeApp = (): boolean => {
  if (typeof window === 'undefined') return false;
  const cap = (window as unknown as { Capacitor?: CapacitorGlobal }).Capacitor;
  return cap?.isNativePlatform?.() === true;
};

export type NotifyPermission = 'granted' | 'denied' | 'default';

const toPermission = (state: string): NotifyPermission =>
  state === 'granted' ? 'granted' : state === 'denied' ? 'denied' : 'default';

/** Notification permission via the Android plugin (the WebView has no Notification API). */
export const checkNativeNotifyPermission = async (): Promise<NotifyPermission> => {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const { display } = await LocalNotifications.checkPermissions();
  return toPermission(display);
};

export const requestNativeNotifyPermission = async (): Promise<NotifyPermission> => {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  const { display } = await LocalNotifications.requestPermissions();
  return toPermission(display);
};

export const showNativeNotification = async (title: string, body?: string) => {
  const { LocalNotifications } = await import('@capacitor/local-notifications');
  await LocalNotifications.schedule({
    // Ids must fit in a 32-bit int.
    notifications: [{ id: Date.now() % 2_000_000_000, title, body: body || '' }],
  });
};

/** The installed APK's versionCode, used to tell the user a newer shell exists. */
export const getNativeBuild = async (): Promise<number | null> => {
  const { App } = await import('@capacitor/app');
  const { build } = await App.getInfo();
  const value = parseInt(build, 10);
  return Number.isNaN(value) ? null : value;
};
