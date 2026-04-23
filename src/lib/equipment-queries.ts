import type { EquipmentStatus } from "@/domain/equipment-status";
import { EquipmentStatus as PrismaEquipmentStatus, Prisma } from "@/generated/prisma/client";
import type { EquipmentListFilters } from "@/types/equipment-filters";
import { prisma } from "@/lib/prisma";

export function parseListFilters(searchParams: Record<string, string | string[] | undefined>): EquipmentListFilters {
  const s = typeof searchParams.status === "string" ? searchParams.status : "all";
  const c = typeof searchParams.categoria === "string" ? searchParams.categoria : "all";
  const a = typeof searchParams.ativo === "string" ? searchParams.ativo : "all";

  const status =
    s === "rascunho" || s === "pronto_para_cotacao" || s === "enviado" || s === "cotado" ? (s as EquipmentStatus) : "all";

  const ativo: EquipmentListFilters["ativo"] = a === "true" || a === "false" ? a : "all";

  return { status, categoria: c, ativo };
}

export function buildWhere(filters: EquipmentListFilters): Prisma.EquipmentWhereInput {
  return {
    ...(filters.status !== "all" ? { status: filters.status as PrismaEquipmentStatus } : {}),
    ...(filters.categoria !== "all" ? { categoria: filters.categoria } : {}),
    ...(filters.ativo === "true" ? { ativo: true } : {}),
    ...(filters.ativo === "false" ? { ativo: false } : {}),
  };
}

export async function listEquipments(filters: EquipmentListFilters) {
  const where = buildWhere(filters);
  return prisma.equipment.findMany({
    where,
    orderBy: [{ createdAt: "desc" }],
  });
}

export async function listCategorias() {
  const rows = await prisma.equipment.findMany({
    distinct: ["categoria"],
    select: { categoria: true },
    orderBy: { categoria: "asc" },
  });
  return rows.map((r) => r.categoria);
}

export async function getDashboardStats() {
  const [agg, prontos] = await Promise.all([
    prisma.equipment.aggregate({
      _sum: { valor_total_estimado: true },
      _count: { _all: true },
    }),
    prisma.equipment.count({ where: { status: PrismaEquipmentStatus.pronto_para_cotacao } }),
  ]);

  return {
    valorTotalEstimado: agg._sum.valor_total_estimado,
    totalItens: agg._count._all,
    prontosParaCotacao: prontos,
  };
}
