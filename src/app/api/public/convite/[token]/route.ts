import { NextResponse } from "next/server";
import { DEMO_CONVITE_TOKEN, ensureDemoInvite } from "@/lib/ensure-demo-invite";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const raw = (await ctx.params).token;
  const token = decodeURIComponent(raw).trim();

  try {
    if (token === DEMO_CONVITE_TOKEN) {
      await ensureDemoInvite();
    }
  } catch (e) {
    console.error("[convite] bootstrap demo:", e);
  }

  const convite = await prisma.conviteCotacao.findFirst({
    where: { token, ativo: true },
    include: {
      hospital: {
        include: {
          equipamentos: { where: { ativo: true, publicarCotacao: true }, orderBy: { nome: "asc" } },
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
    equipamentos: hospital.equipamentos.map(({ precoUnitarioOrcado, ...eq }) => {
      void precoUnitarioOrcado;
      return eq;
    }),
  });
}
