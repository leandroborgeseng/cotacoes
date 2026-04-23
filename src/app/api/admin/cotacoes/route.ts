import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const cnpj = searchParams.get("cnpj")?.trim();
  const rows = await prisma.cotacao.findMany({
    where: cnpj ? { fornecedorCnpj: { contains: cnpj } } : {},
    orderBy: { createdAt: "desc" },
    include: {
      convite: { include: { hospital: true } },
      itens: { include: { equipamento: true } },
    },
    take: 100,
  });
  return NextResponse.json(rows);
}
