import { updateSession } from "@/lib/supabase/middleware"
import type { NextRequest } from "next/server"

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: ["/dashboard/:path*", "/upload/:path*", "/chat/:path*", "/write/:path*", "/sources/:path*"],
}
