import { SignJWT, jwtVerify } from "jose";

const COOKIE = "prec_admin";

/** Fallback se ADMIN_JWT_SECRET não estiver definido (mesmo valor usado no middleware). */
const EMBEDDED_JWT_SECRET = "precotacao-cotacoes-jwt-secret-hardcoded-2026";

function resolveJwtSecret(): string {
  const env = process.env.ADMIN_JWT_SECRET?.trim();
  if (env && env.length >= 16) return env;
  return EMBEDDED_JWT_SECRET;
}

export function getAdminJwtSecretKey(): Uint8Array {
  return new TextEncoder().encode(resolveJwtSecret());
}

function secretKey() {
  return getAdminJwtSecretKey();
}

export async function createAdminToken(): Promise<string> {
  return new SignJWT({ role: "admin" })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(secretKey());
}

export async function verifyAdminToken(token: string): Promise<boolean> {
  try {
    await jwtVerify(token, secretKey());
    return true;
  } catch {
    return false;
  }
}

export { COOKIE };
