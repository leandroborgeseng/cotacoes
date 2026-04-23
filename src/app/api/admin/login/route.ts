import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { COOKIE, createAdminToken } from "@/lib/admin-jwt";
import { verifyAdminPassword } from "@/lib/password";

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "JSON inválido." }, { status: 400 });
  }
  const password = typeof body === "object" && body && "password" in body ? String((body as { password: unknown }).password) : "";
  if (!verifyAdminPassword(password)) {
    return NextResponse.json({ error: "Credenciais inválidas." }, { status: 401 });
  }
  const token = await createAdminToken();
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 8,
  });
  return NextResponse.json({ ok: true });
}
