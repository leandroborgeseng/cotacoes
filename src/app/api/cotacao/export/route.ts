export const dynamic = "force-dynamic";

import type { EquipmentStatus } from "@/domain/equipment-status";
import { buildWhere } from "@/lib/equipment-queries";
import { prisma } from "@/lib/prisma";
import { requisitosToText } from "@/lib/requisitos";
import { toCsv } from "@/lib/csv";

function parseStatus(v: string | null): EquipmentStatus | "all" {
  if (
    v === "rascunho" ||
    v === "pronto_para_cotacao" ||
    v === "enviado" ||
    v === "cotado"
  ) {
    return v;
  }
  return "all";
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const status = parseStatus(searchParams.get("status"));
  const categoria = searchParams.get("categoria") ?? "all";
  const ativoRaw = searchParams.get("ativo");
  const ativo = ativoRaw === "true" || ativoRaw === "false" ? ativoRaw : "all";

  const where = buildWhere({ status, categoria, ativo });

  const items = await prisma.equipment.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      nome_padronizado: true,
      descricao_editavel: true,
      requisitos_minimos: true,
      quantidade: true,
    },
  });

  const header = [
    "nome_padronizado",
    "descricao_editavel",
    "requisitos_minimos",
    "quantidade",
    "marca",
    "modelo",
    "valor_unitario",
    "prazo",
    "garantia",
  ];

  const rows = [
    header,
    ...items.map((it) => [
      it.nome_padronizado,
      it.descricao_editavel,
      requisitosToText(it.requisitos_minimos),
      String(it.quantidade),
      "",
      "",
      "",
      "",
      "",
    ]),
  ];

  const csv = "\uFEFF" + toCsv(rows);
  return new Response(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="cotacao-fornecedores.csv"`,
    },
  });
}
