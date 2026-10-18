const ONES = [
  '', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten',
  'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen',
];
const TENS = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

function wordsUnderThousand(n: number): string {
  let w = '';
  if (n >= 100) {
    w = `${ONES[Math.floor(n / 100)]} Hundred`;
    n %= 100;
    if (n) w += ' and ';
  }
  if (n < 20) w += ONES[n];
  else w += TENS[Math.floor(n / 10)] + (n % 10 ? ` ${ONES[n % 10]}` : '');
  return w;
}

function integerWords(n: number): string {
  if (n === 0) return 'Zero';
  const parts: string[] = [];
  for (const [size, label] of [[10000000, 'Crore'], [100000, 'Lakh'], [1000, 'Thousand']] as const) {
    if (n >= size) {
      parts.push(`${integerWords(Math.floor(n / size))} ${label}`);
      n %= size;
    }
  }
  if (n) parts.push(wordsUnderThousand(n));
  return parts.join(' ');
}

/** Indian numbering (Crore/Lakh) amount in words, e.g. "Four Thousand Two Hundred Rupees Only". */
export function amountInWords(value: number): string {
  const paise = Math.round(Math.abs(Number(value) || 0) * 100);
  const rupees = Math.floor(paise / 100);
  const remainder = paise % 100;
  return `${integerWords(rupees)} Rupees${remainder ? ` and ${wordsUnderThousand(remainder)} Paise` : ''} Only`;
}
