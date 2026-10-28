import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { RENTALS_ENABLED, RENTAL_ROUTE_PREFIXES } from '@/lib/features';

// When rentals are disabled, every rental route 404s regardless of how it is reached.
export function middleware(request: NextRequest) {
  if (RENTALS_ENABLED) {
    return NextResponse.next();
  }

  const { pathname } = request.nextUrl;
  const isRentalRoute = RENTAL_ROUTE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`)
  );

  if (isRentalRoute) {
    return NextResponse.rewrite(new URL('/_not-found', request.url), { status: 404 });
  }

  return NextResponse.next();
}

export const config = {
  matcher: '/kirayabook/:path*',
};
