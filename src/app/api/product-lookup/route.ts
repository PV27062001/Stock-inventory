import { NextResponse } from 'next/server';

// "Not found" is a normal answer here, not an error: the app then asks for the name once and
// remembers the barcode. Sources are tried in order and only the barcode number is sent to them.
//
// Scanbot is the only source that covers Indian packs well. It is the undocumented endpoint behind
// their free lookup page, so it can change or block us at any time; the other sources must keep
// working without it. Keep the volume low and never disguise these requests.
const SCANBOT = 'https://scanbot.io/wp-json/upc/v1/lookup';
const OPEN_FOOD_FACTS = 'https://world.openfoodfacts.org/api/v2/product';
const UPC_ITEM_DB = 'https://api.upcitemdb.com/prod/trial/lookup'; // free tier: 100 lookups a day, no key

const TIMEOUT_MS = 6000;
const SCANBOT_CACHE_SECONDS = 30 * 86400;

type Product = {
  product_name?: string;
  product_name_en?: string;
  abbreviated_product_name?: string;
  generic_name?: string;
  generic_name_en?: string;
  brands?: string;
  quantity?: string;
};

// "Britannia" + "Jimjam 460g" -> "Britannia Jimjam 460g", without repeating the brand or the size.
function displayName(p: Product): string {
  const product = [p.product_name, p.product_name_en, p.abbreviated_product_name, p.generic_name, p.generic_name_en]
    .map((name) => name?.trim())
    .find(Boolean) ?? '';
  if (!product) return '';
  const brand = p.brands?.split(',')[0]?.trim() ?? '';
  const size = p.quantity?.trim() ?? '';
  const flat = (text: string) => text.toLowerCase().replace(/\s/g, '');
  const parts = [product];
  if (brand && !flat(product).includes(flat(brand))) parts.unshift(brand);
  if (size && !flat(product).includes(flat(size))) parts.push(size);
  return parts.join(' ');
}

async function fromScanbot(code: string): Promise<string> {
  const res = await fetch(`${SCANBOT}/${code}`, {
    headers: { 'User-Agent': 'SriAmmanApp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: SCANBOT_CACHE_SECONDS },
  });
  if (res.status === 404) return '';
  if (!res.ok) throw new Error(`Scanbot: ${res.status}`);
  const data = await res.json();
  return data.product?.name?.trim() ?? '';
}

async function fromOpenFoodFacts(code: string): Promise<string> {
  const fields = 'product_name,product_name_en,abbreviated_product_name,generic_name,generic_name_en,brands,quantity';
  const res = await fetch(`${OPEN_FOOD_FACTS}/${code}.json?fields=${fields}`, {
    headers: { 'User-Agent': 'SriAmmanApp/1.0' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 86400 },
  });
  if (!res.ok && res.status !== 404) throw new Error(`Open Food Facts: ${res.status}`);
  const data = await res.json();
  return data.status === 1 && data.product ? displayName(data.product) : '';
}

async function fromUpcItemDb(code: string): Promise<string> {
  const res = await fetch(`${UPC_ITEM_DB}?upc=${code}`, {
    headers: { Accept: 'application/json' },
    signal: AbortSignal.timeout(TIMEOUT_MS),
    next: { revalidate: 86400 },
  });
  if (!res.ok && res.status !== 404) throw new Error(`UPCitemdb: ${res.status}`);
  const data = await res.json();
  return data.items?.[0]?.title?.trim() ?? '';
}

export async function GET(request: Request) {
  // Other websites must not be able to run lookups through this app.
  const site = request.headers.get('sec-fetch-site');
  if (site && site !== 'same-origin') {
    return NextResponse.json({ error: 'Not allowed' }, { status: 403 });
  }

  const code = new URL(request.url).searchParams.get('code') ?? '';
  if (!/^\d{8,14}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 });
  }

  let failures = 0;
  const sources = [fromScanbot, fromOpenFoodFacts, fromUpcItemDb];
  for (const source of sources) {
    try {
      const name = await source(code);
      if (name) return NextResponse.json({ found: true, name });
    } catch {
      failures += 1;
    }
  }
  if (failures === sources.length) {
    return NextResponse.json({ found: false, unavailable: true }, { status: 502 });
  }
  return NextResponse.json({ found: false, name: '' });
}
