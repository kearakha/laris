import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ROLE_REDIRECTS: Record<string, string> = {
  super_admin: "/superadmin/tenants",
  tenant_owner: "/dashboard",
  outlet_manager: "/outlet/pos",
  supervisor: "/outlet/pos",
  kasir: "/outlet/pos",
  inventory_staff: "/outlet/inventory",
  kitchen_staff: "/outlet/kds",
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths — no auth required
  if (
    pathname === "/" ||
    pathname === "/login" ||
    pathname.startsWith("/order/")
  ) {
    return NextResponse.next();
  }

  // Static and API paths
  if (pathname.startsWith("/_next") || pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  const token = request.cookies.get("laris_token")?.value;
  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

export { ROLE_REDIRECTS };
