import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatBRL } from "@/lib/format-brl";

type Props = {
  valorTotalEstimado: number;
  totalItens: number;
  prontosParaCotacao: number;
};

export function EquipmentDashboard({ valorTotalEstimado, totalItens, prontosParaCotacao }: Props) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Valor total estimado</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tracking-tight">{formatBRL(valorTotalEstimado)}</div>
          <p className="mt-1 text-xs text-muted-foreground">Soma de todos os itens cadastrados</p>
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Quantidade de itens</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tracking-tight">{totalItens}</div>
          <p className="mt-1 text-xs text-muted-foreground">Linhas no catálogo de cotação</p>
        </CardContent>
      </Card>
      <Card className="border-border/60 bg-card/60 shadow-sm backdrop-blur">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Prontos para cotação</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-semibold tracking-tight">{prontosParaCotacao}</div>
          <p className="mt-1 text-xs text-muted-foreground">Status “Pronto p/ cotação”</p>
        </CardContent>
      </Card>
    </div>
  );
}
