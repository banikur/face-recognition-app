import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // Protect admin routes
  if (pathname.startsWith("/admin")) {
    try {
      // Fetch session from API to avoid importing database in middleware (Edge runtime)
      // verify session via API
      const response = await fetch(`${request.nextUrl.origin}/api/auth/session`, {
        headers: {
          cookie: request.headers.get("cookie") || "",
        },
      });
      const session = await response.json();

      const data = session as { user?: { email: string } } | null;
      if (!data?.user) {
        const loginUrl = new URL("/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error("Middleware auth check failed:", error);
      // In case of error (e.g. during build or server start), redirect to login to be safe
      const loginUrl = new URL("/login", request.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
