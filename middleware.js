import { NextResponse } from 'next/server';

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const adminToken = request.cookies.get('admin_token')?.value;

  if (pathname.startsWith('/admin/dashboard') && !adminToken) {
    return NextResponse.redirect(new URL('/admin/login', request.url));
  }

  if (pathname === '/admin/login' && adminToken) {
    return NextResponse.redirect(new URL('/admin/dashboard', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/dashboard/:path*', '/admin/login'],
};
