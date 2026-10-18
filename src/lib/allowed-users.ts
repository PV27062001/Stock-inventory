// Only these Google accounts may use the app. Set NEXT_PUBLIC_ALLOWED_EMAILS in
// .env as a comma-separated list, e.g. "amma@gmail.com,appa@gmail.com".
// This is a UX gate only — Firestore rules must enforce the same list server-side.
const RAW = process.env.NEXT_PUBLIC_ALLOWED_EMAILS || '';

export const ALLOWED_EMAILS = RAW.split(',')
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export const isEmailAllowed = (email?: string | null): boolean => {
  // An empty allowlist means the gate is not configured yet, so allow everyone.
  if (ALLOWED_EMAILS.length === 0) return true;
  if (!email) return false;
  return ALLOWED_EMAILS.includes(email.toLowerCase());
};
