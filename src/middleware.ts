import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 토큰 확인
  const token = request.cookies.get('token')?.value;

  // 정적 파일이나 API 라우트는 제외
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.startsWith('/favicon.ico') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  // 루트 경로만 처리
  if (pathname === '/') {
    if (!token) {
      return NextResponse.redirect(new URL('/auth', request.url));
    } else {
      return NextResponse.next();
    }
  }

  // 로그인 페이지 처리
  if (pathname === '/auth') {
    if (token) {
      return NextResponse.redirect(new URL('/', request.url));
    } else {
      return NextResponse.next();
    }
  }

  // 다른 경로는 그대로 통과
  return NextResponse.next();
}

export const config = {
  matcher: ['/', '/auth']
};
