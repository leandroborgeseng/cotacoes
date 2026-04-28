import { NextResponse } from "next/server";
import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/prisma";
import { normalizarCriticidade, parseDecimalOrNull, parsePrecoUnitarioOrcado } from "@/lib/equipamento-map";

type Ctx = { params: Promise<{ id: string }> };

function requisitosPatch(body: Record<string, unknown>): string | undefined {
  if (body.requisitos_minimos !== undefined) {
    const raw = body.requisitos_minimos;
    if (Array.isArray(raw)) return JSON.stringify(raw.map((x) => String(x)));
    if (typeof raw === "string") return raw.trim();
  }
  if (body.requisitosMinimos !== undefined && typeof body.requisitosMinimos === "string") {
    return body.requisitosMinimos.trim();
  }
  return undefined;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  const body = (await req.json()) as Record<string, unknown>;
  const data: Prisma.EquipamentoUpdateInput = {};

  if (typeof body.nome === "string") data.nome = body.nome.trim();
  if (typeof body.descricao === "string") data.descricao = body.descricao.trim();
  if (body.quantidade !== undefined) data.quantidade = Math.max(1, Math.floor(Number(body.quantidade)));
  if (typeof body.categoria === "string") data.categoria = body.categoria.trim();
  if (typeof body.criticidade === "string") data.criticidade = normalizarCriticidade(body.criticidade);
  if (typeof body.ativo === "boolean") data.ativo = body.ativo;
  if (typeof body.publicarCotacao === "boolean") data.publicarCotacao = body.publicarCotacao;
  if (typeof body.importRef === "string") data.importRef = body.importRef.trim();
  if (typeof body.nomeOriginal === "string") data.nomeOriginal = body.nomeOriginal.trim();
  if (typeof body.subcategoria === "string") data.subcategoria = body.subcategoria.trim();
  if (typeof body.setorHospitalar === "string") data.setorHospitalar = body.setorHospitalar.trim();
  if (typeof body.setor_hospitalar === "string") data.setorHospitalar = body.setor_hospitalar.trim();
  if (typeof body.anvisaClasse === "string") data.anvisaClasse = body.anvisaClasse.trim();
  if (typeof body.anvisa_classe === "string") data.anvisaClasse = body.anvisa_classe.trim();
  if (typeof body.tipo === "string") data.tipo = body.tipo.trim();
  const reqMin = requisitosPatch(body);
  if (reqMin !== undefined) data.requisitosMinimos = reqMin;

  const orcadoRaw = body.precoUnitarioOrcado ?? body.preco_unitario_orcado ?? body.valor_estimado;
  if (orcadoRaw !== undefined) {
    if (orcadoRaw === null || orcadoRaw === "") {
      data.precoUnitarioOrcado = null;
    } else {
      const d = parsePrecoUnitarioOrcado({ precoUnitarioOrcado: orcadoRaw });
      if (d) data.precoUnitarioOrcado = d;
    }
  }
  const realizadoRaw = body.valorRealizado ?? body.valor_realizado;
  if (realizadoRaw !== undefined) {
    data.valorRealizado = realizadoRaw === null || realizadoRaw === "" ? null : parseDecimalOrNull(realizadoRaw);
  }

  const row = await prisma.equipamento.update({
    where: { id },
    data,
  });
  return NextResponse.json(row);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const { id } = await ctx.params;
  await prisma.equipamento.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
