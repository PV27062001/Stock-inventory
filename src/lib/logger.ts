const isDev = process.env.NODE_ENV !== 'production';

/**
 * Dev-only logging. In production nothing reaches the console, so Firestore
 * index URLs, project ids and stack traces are never shown to a user.
 */
export const logger = {
  debug: (...args: unknown[]) => {
    if (isDev) console.debug(...args);
  },
  warn: (...args: unknown[]) => {
    if (isDev) console.warn(...args);
  },
  error: (...args: unknown[]) => {
    if (isDev) console.error(...args);
  },
};

/** Message safe to show a user; never contains provider details. */
export const SAFE_ERROR = 'Something went wrong. Please try again.';

/**
 * Strips URLs, project ids and provider error codes from anything that might
 * reach the UI, so a Firebase message can never expose infrastructure details.
 */
export function safeMessage(fallback: string = SAFE_ERROR): string {
  return fallback;
}

/** True when the failure is a missing Firestore composite index. */
export function isMissingIndexError(error: unknown): boolean {
  const code = (error as { code?: string })?.code;
  const message = (error as { message?: string })?.message ?? '';
  return code === 'failed-precondition' || message.includes('requires an index');
}
