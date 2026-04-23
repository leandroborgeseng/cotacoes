import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

export { MAX_PDF_BYTES } from "@/lib/pdf-constants";

export function assertPdfMagic(buffer: Buffer) {
  if (buffer.length < 5) return false;
  const head = buffer.subarray(0, 5).toString("utf8");
  return head.startsWith("%PDF");
}

export async function saveCotacaoPdf(cotacaoId: string, buffer: Buffer): Promise<string> {
  const dir = path.join(process.cwd(), "public", "uploads", "cotacoes");
  await mkdir(dir, { recursive: true });
  const filename = `${cotacaoId}.pdf`;
  const full = path.join(dir, filename);
  await writeFile(full, buffer);
  return `/uploads/cotacoes/${filename}`;
}
