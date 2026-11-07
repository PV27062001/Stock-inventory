export type ScannedCode = { code: string; expiry?: string };

// GS1 fields with a fixed length; batch (10) and serial (21) run to a separator or the end.
const FIXED_FIELDS: Record<string, number> = { '01': 14, '11': 6, '15': 6, '17': 6 };
const GROUP_SEPARATOR = '\u001d';

// A 14-digit GTIN starting with 0 is the same product as the 13-digit EAN on the pack.
const toProductNumber = (gtin: string) => gtin.replace(/^0/, '');

// YYMMDD -> YYYY-MM-DD. Day 00 means the last day of that month.
function toDate(value: string): string | undefined {
  const year = 2000 + Number(value.slice(0, 2));
  const month = Number(value.slice(2, 4));
  const day = Number(value.slice(4, 6)) || new Date(Date.UTC(year, month, 0)).getUTCDate();
  const date = new Date(Date.UTC(year, month - 1, day));
  if (month < 1 || month > 12 || date.getUTCMonth() !== month - 1) return undefined;
  return date.toISOString().slice(0, 10);
}

function readFields(text: string): Record<string, string> {
  const fields: Record<string, string> = {};
  let position = 0;
  while (position < text.length) {
    if (text[position] === GROUP_SEPARATOR) {
      position += 1;
      continue;
    }
    const field = text.slice(position, position + 2);
    position += 2;
    const length = FIXED_FIELDS[field];
    if (length) {
      fields[field] = text.slice(position, position + length);
      position += length;
    } else if (field === '10' || field === '21') {
      const end = text.indexOf(GROUP_SEPARATOR, position);
      position = end === -1 ? text.length : end;
    } else {
      break;
    }
  }
  return fields;
}

/**
 * Finds the product number in what a scanner read: a plain EAN / UPC, or the GS1 text that medicine
 * packs carry in a Data Matrix or QR code, which can also hold the expiry date. Returns null when
 * the code has no product number, such as a QR code holding a website link.
 */
export function parseScannedCode(raw: string): ScannedCode | null {
  const text = raw.trim().replace(/^\]([a-zA-Z]\d)/, '');
  if (/^\d{8,14}$/.test(text)) return { code: text };

  const fields: Record<string, string | undefined> = /^\(\d{2}\)/.test(text)
    ? { '01': text.match(/\(01\)(\d{14})/)?.[1], '17': text.match(/\(17\)(\d{6})/)?.[1] }
    : readFields(text);
  const gtin = /^\d{14}$/.test(fields['01'] ?? '') ? fields['01'] : text.match(/\/01\/(\d{14})/)?.[1];
  if (!gtin) return null;

  const expiry = /^\d{6}$/.test(fields['17'] ?? '') ? toDate(fields['17'] as string) : undefined;
  return { code: toProductNumber(gtin), expiry };
}
