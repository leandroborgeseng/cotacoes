import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ token: string }> };

export async function GET(_req: Request, ctx: Ctx) {
  const { token } = await ctx.params;
  const t = token?.trim();
  if (!t || t.length < 16) {
    return NextResponse.json({ error: "Token inválido." }, { status: 400 });
  }

  const cot = await prisma.cotacao.findFirst({
    where: { fornecedorViewToken: t },
    include: {
      convite: { include: { hospital: true } },
      itens: { include: { equipamento: true }, orderBy: { id: "asc" } },
    },
  });

  if (!cot) {
    return NextResponse.json({ error: "Cotação não encontrada." }, { status: 404 });
  }

  return NextResponse.json({
    cotacao: {
      id: cot.id,
      createdAt: cot.createdAt.toISOString(),
      fornecedorNome: cot.fornecedorNome,
      fornecedorCnpj: cot.fornecedorCnpj,
      representanteNome: cot.representanteNome,
      telefone: cot.telefone,
      email: cot.email,
      feira: cot.feira,
      feiraNome: cot.feiraNome,
      stand: cot.stand,
      feiraLocalizacao: cot.feiraLocalizacao,
      arquivoPdf: cot.arquivoPdf,
    },
    convite: {
      titulo: cot.convite.titulo,
    },
    hospital: {
      nome: cot.convite.hospital.nome,
      cidade: cot.convite.hospital.cidade,
      uf: cot.convite.hospital.uf,
    },
    itens: cot.itens.map((it) => ({
      id: it.id,
      equipamentoNome: it.equipamento.nome,
      quantidade: it.equipamento.quantidade,
      precoUnitario: it.precoUnitario.toString(),
      prazoEntrega: it.prazoEntrega,
      condicoesPagamento: it.condicoesPagamento,
      condicoesPagamentoDetalhe: it.condicoesPagamentoDetalhe,
      observacoes: it.observacoes,
    })),
  });
}
