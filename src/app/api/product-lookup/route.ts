import { NextResponse } from 'next/server';

// Open Food Facts: free product database. Coverage of Indian packs is partial, so "not found" is
// a normal answer here, not an error. Only the barcode number is sent, never any user data.
const PRODUCT_API = 'https://world.openfoodfacts.org/api/v2/product';

type Product = { product_name?: string; brands?: string; quantity?: string };

// "Britannia" + "Jimjam 460g" -> "Britannia Jimjam 460g", without repeating the brand or the size.
function displayName({ product_name, brands, quantity }: Product): string {
  const product = product_name?.trim() ?? '';
  if (!product) return '';
  const brand = brands?.split(',')[0]?.trim() ?? '';
  const size = quantity?.trim() ?? '';
  const flat = (text: string) => text.toLowerCase().replace(/\s/g, '');
  const parts = [product];
  if (brand && !flat(product).includes(flat(brand))) parts.unshift(brand);
  if (size && !flat(product).includes(flat(size))) parts.push(size);
  return parts.join(' ');
}

export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get('code') ?? '';
  if (!/^\d{8,14}$/.test(code)) {
    return NextResponse.json({ error: 'Invalid barcode' }, { status: 400 });
  }

  try {
    const res = await fetch(`${PRODUCT_API}/${code}.json?fields=product_name,brands,quantity`, {
      headers: { 'User-Agent': 'SriAmmanApp/1.0' },
      signal: AbortSignal.timeout(6000),
      next: { revalidate: 86400 },
    });
    if (!res.ok && res.status !== 404) throw new Error(`Lookup failed: ${res.status}`);
    const data = await res.json();
    const name = data.status === 1 && data.product ? displayName(data.product) : '';
    return NextResponse.json({ found: !!name, name });
  } catch {
    return NextResponse.json({ found: false, unavailable: true }, { status: 502 });
  }
}
