import { NextResponse } from 'next/server';

// 1 troy ounce in grams — used to convert spot (per-ounce) prices to per-gram.
const OUNCE_TO_GRAM = 31.1034768;

// Cache upstream rate for 5 minutes to stay fast and avoid hammering the source.
export const revalidate = 300;

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

type Result = { gold24: number; gold22: number; silver: number; updatedAt: string; source: string };

const RUPEE = /(?:&#x20b9;|&#8377;|\u20B9)\s*([\d,]+)/g;

// Pull the rupee amounts from the first data row under a table heading.
function firstRowRupees(html: string, heading: string, count: number): number[] {
  const hi = html.indexOf(heading);
  if (hi < 0) return [];
  const tbodyI = html.indexOf('<tbody', hi);
  if (tbodyI < 0) return [];
  const rowEnd = html.indexOf('</tr>', tbodyI);
  const row = html.slice(tbodyI, rowEnd < 0 ? tbodyI + 600 : rowEnd);
  const nums = [...row.matchAll(RUPEE)].map((m) => parseInt(m[1].replace(/,/g, ''), 10));
  return nums.filter((n) => !isNaN(n)).slice(0, count);
}

async function fetchPage(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: {
      'User-Agent': UA,
      Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-IN,en;q=0.9',
    },
    next: { revalidate: 300 },
  });
  if (!res.ok) throw new Error(`upstream ${res.status}`);
  return res.text();
}

// Primary: GoodReturns Coimbatore retail rates (what jewellers quote).
async function fromGoodReturns(): Promise<Result> {
  const [goldHtml, silverHtml] = await Promise.all([
    fetchPage('https://www.goodreturns.in/gold-rates/coimbatore.html'),
    fetchPage('https://www.goodreturns.in/silver-rates/coimbatore.html').catch(() => ''),
  ]);

  const [gold24, gold22] = firstRowRupees(goldHtml, 'Last 10 Days (1 gram)', 2);
  if (!gold24 || !gold22) throw new Error('gold parse failed');

  // Silver table columns: 10 gram, 100 gram, 1 Kg → per gram = 10g / 10.
  const silver10g = silverHtml
    ? firstRowRupees(silverHtml, 'Silver Rate in Coimbatore for Last 10 Days', 1)[0]
    : 0;
  const silver = silver10g ? silver10g / 10 : 0;

  return {
    gold24,
    gold22,
    silver,
    updatedAt: new Date().toISOString(),
    source: 'GoodReturns \u00b7 Coimbatore',
  };
}

// Fallback: international spot (USD/oz) converted to INR per gram.
async function fromSpot(): Promise<Result> {
  const [xauRes, xagRes, fxRes] = await Promise.all([
    fetch('https://api.gold-api.com/price/XAU', { headers: { 'User-Agent': UA }, next: { revalidate: 300 } }),
    fetch('https://api.gold-api.com/price/XAG', { headers: { 'User-Agent': UA }, next: { revalidate: 300 } }),
    fetch('https://open.er-api.com/v6/latest/USD', { headers: { 'User-Agent': UA }, next: { revalidate: 3600 } }),
  ]);
  if (!xauRes.ok || !fxRes.ok) throw new Error('spot upstream');
  const xau = await xauRes.json();
  const xag = xagRes.ok ? await xagRes.json() : { price: 0 };
  const fx = await fxRes.json();
  const usdInr = fx?.rates?.INR;
  if (!xau?.price || !usdInr) throw new Error('spot incomplete');
  const gold24 = (xau.price * usdInr) / OUNCE_TO_GRAM;
  return {
    gold24,
    gold22: gold24 * (22 / 24),
    silver: (xag.price * usdInr) / OUNCE_TO_GRAM,
    updatedAt: new Date().toISOString(),
    source: 'Spot (approx)',
  };
}

export async function GET() {
  let r: Result | null = null;
  try {
    r = await fromGoodReturns();
  } catch {
    try {
      r = await fromSpot();
    } catch {
      return NextResponse.json({ error: 'Failed to fetch live rates' }, { status: 502 });
    }
  }

  return NextResponse.json({
    currency: 'INR',
    city: 'Coimbatore',
    updatedAt: r.updatedAt,
    goldPerGram: {
      '24': r.gold24,
      '22': r.gold22,
      '18': r.gold24 * (18 / 24),
    },
    silverPerGram: r.silver,
    source: r.source,
  });
}
