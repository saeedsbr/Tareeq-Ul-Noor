import { NextRequest, NextResponse } from 'next/server';

/** Signed-in visitors skip the marketing/login pages. This only routes; the API still enforces all access. */
export function middleware(req: NextRequest) {
  const token = req.cookies.get('ilm_token')?.value;
  if (!token) return NextResponse.next();
  try {
    const payload = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')));
    if (payload.exp && payload.exp * 1000 < Date.now()) return NextResponse.next();
    const dest = payload.role === 'ADMIN' ? '/admin' : '/dashboard';
    return NextResponse.redirect(new URL(dest, req.url));
  } catch {
    return NextResponse.next();
  }
}

export const config = { matcher: ['/', '/login', '/register'] };
