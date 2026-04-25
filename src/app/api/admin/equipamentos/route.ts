import { NextResponse } from "next/server";
import { ensureDemoInvite } from "@/lib/ensure-demo-invite";
import { prisma } from "@/lib/prisma";
import { equipamentoFromImportRow } from "@/lib/equipamento-map";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const hospitalId = searchParams.get("hospitalId");
  if (!hospitalId) {
    return NextResponse.json({ error: "hospitalId obrigatório." }, { status: 400 });
  }
  try {
    await ensureDemoInvite();
  } catch (e) {
    console.error("[admin/equipamentos] sync demo catalog:", e);
  }
  const rows = await prisma.equipamento.findMany({
    where: { hospitalId },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const hospitalId = typeof body.hospitalId === "string" ? body.hospitalId : "";
  if (!hospitalId) {
    return NextResponse.json({ error: "hospitalId é obrigatório." }, { status: 400 });
  }
  const base = equipamentoFromImportRow(body, hospitalId);
  if (!base.nome?.trim()) {
    return NextResponse.json({ error: "nome (ou nome_padronizado) é obrigatório." }, { status: 400 });
  }
  const row = await prisma.equipamento.create({
    data: {
      ...base,
      nome: base.nome.trim(),
      descricao: base.descricao ?? "",
      ...(typeof body.ativo === "boolean" ? { ativo: body.ativo } : {}),
    },
  });
  return NextResponse.json(row);
}
