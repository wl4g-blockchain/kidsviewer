import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Check if the request is for an API route
  if (request.nextUrl.pathname.startsWith('/api/')) {
    // For API routes, we'll let them handle authentication internally
    // The API routes will return 401 if not authenticated
    return NextResponse.next()
  }

  // Skip middleware for login page and static files
  if (request.nextUrl.pathname === '/login' || 
      request.nextUrl.pathname.startsWith('/_next/') ||
      request.nextUrl.pathname.startsWith('/favicon')) {
    return NextResponse.next()
  }

  // For non-API routes, check if user is trying to access protected pages
  const protectedPaths = ['/', '/dashboard', '/settings', '/tenant', '/invitation']
  const isProtectedPath = protectedPaths.includes(request.nextUrl.pathname)
  
  if (isProtectedPath) {
    // Check if there's a session cookie
    const sessionToken = request.cookies.get('next-auth.session-token') || 
                        request.cookies.get('__Secure-next-auth.session-token')
    
    if (!sessionToken) {
      // Redirect to login if no session
      const loginUrl = new URL('/login', request.url)
      loginUrl.searchParams.set('callbackUrl', request.nextUrl.pathname)
      return NextResponse.redirect(loginUrl)
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
