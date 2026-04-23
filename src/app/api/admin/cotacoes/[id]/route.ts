import { unlink } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const cot = await prisma.cotacao.findUnique({ where: { id } });
  if (!cot) {
    return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
  }
  const rel = cot.arquivoPdf.startsWith("/") ? cot.arquivoPdf.slice(1) : cot.arquivoPdf;
  const full = path.join(process.cwd(), "public", rel);
  try {
    await unlink(full);
  } catch {
    /* arquivo ausente ou path inválido */
  }
  await prisma.cotacao.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
