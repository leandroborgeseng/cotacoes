import { NextResponse } from "next/server";
import { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { condicaoPagamentoEnum } from "@/lib/schemas/cotacao-publica";

type Ctx = { params: Promise<{ itemId: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { itemId } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;

  const data: Prisma.CotacaoItemUpdateInput = {};

  if (body.precoUnitario !== undefined) {
    const n = Number(body.precoUnitario);
    if (!Number.isFinite(n) || n <= 0) {
      return NextResponse.json({ error: "preço unitário inválido." }, { status: 400 });
    }
    data.precoUnitario = new Prisma.Decimal(n);
  }
  if (body.prazoEntrega !== undefined) {
    const p = Math.floor(Number(body.prazoEntrega));
    if (!Number.isFinite(p) || p < 1) {
      return NextResponse.json({ error: "prazo de entrega inválido." }, { status: 400 });
    }
    data.prazoEntrega = p;
  }
  if (body.condicoesPagamento !== undefined) {
    const parsed = condicaoPagamentoEnum.safeParse(body.condicoesPagamento);
    if (!parsed.success) {
      return NextResponse.json({ error: "condição de pagamento inválida." }, { status: 400 });
    }
    data.condicoesPagamento = parsed.data;
  }
  if (typeof body.condicoesPagamentoDetalhe === "string") {
    data.condicoesPagamentoDetalhe = body.condicoesPagamentoDetalhe.trim().slice(0, 2000);
  }
  if (typeof body.observacoes === "string") {
    data.observacoes = body.observacoes.trim().slice(0, 4000);
  }

  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nenhum campo para atualizar." }, { status: 400 });
  }

  const row = await prisma.cotacaoItem.update({
    where: { id: itemId },
    data,
    include: { equipamento: true },
  });
  return NextResponse.json(row);
}
