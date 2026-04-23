import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cnpj = searchParams.get("cnpj")?.trim();
  const hospitalId = searchParams.get("hospitalId")?.trim();

  const where: Prisma.CotacaoWhereInput = {};
  if (cnpj) where.fornecedorCnpj = { contains: cnpj };
  if (hospitalId) where.convite = { hospitalId };

  const rows = await prisma.cotacao.findMany({
    where: Object.keys(where).length ? where : undefined,
    orderBy: { createdAt: "desc" },
    include: {
      convite: { include: { hospital: true } },
      itens: { include: { equipamento: true } },
    },
    take: 100,
  });
  return NextResponse.json(rows);
}
