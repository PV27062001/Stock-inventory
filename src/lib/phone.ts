// Indian mobile validation. Numbers are stored as bare 10 digits so existing
// records, WhatsApp links and tel: links keep working unchanged.

export const normalizeMobile = (input: string): string => {
  const digits = (input || '').replace(/\D/g, '');
  // Tolerate pasted numbers with a country code or a trunk-prefixed 0.
  if (digits.length === 12 && digits.startsWith('91')) return digits.slice(2);
  if (digits.length === 11 && digits.startsWith('0')) return digits.slice(1);
  return digits;
};

/** Indian mobiles are 10 digits starting 6-9. */
export const isValidMobile = (input: string): boolean => /^[6-9]\d{9}$/.test(normalizeMobile(input));

export const mobileError = (input: string): string => {
  const digits = normalizeMobile(input);
  if (!digits) return 'Mobile number is required.';
  if (digits.length !== 10) return `Mobile number must be 10 digits (you entered ${digits.length}).`;
  if (!/^[6-9]/.test(digits)) return 'Indian mobile numbers start with 6, 7, 8 or 9.';
  return '';
};

export const formatMobile = (input: string): string => {
  const d = normalizeMobile(input);
  return d.length === 10 ? `${d.slice(0, 5)} ${d.slice(5)}` : input;
};

export const toCallNumber = (mobile: string) => `+91${normalizeMobile(mobile)}`;
export const toWhatsAppNumber = (mobile: string) => normalizeMobile(mobile);

/** Numbers unconfirmed for this long are shown as stale. */
export const VERIFY_STALE_DAYS = 180;

export const isVerificationStale = (verifiedAt?: Date | null): boolean => {
  if (!verifiedAt) return true;
  const days = (Date.now() - verifiedAt.getTime()) / 86_400_000;
  return days > VERIFY_STALE_DAYS;
};
