import { readFile } from "node:fs/promises";
import path from "node:path";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const cot = await prisma.cotacao.findUnique({ where: { id } });
  if (!cot) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }
  const rel = cot.arquivoPdf.startsWith("/") ? cot.arquivoPdf.slice(1) : cot.arquivoPdf;
  const full = path.join(process.cwd(), "public", rel);
  const buf = await readFile(full);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="cotacao-${id}.pdf"`,
    },
  });
}
