import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // 1. Tambahkan HTTP Security Headers standar industri
  response.headers.set('X-DNS-Prefetch-Control', 'on');
  response.headers.set('X-Frame-Options', 'SAMEORIGIN'); // Cegah Clickjacking
  response.headers.set('X-Content-Type-Options', 'nosniff'); // Cegah MIME sniffing
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), browsing-topics=()'
  );
  response.headers.set(
    'X-XSS-Protection',
    '1; mode=block'
  );

  // 2. Proteksi Halaman Administrasi (Redirect ke /login jika tidak ada session token)
  const isAuthRoute = pathname.startsWith('/login') || pathname.startsWith('/api/auth');
  const isStaticOrPublic =
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.');

  const sessionToken = request.cookies.get('church_session_token')?.value;

  if (!sessionToken && !isAuthRoute && !isStaticOrPublic) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('redirect', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Jika sudah login dan mengakses /login, arahkan ke dashboard /
  if (sessionToken && pathname === '/login') {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
