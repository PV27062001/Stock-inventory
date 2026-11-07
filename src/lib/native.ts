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

export type SystemBarsStyle = {
  statusColor: string;
  navColor?: string;
};

/**
 * Colours the Android status / navigation bars (SystemBarsPlugin in the APK), which picks the icon
 * colour itself from what it paints. APKs built before the plugin existed reject the call, which
 * is ignored.
 */
export const setNativeSystemBars = async (style: SystemBarsStyle) => {
  const { registerPlugin } = await import('@capacitor/core');
  const SystemBars = registerPlugin<{ setStyle: (s: SystemBarsStyle) => Promise<void> }>('SystemBars');
  await SystemBars.setStyle(style).catch(() => {});
};

export type NativeScanResult = { code?: string; typed?: boolean; cancelled?: boolean; error?: string };

/** First APK whose scanner is built in. Older ones depend on a Google download that can fail. */
export const BUILT_IN_SCANNER_BUILD = 6;

/**
 * Scans with the camera screen in the APK (NativeBarcodePlugin). Returns null outside the app. A
 * failure comes back as `error` so the person sees the reason instead of a silent fallback.
 */
export const scanNativeBarcode = async (): Promise<NativeScanResult | null> => {
  if (!isNativeApp()) return null;
  const { registerPlugin } = await import('@capacitor/core');
  const NativeBarcode = registerPlugin<{ scan: () => Promise<NativeScanResult> }>('NativeBarcode');
  return NativeBarcode.scan().catch((e: Error) => ({ error: e?.message || 'The scanner could not start' }));
};

/** The installed APK's versionCode, used to tell the user a newer shell exists. */
export const getNativeBuild = async (): Promise<number | null> => {
  const { App } = await import('@capacitor/app');
  const { build } = await App.getInfo();
  const value = parseInt(build, 10);
  return Number.isNaN(value) ? null : value;
};
