import { NextResponse } from 'next/server';

// Disabled: debug endpoint removed. Use /api/metal-rates instead.
export async function GET() {
  return NextResponse.json({ error: 'Not found' }, { status: 404 });
}
