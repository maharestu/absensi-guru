import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { SESSION_COOKIE_NAME, verifySessionToken } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get(SESSION_COOKIE_NAME)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isAuthenticated = !!session;
  const role = session?.role;

  // 1. Rute Root (/)
  if (pathname === "/") {
    if (!isAuthenticated) {
      return NextResponse.redirect(new URL("/login", request.url));
    }
    if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
    if (role === "kepala_sekolah") return NextResponse.redirect(new URL("/kepsek", request.url));
    if (role === "guru") return NextResponse.redirect(new URL("/guru", request.url));
  }

  // 2. Rute Login (/login)
  if (pathname === "/login") {
    if (isAuthenticated) {
      // Jika sudah login, lempar ke dashboard masing-masing
      if (role === "admin") return NextResponse.redirect(new URL("/admin", request.url));
      if (role === "kepala_sekolah") return NextResponse.redirect(new URL("/kepsek", request.url));
      if (role === "guru") return NextResponse.redirect(new URL("/guru", request.url));
    }
    return NextResponse.next();
  }

  // 3. Rute Khusus Admin (/admin/*)
  if (pathname.startsWith("/admin")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "admin") {
      // Role salah, alihkan ke dashboard miliknya
      const target = role === "kepala_sekolah" ? "/kepsek" : "/guru";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 4. Rute Khusus Guru (/guru/*)
  if (pathname.startsWith("/guru")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "guru") {
      const target = role === "admin" ? "/admin" : "/kepsek";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  // 5. Rute Khusus Kepala Sekolah (/kepsek/*)
  if (pathname.startsWith("/kepsek")) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", request.url);
      loginUrl.searchParams.set("next", pathname);
      return NextResponse.redirect(loginUrl);
    }
    if (role !== "kepala_sekolah") {
      const target = role === "admin" ? "/admin" : "/guru";
      return NextResponse.redirect(new URL(target, request.url));
    }
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/login",
    "/admin/:path*",
    "/guru/:path*",
    "/kepsek/:path*",
  ],
};
