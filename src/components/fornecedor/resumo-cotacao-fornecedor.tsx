"use client";

import { useQuery } from "@tanstack/react-query";
import { formatBRL } from "@/lib/format-brl";
import { condicaoPagamentoLabel } from "@/lib/condicao-pagamento-label";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type ApiOk = {
  cotacao: {
    id: string;
    createdAt: string;
    fornecedorNome: string;
    fornecedorCnpj: string;
    representanteNome: string;
    telefone: string;
    email: string;
    feira: boolean;
    feiraNome: string;
    stand: string;
    feiraLocalizacao: string;
    arquivoPdf: string;
  };
  convite: { titulo: string };
  hospital: { nome: string; cidade: string; uf: string };
  itens: Array<{
    id: string;
    equipamentoNome: string;
    quantidade: number;
    precoUnitario: string;
    prazoEntrega: number;
    condicoesPagamento: string;
    condicoesPagamentoDetalhe: string;
    observacoes: string;
  }>;
};

export function ResumoCotacaoFornecedor({ token }: { token: string }) {
  const q = useQuery({
    queryKey: ["fornecedor-cotacao", token],
    queryFn: async () => {
      const res = await fetch(`/api/public/fornecedor-cotacao/${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Não encontrado");
      return (await res.json()) as ApiOk;
    },
  });

  if (q.isLoading) {
    return (
      <div className="mx-auto flex max-w-3xl flex-col items-center gap-4 px-4 py-20">
        <div className="size-12 animate-pulse rounded-2xl bg-primary/15" />
        <p className="text-sm text-muted-foreground">Carregando seu resumo…</p>
      </div>
    );
  }

  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-medium text-destructive">Resumo indisponível</p>
        <p className="mt-2 text-sm text-muted-foreground">
          O link pode estar incorreto ou expirado. Use o link recebido por e-mail após o envio ou entre em contato com o
          hospital.
        </p>
      </div>
    );
  }

  const { cotacao, convite, hospital, itens } = q.data;

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <header className="text-center">
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">Sua cotação enviada</p>
        <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">{convite.titulo}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Proposta para <span className="font-medium text-foreground">{hospital.nome}</span> — {hospital.cidade}/
          {hospital.uf}
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          Registrada em{" "}
          {new Date(cotacao.createdAt).toLocaleString("pt-BR", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
      </header>

      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Dados informados</CardTitle>
          <CardDescription>Conferência do que consta no envio.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <p className="text-xs font-medium text-muted-foreground">Empresa</p>
            <p className="font-medium">{cotacao.fornecedorNome}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">CNPJ</p>
            <p className="tabular-nums">{cotacao.fornecedorCnpj}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Representante</p>
            <p>{cotacao.representanteNome}</p>
          </div>
          <div>
            <p className="text-xs font-medium text-muted-foreground">Telefone</p>
            <p className="tabular-nums">{cotacao.telefone}</p>
          </div>
          <div className="sm:col-span-2">
            <p className="text-xs font-medium text-muted-foreground">E-mail</p>
            <p>{cotacao.email}</p>
          </div>
          {cotacao.feira ? (
            <div className="sm:col-span-2 rounded-xl border border-primary/20 bg-primary/[0.04] p-3">
              <p className="text-xs font-semibold text-primary">Feira</p>
              <p className="mt-1">
                {cotacao.feiraNome} · stand {cotacao.stand}
                {cotacao.feiraLocalizacao ? ` · ${cotacao.feiraLocalizacao}` : ""}
              </p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Itens e valores</CardTitle>
            <CardDescription>Preços unitários informados na proposta.</CardDescription>
          </div>
          <a
            href={cotacao.arquivoPdf}
            target="_blank"
            rel="noopener noreferrer"
            className={cn(buttonVariants({ variant: "outline", size: "sm" }), "rounded-full")}
          >
            Abrir PDF anexado
          </a>
        </CardHeader>
        <CardContent className="overflow-x-auto p-0 sm:p-6 sm:pt-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Equipamento</TableHead>
                <TableHead className="text-right">Qtd</TableHead>
                <TableHead className="text-right">Preço un.</TableHead>
                <TableHead className="text-right">Prazo</TableHead>
                <TableHead>Pagamento</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {itens.map((it) => (
                <TableRow key={it.id}>
                  <TableCell className="max-w-[240px] whitespace-normal font-medium">{it.equipamentoNome}</TableCell>
                  <TableCell className="text-right tabular-nums">{it.quantidade}</TableCell>
                  <TableCell className="text-right tabular-nums font-medium">{formatBRL(it.precoUnitario)}</TableCell>
                  <TableCell className="text-right tabular-nums">{it.prazoEntrega} dias</TableCell>
                  <TableCell className="text-sm">
                    {condicaoPagamentoLabel(it.condicoesPagamento)}
                    {it.condicoesPagamentoDetalhe ? ` — ${it.condicoesPagamentoDetalhe}` : ""}
                    {it.observacoes ? (
                      <span className="mt-1 block text-xs text-muted-foreground">Obs.: {it.observacoes}</span>
                    ) : null}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
