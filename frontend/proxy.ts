import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { API_URL, AUTH_COOKIE_NAME } from "@/lib/constants";

const PROTECTED: { root: string; login: string; admin?: boolean }[] = [
  { root: "/admin", login: "/admin/login", admin: true },
  { root: "/account", login: "/login" },
  { root: "/checkout", login: "/login" },
];

function redirectToLogin(request: NextRequest, login: string) {
  const url = request.nextUrl.clone();
  url.pathname = login;
  url.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/login" || pathname === "/admin/login") {
    return NextResponse.next();
  }

  const guard = PROTECTED.find(
    ({ root }) => pathname === root || pathname.startsWith(root + "/"),
  );
  if (!guard) return NextResponse.next();

  const token = request.cookies.get(AUTH_COOKIE_NAME)?.value;
  if (!token) return redirectToLogin(request, guard.login);

  // Skip prefetch checks so storefront link hover doesn't hit the backend.
  if (request.headers.get("purpose") === "prefetch") {
    return NextResponse.next();
  }

  if (guard.admin) {
    try {
      const res = await fetch(`${API_URL}/auth/me`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      const payload = (await res.json()) as { data?: { is_admin?: boolean } };
      if (!res.ok || !payload.data?.is_admin) {
        return redirectToLogin(request, guard.login);
      }
    } catch {
      return redirectToLogin(request, guard.login);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*", "/checkout/:path*"],
};