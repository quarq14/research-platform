import { updateSession } from "@/lib/supabase/middleware"
import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Redirect locale-based paths (e.g., /tr, /en) to root
  // Language is handled by LocaleContext, not URL routing
  const localePattern = /^\/(tr|en)(\/|$)/
  if (localePattern.test(pathname)) {
    const newPathname = pathname.replace(localePattern, '/')
    const url = request.nextUrl.clone()
    url.pathname = newPathname || '/'
    return NextResponse.redirect(url)
  }

  // Continue with Supabase session management for protected routes
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Locale redirects
    "/:locale(tr|en)",
    "/:locale(tr|en)/:path*",
    // Protected routes
    "/dashboard/:path*",
    "/upload/:path*",
    "/chat/:path*",
    "/write/:path*",
    "/sources/:path*"
  ],
}
