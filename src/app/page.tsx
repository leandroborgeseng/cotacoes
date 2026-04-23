import { Suspense } from "react";

export const dynamic = "force-dynamic";
import { EquipmentDashboard } from "@/components/equipment/equipment-dashboard";
import { EquipmentExportButton } from "@/components/equipment/equipment-export-button";
import { EquipmentFilters } from "@/components/equipment/equipment-filters";
import { EquipmentImport } from "@/components/equipment/equipment-import";
import { EquipmentTable } from "@/components/equipment/equipment-table";
import type { EquipmentRowDTO } from "@/components/equipment/types";
import {
  getDashboardStats,
  listCategorias,
  listEquipments,
  parseListFilters,
} from "@/lib/equipment-queries";
import type { EquipmentStatus } from "@/domain/equipment-status";
import type { Equipment } from "@/generated/prisma/client";

function toRowDTO(e: Equipment): EquipmentRowDTO {
  return {
    id: e.id,
    import_ref: e.import_ref,
    nome_padronizado: e.nome_padronizado,
    nome_original: e.nome_original,
    tipo: e.tipo,
    categoria: e.categoria,
    subcategoria: e.subcategoria,
    setor_hospitalar: e.setor_hospitalar,
    anvisa_classe: e.anvisa_classe,
    criticidade: e.criticidade,
    descricao_original: e.descricao_original,
    descricao_editavel: e.descricao_editavel,
    quantidade: e.quantidade,
    valor_estimado: Number(e.valor_estimado),
    valor_total_estimado: Number(e.valor_total_estimado),
    status: e.status as EquipmentStatus,
    ativo: e.ativo,
    observacoes: e.observacoes,
    createdAt: e.createdAt.toISOString(),
  };
}

export default async function Home(props: PageProps<"/">) {
  const searchParams = await props.searchParams;
  const filters = parseListFilters(searchParams);

  const [stats, categorias, rows] = await Promise.all([
    getDashboardStats(),
    listCategorias(),
    listEquipments(filters),
  ]);

  const dto = rows.map(toRowDTO);
  const valorTotal = Number(stats.valorTotalEstimado ?? 0);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-4 py-10">
      <header className="space-y-2">
        <div className="inline-flex items-center rounded-full border bg-background/60 px-3 py-1 text-xs text-muted-foreground shadow-sm backdrop-blur">
          Cotações hospitalares
        </div>
        <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
          <div className="space-y-2">
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Gestão de cotação</h1>
            <p className="max-w-2xl text-sm text-muted-foreground md:text-base">
              Importe equipamentos, organize por status e gere uma planilha CSV pronta para envio a fornecedores.
            </p>
          </div>
          <Suspense fallback={null}>
            <EquipmentExportButton />
          </Suspense>
        </div>
      </header>

      <EquipmentDashboard
        valorTotalEstimado={valorTotal}
        totalItens={stats.totalItens}
        prontosParaCotacao={stats.prontosParaCotacao}
      />

      <EquipmentImport />

      <Suspense
        fallback={
          <div className="rounded-xl border border-dashed p-4 text-sm text-muted-foreground">Carregando filtros…</div>
        }
      >
        <EquipmentFilters categorias={categorias} value={filters} />
      </Suspense>

      <EquipmentTable rows={dto} />
    </div>
  );
}
