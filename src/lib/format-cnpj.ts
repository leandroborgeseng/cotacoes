/** Apenas dígitos, no máximo 14 (CNPJ). */
export function cnpjDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 14);
}

/** Máscara progressiva: 99.999.999/9999-99 */
export function formatCnpjInput(value: string): string {
  const d = cnpjDigits(value);
  if (d.length <= 2) return d;
  if (d.length <= 5) return `${d.slice(0, 2)}.${d.slice(2)}`;
  if (d.length <= 8) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  if (d.length <= 12) return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

export function cnpjDigitCount(value: string): number {
  return cnpjDigits(value).length;
}
