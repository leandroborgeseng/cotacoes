import { timingSafeEqual } from "node:crypto";

/** Senha do painel admin (fixa no código). */
const ADMIN_PASSWORD_EMBEDDED = "QuaseSemSenha!";

export function verifyAdminPassword(plain: string): boolean {
  const expected = ADMIN_PASSWORD_EMBEDDED;
  const a = Buffer.from(plain, "utf8");
  const b = Buffer.from(expected, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}
