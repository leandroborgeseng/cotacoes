"use server";

import { revalidatePath } from "next/cache";
import { EquipmentStatus } from "@/generated/prisma/client";
import { extractImportArray, mapRawToEquipmentCreateData } from "@/lib/import-json";
import { decimalFromNumber, totalFromUnit } from "@/lib/money";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export type EquipmentUpdatePayload = {
  id: string;
  descricao_editavel: string;
  quantidade: number;
  valor_estimado: number;
  observacoes: string;
  ativo: boolean;
};

export async function importEquipmentsFromJsonText(jsonText: string) {
  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonText) as unknown;
  } catch {
    return { ok: false as const, error: "JSON inválido." };
  }

  const rows = extractImportArray(parsed);
  if (rows.length === 0) {
    return { ok: false as const, error: "Nenhum equipamento encontrado no arquivo." };
  }

  const data = rows
    .map((r) => mapRawToEquipmentCreateData(r as Record<string, unknown>))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  if (data.length === 0) {
    return { ok: false as const, error: "Nenhum item válido (nome_padronizado obrigatório)." };
  }

  await prisma.equipment.createMany({
    data: data.map((d) => ({
      ...d,
      status: EquipmentStatus.rascunho,
      ativo: true,
      observacoes: "",
    })),
  });

  revalidatePath("/");
  return { ok: true as const, inserted: data.length };
}

export async function updateEquipmentAction(input: EquipmentUpdatePayload) {
  const quantidade = Math.max(1, Math.floor(Number(input.quantidade) || 1));
  const valor_estimado = decimalFromNumber(Math.max(0, Number(input.valor_estimado) || 0));
  const valor_total_estimado = totalFromUnit(quantidade, valor_estimado);

  await prisma.equipment.update({
    where: { id: input.id },
    data: {
      descricao_editavel: input.descricao_editavel,
      quantidade,
      valor_estimado,
      valor_total_estimado,
      observacoes: input.observacoes,
      ativo: input.ativo,
    },
  });

  revalidatePath("/");
  return { ok: true as const };
}

export async function markReadyAction(id: string) {
  await prisma.equipment.update({
    where: { id },
    data: { status: EquipmentStatus.pronto_para_cotacao },
  });
  revalidatePath("/");
  return { ok: true as const };
}

export async function duplicateEquipmentAction(id: string) {
  const src = await prisma.equipment.findUnique({ where: { id } });
  if (!src) return { ok: false as const, error: "Item não encontrado." };

  await prisma.equipment.create({
    data: {
      import_ref: null,
      nome_padronizado: `${src.nome_padronizado} (cópia)`,
      nome_original: src.nome_original,
      tipo: src.tipo,
      categoria: src.categoria,
      subcategoria: src.subcategoria,
      setor_hospitalar: src.setor_hospitalar,
      anvisa_classe: src.anvisa_classe,
      criticidade: src.criticidade,
      descricao_original: src.descricao_original,
      descricao_editavel: src.descricao_editavel,
      requisitos_minimos: src.requisitos_minimos as Prisma.InputJsonValue,
      quantidade: src.quantidade,
      valor_estimado: src.valor_estimado,
      valor_total_estimado: src.valor_total_estimado,
      status: EquipmentStatus.rascunho,
      ativo: true,
      observacoes: src.observacoes,
    },
  });

  revalidatePath("/");
  return { ok: true as const };
}

export async function quickToggleAtivoAction(id: string, ativo: boolean) {
  await prisma.equipment.update({
    where: { id },
    data: { ativo },
  });
  revalidatePath("/");
  return { ok: true as const };
}
