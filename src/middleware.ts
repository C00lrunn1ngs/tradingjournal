import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Middleware runs in the Edge runtime where jsonwebtoken (Node.js crypto) is unavailable.
// We only check cookie presence here. Full JWT verification happens in every layout and
// API route (Node.js runtime), so an invalid/expired token is still rejected there.

// Duplicated from lib/auth.ts — cannot import that module in Edge (it bundles jsonwebtoken)
const COOKIE_NAME = 'tj_token';

const PUBLIC_PAGE_PATHS = ['/login', '/forgot-password', '/reset-password'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth API routes always pass through
  if (pathname.startsWith('/api/auth')) {
    return NextResponse.next();
  }

  const hasToken = !!request.cookies.get(COOKIE_NAME)?.value;

  // --- API routes: return 401 JSON if no cookie ---
  if (pathname.startsWith('/api/')) {
    if (!hasToken) {
      return NextResponse.json({ error: 'Niet geautoriseerd' }, { status: 401 });
    }
    return NextResponse.next();
  }

  // --- Page routes ---
  if (PUBLIC_PAGE_PATHS.some(p => pathname.startsWith(p))) {
    if (hasToken) return NextResponse.redirect(new URL('/dashboard', request.url));
    return NextResponse.next();
  }

  if (!hasToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
};
