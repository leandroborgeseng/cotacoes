/** Quantidade máxima de dígitos (centavos) para evitar valores absurdos e overflow. */
export const MAX_BRL_CENT_DIGITS = 15;

export function sanitizeBrlCentDigits(raw: string): string {
  return raw.replace(/\D/g, "").slice(0, MAX_BRL_CENT_DIGITS);
}

/** Exibe valor em pt-BR a partir de uma cadeia de dígitos que representa centavos (ex.: "1234" → 12,34). */
export function formatBrlFromCentsDigits(digits: string): string {
  const clean = sanitizeBrlCentDigits(digits);
  if (!clean) return "";
  const n = BigInt(clean);
  const hundred = BigInt(100);
  const intPart = n / hundred;
  const frac = n % hundred;
  const intStr = intPart.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  const dec = frac.toString().padStart(2, "0");
  return `${intStr},${dec}`;
}

/** Converte valor em reais (API/número) para dígitos de centavos usados no input. */
export function reaisToCentsDigitString(reais: unknown): string {
  if (reais == null || reais === "") return "";
  const n = typeof reais === "string" ? Number(reais) : Number(reais);
  if (!Number.isFinite(n) || n <= 0) return "";
  const cents = Math.round(n * 100);
  if (!Number.isFinite(cents) || cents <= 0) return "";
  return String(cents);
}

/** Converte dígitos de centavos em número (reais) para envio à API. */
export function centsDigitStringToNumber(digits: string): number {
  const clean = sanitizeBrlCentDigits(digits);
  if (!clean) return NaN;
  return Number(BigInt(clean)) / 100;
}
