"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useTransition } from "react";
import { EquipmentStatusValues, STATUS_LABEL, type EquipmentStatus } from "@/domain/equipment-status";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { EquipmentListFilters } from "@/types/equipment-filters";

type Props = {
  categorias: string[];
  value: EquipmentListFilters;
};

const STATUS_OPTIONS: Array<EquipmentStatus | "all"> = [
  "all",
  EquipmentStatusValues.rascunho,
  EquipmentStatusValues.pronto_para_cotacao,
  EquipmentStatusValues.enviado,
  EquipmentStatusValues.cotado,
];

export function EquipmentFilters({ categorias, value }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const base = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);

  function push(next: EquipmentListFilters) {
    const sp = new URLSearchParams(base.toString());
    if (next.status === "all") sp.delete("status");
    else sp.set("status", next.status);
    if (next.categoria === "all") sp.delete("categoria");
    else sp.set("categoria", next.categoria);
    if (next.ativo === "all") sp.delete("ativo");
    else sp.set("ativo", next.ativo);
    startTransition(() => router.push(`/?${sp.toString()}`));
  }

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border/60 bg-card/40 p-4 shadow-sm backdrop-blur md:flex-row md:items-end md:justify-between">
      <div className="grid flex-1 gap-4 md:grid-cols-3">
        <div className="space-y-2">
          <Label>Status</Label>
          <Select
            disabled={pending}
            value={value.status}
            onValueChange={(v) => {
              const next = v ?? "all";
              push({
                ...value,
                status: (next === "all" ? "all" : (next as EquipmentStatus)) as EquipmentListFilters["status"],
              });
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              {STATUS_OPTIONS.filter((s) => s !== "all").map((s) => (
                <SelectItem key={s} value={s}>
                  {STATUS_LABEL[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Categoria</Label>
          <Select
            disabled={pending}
            value={value.categoria}
            onValueChange={(v) => push({ ...value, categoria: v ?? "all" })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Categoria" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todas</SelectItem>
              {categorias.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Ativo</Label>
          <Select
            disabled={pending}
            value={value.ativo}
            onValueChange={(v) => push({ ...value, ativo: (v ?? "all") as EquipmentListFilters["ativo"] })}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Ativo" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="true">Somente ativos</SelectItem>
              <SelectItem value="false">Somente inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Button
        type="button"
        variant="outline"
        disabled={pending}
        onClick={() => push({ status: "all", categoria: "all", ativo: "all" })}
      >
        Limpar filtros
      </Button>
    </div>
  );
}
