"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { updateEquipmentAction } from "@/app/actions/equipment";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import type { EquipmentRowDTO } from "@/components/equipment/types";
import { formatBRL } from "@/lib/format-brl";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  equipment: EquipmentRowDTO | null;
};

function EditForm({ equipment, onDone }: { equipment: EquipmentRowDTO; onDone: () => void }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [descricao_editavel, setDescricaoEditavel] = useState(equipment.descricao_editavel);
  const [quantidade, setQuantidade] = useState(String(equipment.quantidade));
  const [valor_estimado, setValorEstimado] = useState(String(equipment.valor_estimado));
  const [observacoes, setObservacoes] = useState(equipment.observacoes);
  const [ativo, setAtivo] = useState(equipment.ativo);

  const previewTotal = useMemo(() => {
    const q = Math.max(1, Math.floor(Number(quantidade) || 1));
    const v = Math.max(0, Number(valor_estimado) || 0);
    return q * v;
  }, [quantidade, valor_estimado]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPending(true);
    try {
      await updateEquipmentAction({
        id: equipment.id,
        descricao_editavel,
        quantidade: Math.max(1, Math.floor(Number(quantidade) || 1)),
        valor_estimado: Math.max(0, Number(valor_estimado) || 0),
        observacoes,
        ativo,
      });
      toast.success("Equipamento salvo. Valor total recalculado.");
      onDone();
      router.refresh();
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="rounded-lg border bg-muted/30 p-3 text-sm">
        <div className="font-medium">{equipment.nome_padronizado}</div>
        <div className="text-muted-foreground">
          {equipment.categoria}
          {equipment.subcategoria ? ` · ${equipment.subcategoria}` : ""}
        </div>
        {equipment.nome_original ? (
          <div className="mt-1 text-xs text-muted-foreground">Nome original: {equipment.nome_original}</div>
        ) : null}
        <div className="mt-2 flex flex-wrap gap-1">
          {equipment.import_ref ? (
            <Badge variant="outline" className="font-mono text-[10px]">
              {equipment.import_ref}
            </Badge>
          ) : null}
          {equipment.tipo ? (
            <Badge variant="secondary" className="text-[10px]">
              {equipment.tipo}
            </Badge>
          ) : null}
          {equipment.setor_hospitalar ? (
            <Badge variant="secondary" className="text-[10px]">
              {equipment.setor_hospitalar}
            </Badge>
          ) : null}
          {equipment.anvisa_classe ? (
            <Badge variant="outline" className="text-[10px]">
              ANVISA {equipment.anvisa_classe}
            </Badge>
          ) : null}
          {equipment.criticidade ? (
            <Badge variant="outline" className="text-[10px]">
              {equipment.criticidade}
            </Badge>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="descricao_editavel">Descrição editável</Label>
        <Textarea
          id="descricao_editavel"
          value={descricao_editavel}
          onChange={(e) => setDescricaoEditavel(e.target.value)}
          rows={4}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="quantidade">Quantidade</Label>
          <Input id="quantidade" inputMode="numeric" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="valor_estimado">Valor estimado (unitário)</Label>
          <Input
            id="valor_estimado"
            inputMode="decimal"
            value={valor_estimado}
            onChange={(e) => setValorEstimado(e.target.value)}
          />
        </div>
      </div>

      <div className="rounded-lg border border-dashed p-3 text-sm">
        <div className="text-muted-foreground">Prévia do total estimado</div>
        <div className="text-lg font-semibold">{formatBRL(previewTotal)}</div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="observacoes">Observações</Label>
        <Textarea id="observacoes" value={observacoes} onChange={(e) => setObservacoes(e.target.value)} rows={3} />
      </div>

      <div className="flex items-center gap-2">
        <Checkbox id="ativo" checked={ativo} onCheckedChange={(v) => setAtivo(v === true)} />
        <Label htmlFor="ativo" className="font-normal">
          Ativo
        </Label>
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onDone} disabled={pending}>
          Cancelar
        </Button>
        <Button type="submit" disabled={pending}>
          Salvar
        </Button>
      </DialogFooter>
    </form>
  );
}

export function EquipmentEditDialog({ open, onOpenChange, equipment }: Props) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Editar equipamento</DialogTitle>
          <DialogDescription>
            Ajuste descrição, quantidade e valores. O total estimado é atualizado automaticamente ao salvar.
          </DialogDescription>
        </DialogHeader>

        {equipment ? <EditForm key={equipment.id} equipment={equipment} onDone={() => onOpenChange(false)} /> : null}
      </DialogContent>
    </Dialog>
  );
}
