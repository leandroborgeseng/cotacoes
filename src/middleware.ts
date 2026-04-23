import { NextResponse, type NextRequest } from "next/server";
import { jwtVerify } from "jose";
import { COOKIE } from "@/lib/admin-jwt";

function secret() {
  const s = process.env.ADMIN_JWT_SECRET;
  if (!s || s.length < 16) return null;
  return new TextEncoder().encode(s);
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
  if (!key) {
    if (path.startsWith("/api/")) {
      return NextResponse.json({ error: "ADMIN_JWT_SECRET não configurado." }, { status: 500 });
    }
    return NextResponse.redirect(new URL("/admin/login", req.url));
  }

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
