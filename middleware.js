import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const sessionToken = request.cookies.get('admin_session')?.value;

  if (pathname.startsWith('/admin/dashboard') && !sessionToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }
  if (pathname === '/admin/login' && sessionToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/login']
};
