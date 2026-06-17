import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const path = req.nextUrl.pathname

    // Redirect if trying to access admin routes without admin role
        if (path.startsWith('/admin') && token?.role !== 'ADMIN' && token?.role !== 'OFFICE_USER') {
  return NextResponse.redirect(new URL('/department/dashboard', req.url))
}

    // Redirect if trying to access department routes without department role
    if (path.startsWith('/department') && token?.role !== 'DEPARTMENT') {
      return NextResponse.redirect(new URL('/admin/dashboard', req.url))
    }
    


    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token,
    },
  }
)

export const config = {
  matcher: [
    '/admin/:path*',
    '/department/:path*',
    '/api/students/:path*',
    '/api/payments/:path*',
    '/api/dashboard/:path*',
    '/api/archive/:path*',
    '/api/users/:path*',
  ]
}