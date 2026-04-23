import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as {
    nome?: string;
    descricao?: string;
    quantidade?: number;
    categoria?: string;
    criticidade?: string;
    ativo?: boolean;
  };
  const row = await prisma.equipamento.update({
    where: { id },
    data: {
      ...(body.nome !== undefined ? { nome: body.nome.trim() } : {}),
      ...(body.descricao !== undefined ? { descricao: body.descricao.trim() } : {}),
      ...(body.quantidade !== undefined ? { quantidade: Math.max(1, Math.floor(body.quantidade)) } : {}),
      ...(body.categoria !== undefined ? { categoria: body.categoria.trim() } : {}),
      ...(body.criticidade !== undefined ? { criticidade: body.criticidade.trim() } : {}),
      ...(body.ativo !== undefined ? { ativo: body.ativo } : {}),
    },
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.equipamento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
