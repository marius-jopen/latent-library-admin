import { NextResponse, type NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname.startsWith('/admin') || pathname.startsWith('/api/images')) {
    const isAdmin = request.cookies.get('admin')?.value === '1';
    if (!isAdmin) {
      const loginUrl = new URL('/login', request.url);
      // preserve intended path
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/images/:path*'],
};


