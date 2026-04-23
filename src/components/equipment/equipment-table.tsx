"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Copy, MoreHorizontal, Pencil, CheckCircle2 } from "lucide-react";
import { EquipmentStatusValues } from "@/domain/equipment-status";
import {
  duplicateEquipmentAction,
  markReadyAction,
  quickToggleAtivoAction,
} from "@/app/actions/equipment";
import { EquipmentEditDialog } from "@/components/equipment/equipment-edit-dialog";
import { EquipmentStatusBadge } from "@/components/equipment/equipment-status-badge";
import type { EquipmentRowDTO } from "@/components/equipment/types";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatBRL } from "@/lib/format-brl";
import { cn } from "@/lib/utils";

type Props = {
  rows: EquipmentRowDTO[];
};

export function EquipmentTable({ rows }: Props) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [editing, setEditing] = useState<EquipmentRowDTO | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const empty = useMemo(() => rows.length === 0, [rows.length]);

  function openEdit(row: EquipmentRowDTO) {
    setEditing(row);
    setDialogOpen(true);
  }

  function markReady(id: string) {
    startTransition(async () => {
      await markReadyAction(id);
      toast.success("Marcado como pronto para cotação.");
      router.refresh();
    });
  }

  function duplicate(id: string) {
    startTransition(async () => {
      const res = await duplicateEquipmentAction(id);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success("Item duplicado.");
      router.refresh();
    });
  }

  function toggleAtivo(id: string, next: boolean) {
    startTransition(async () => {
      await quickToggleAtivoAction(id, next);
      toast.success(next ? "Item ativado." : "Item inativado.");
      router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-border/60 bg-card/40 shadow-sm backdrop-blur">
      <EquipmentEditDialog
        open={dialogOpen}
        onOpenChange={(o) => {
          setDialogOpen(o);
          if (!o) setEditing(null);
        }}
        equipment={editing}
      />

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[44px]">Ativo</TableHead>
              <TableHead>Nome padronizado</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="text-right">Qtd</TableHead>
              <TableHead className="text-right">Valor estimado</TableHead>
              <TableHead className="text-right">Valor total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="w-[64px]" />
            </TableRow>
          </TableHeader>
          <TableBody>
            {empty ? (
              <TableRow>
                <TableCell colSpan={8} className="py-10 text-center text-sm text-muted-foreground">
                  Nenhum equipamento ainda. Importe um JSON para começar.
                </TableCell>
              </TableRow>
            ) : (
              rows.map((row) => (
                <TableRow key={row.id} className={row.ativo ? "" : "opacity-60"}>
                  <TableCell>
                    <Checkbox
                      checked={row.ativo}
                      disabled={pending}
                      onCheckedChange={(v) => toggleAtivo(row.id, v === true)}
                      aria-label="Ativo"
                    />
                  </TableCell>
                  <TableCell className="max-w-[280px]">
                    <div className="font-medium leading-snug">{row.nome_padronizado}</div>
                    {row.nome_original ? (
                      <div className="mt-0.5 text-[11px] text-muted-foreground">Original: {row.nome_original}</div>
                    ) : null}
                    {row.descricao_editavel ? (
                      <div className="mt-1 line-clamp-2 text-xs text-muted-foreground">{row.descricao_editavel}</div>
                    ) : null}
                    <div className="mt-1 flex flex-wrap gap-1">
                      {row.import_ref ? (
                        <Badge variant="outline" className="font-mono text-[10px]">
                          {row.import_ref}
                        </Badge>
                      ) : null}
                      {row.tipo ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {row.tipo}
                        </Badge>
                      ) : null}
                      {row.setor_hospitalar ? (
                        <Badge variant="secondary" className="text-[10px]">
                          {row.setor_hospitalar}
                        </Badge>
                      ) : null}
                      {row.anvisa_classe ? (
                        <Badge variant="outline" className="text-[10px]">
                          ANVISA {row.anvisa_classe}
                        </Badge>
                      ) : null}
                      {row.criticidade ? (
                        <Badge variant="outline" className="text-[10px]">
                          {row.criticidade}
                        </Badge>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{row.categoria}</div>
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{row.quantidade}</TableCell>
                  <TableCell className="text-right tabular-nums">{formatBRL(row.valor_estimado)}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatBRL(row.valor_total_estimado)}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap items-center gap-2">
                      <EquipmentStatusBadge status={row.status} />
                      {row.status === EquipmentStatusValues.rascunho ? (
                        <Button size="sm" variant="outline" disabled={pending} onClick={() => markReady(row.id)}>
                          <CheckCircle2 className="mr-1 size-4" />
                          Marcar como pronto
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
                        disabled={pending}
                        aria-label="Ações"
                      >
                        <MoreHorizontal className="size-4" />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => openEdit(row)}>
                          <Pencil className="mr-2 size-4" />
                          Editar…
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => duplicate(row.id)}>
                          <Copy className="mr-2 size-4" />
                          Duplicar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {!empty ? (
        <div className="flex flex-wrap items-center justify-between gap-2 border-t px-4 py-3 text-xs text-muted-foreground">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Edição rápida: checkbox ativo</Badge>
            <Badge variant="secondary">Edição completa: menu ⋯</Badge>
          </div>
          <div>{rows.length} linha(s)</div>
        </div>
      ) : null}
    </div>
  );
}
