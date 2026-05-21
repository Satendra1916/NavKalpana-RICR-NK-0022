// frontend/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // protect dashboard
  if (pathname.startsWith("/dashboard")) {
    const hasSession = req.cookies.get("connect.sid")?.value;

    if (!hasSession) {
      const url = req.nextUrl.clone();
      url.pathname = "/login"; // ✅ redirect to login (NOT signup)
      return NextResponse.redirect(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*"],
};