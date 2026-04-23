import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE, getAdminJwtSecretKey } from "@/lib/admin-jwt";

function secret() {
  return getAdminJwtSecretKey();
}

export async function middleware(req: NextRequest) {
  const path = req.nextUrl.pathname;
  if (path === "/admin/login" || path === "/api/admin/login") {
    return NextResponse.next();
  }
  if (!path.startsWith("/admin") && !path.startsWith("/api/admin")) {
    return NextResponse.next();
  }

  const key = secret();
  const token = req.cookies.get(COOKIE)?.value;
  if (!token) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

  try {
    await jwtVerify(token, key);
    return NextResponse.next();
  } catch {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "Sessão inválida." }, { status: 401 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }
}

export const config = {
  matcher: ["/admin/:path*", "/api/admin/:path*"],
};
