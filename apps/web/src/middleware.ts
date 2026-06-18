import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const CUSTOMER_ROUTES = ['/fabrics', '/rooms', '/render', '/history'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const token = request.cookies.get('token')?.value;

  // Protect /admin routes
  if (pathname.startsWith('/admin')) {
    if (pathname === '/admin/login') return NextResponse.next();
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/admin/login';
      return NextResponse.redirect(url);
    }
    return NextResponse.next();
  }

  // Protect customer routes
  const isCustomerRoute = CUSTOMER_ROUTES.some(route => pathname.startsWith(route));
  
  if (isCustomerRoute) {
    if (!token) {
      const url = request.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
