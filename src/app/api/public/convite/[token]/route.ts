import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const convite = await prisma.conviteCotacao.findFirst({
    where: { token, ativo: true },
    include: {
      hospital: {
        include: {
          equipamentos: { where: { ativo: true }, orderBy: { nome: "asc" } },
        },
      },
    },
  });
  if (!convite) {
    return NextResponse.json({ error: "Convite não encontrado ou inativo." }, { status: 404 });
  }
  const { hospital, ...rest } = convite;
  return NextResponse.json({
    convite: rest,
    hospital: {
      id: hospital.id,
      nome: hospital.nome,
      cnpj: hospital.cnpj,
      cidade: hospital.cidade,
      uf: hospital.uf,
    },
    equipamentos: hospital.equipamentos,
  });
}
