"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { CircleDollarSign, PackageCheck, Target } from "lucide-react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BrlMoneyInput } from "@/components/ui/brl-money-input";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { centsDigitStringToNumber, reaisToCentsDigitString, sanitizeBrlCentDigits } from "@/lib/format-brl-input";
import { formatCnpjInput } from "@/lib/format-cnpj";
import { MAX_PDF_BYTES } from "@/lib/pdf-constants";

type Hospital = { id: string; nome: string; cnpj: string; cidade: string; uf: string };
type Equipamento = {
  id: string;
  nome: string;
  descricao: string;
  quantidade: number;
  ativo: boolean;
  publicarCotacao: boolean;
  importRef?: string;
  nomeOriginal?: string;
  setorHospitalar?: string;
  requisitosMinimos?: string;
  precoUnitarioOrcado?: unknown;
  valorTotalOrcado?: unknown;
  valorRealizado?: unknown;
  previsaoAquisicao?: number | null;
  justificativa?: string;
};

type CotacaoRow = {
  id: string;
  fornecedorNome: string;
  fornecedorCnpj: string;
  representanteNome: string;
  telefone: string;
  email: string;
  feira: boolean;
  feiraNome: string;
  stand: string;
  createdAt: string;
  convite: { hospital: { id: string; nome: string } };
  itens: Array<{
    id: string;
    precoUnitario: unknown;
    prazoEntrega: number;
    condicoesPagamento: string;
    condicoesPagamentoDetalhe: string;
    observacoes: string;
    equipamento: { id: string; nome: string; precoUnitarioOrcado?: unknown };
  }>;
};

const PAGAMENTO_OPCOES = [
  { value: "A_VISTA", label: "À vista" },
  { value: "FATURADO_30_60_90", label: "Faturado 30/60/90" },
  { value: "OUTRO", label: "Outro" },
] as const;

function rotuloCotacao(c: CotacaoRow) {
  const d = new Date(c.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" });
  return `${c.fornecedorNome} — ${d}`;
}

function linhasComparacao(a: CotacaoRow, b: CotacaoRow) {
  const ma = new Map(a.itens.map((i) => [i.equipamento.id, i]));
  const mb = new Map(b.itens.map((i) => [i.equipamento.id, i]));
  const ids = [...new Set([...ma.keys(), ...mb.keys()])];
  return ids.map((eqId) => {
    const ia = ma.get(eqId);
    const ib = mb.get(eqId);
    const nome = ia?.equipamento.nome ?? ib?.equipamento.nome ?? "—";
    return { eqId, nome, ia, ib };
  });
}

function truncLabel(s: string, max = 32) {
  const t = s.trim();
  return t.length <= max ? t : `${t.slice(0, max)}…`;
}

type ItemCotacao = CotacaoRow["itens"][number];

/** Matriz equipamento × cotações para comparação em um único quadro. */
function montarRelatorioConsolidado(
  hospitalId: string,
  equipamentos: Equipamento[],
  cotacoes: CotacaoRow[],
): {
  colunas: CotacaoRow[];
  linhas: Array<{
    equipamentoId: string;
    nome: string;
    quantidade: number;
    orcado: unknown;
    porCotacao: Record<string, ItemCotacao | null>;
  }>;
} {
  const colunas = cotacoes
    .filter((c) => c.convite.hospital.id === hospitalId)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const mapNome = new Map<string, string>();
  const mapQtd = new Map<string, number>();
  const mapOrcado = new Map<string, unknown>();

  for (const e of equipamentos) {
    mapNome.set(e.id, e.nome);
    mapQtd.set(e.id, e.quantidade);
    mapOrcado.set(e.id, e.precoUnitarioOrcado);
  }
  for (const c of colunas) {
    for (const it of c.itens) {
      const id = it.equipamento.id;
      if (!mapNome.has(id)) mapNome.set(id, it.equipamento.nome);
      if (!mapQtd.has(id)) mapQtd.set(id, 1);
      if (!mapOrcado.has(id)) mapOrcado.set(id, it.equipamento.precoUnitarioOrcado);
    }
  }

  const ativosIds = equipamentos.filter((e) => e.ativo).map((e) => e.id);
  const idsCotados = [...new Set(colunas.flatMap((c) => c.itens.map((i) => i.equipamento.id)))];
  const ordemIds = [
    ...ativosIds.sort((a, b) => (mapNome.get(a) || "").localeCompare(mapNome.get(b) || "", "pt")),
    ...idsCotados.filter((id) => !ativosIds.includes(id)).sort((a, b) => (mapNome.get(a) || "").localeCompare(mapNome.get(b) || "", "pt")),
  ];

  const linhas = ordemIds.map((equipamentoId) => {
    const porCotacao: Record<string, ItemCotacao | null> = {};
    for (const cot of colunas) {
      porCotacao[cot.id] = cot.itens.find((i) => i.equipamento.id === equipamentoId) ?? null;
    }
    return {
      equipamentoId,
      nome: mapNome.get(equipamentoId) || "—",
      quantidade: mapQtd.get(equipamentoId) ?? 1,
      orcado: mapOrcado.get(equipamentoId),
      porCotacao,
    };
  });

  return { colunas, linhas };
}

function numberFromMoney(v: unknown) {
  const n = v === null || v === undefined || v === "" ? NaN : Number(v);
  return Number.isFinite(n) && n > 0 ? n : null;
}

function valorOrcadoEquip(e: Equipamento) {
  const totalOrcado = numberFromMoney(e.valorTotalOrcado);
  if (totalOrcado !== null) return totalOrcado;
  const unitario = numberFromMoney(e.precoUnitarioOrcado);
  return unitario === null ? null : e.quantidade * unitario;
}

function valorRealizadoEquip(e: Equipamento) {
  return numberFromMoney(e.valorRealizado);
}

/** Soma o valor orçado por lista usando total orçado ou quantidade × valor unitário. */
function investimentoPorLista(equips: Equipamento[]) {
  let total = 0;
  let linhasComOrcamento = 0;
  let linhasSemOrcamento = 0;
  let unidadesTotal = 0;
  for (const e of equips) {
    unidadesTotal += e.quantidade;
    const valor = valorOrcadoEquip(e);
    if (valor === null) {
      linhasSemOrcamento += 1;
      continue;
    }
    linhasComOrcamento += 1;
    total += valor;
  }
  return { total, linhas: equips.length, linhasComOrcamento, linhasSemOrcamento, unidadesTotal };
}

function realizadoPorLista(equips: Equipamento[]) {
  let total = 0;
  let linhasComValor = 0;
  let linhasSemValor = 0;
  let unidadesTotal = 0;
  for (const e of equips) {
    unidadesTotal += e.quantidade;
    const valor = valorRealizadoEquip(e);
    if (valor === null) {
      linhasSemValor += 1;
      continue;
    }
    linhasComValor += 1;
    total += valor;
  }
  return { total, linhas: equips.length, linhasComValor, linhasSemValor, unidadesTotal };
}

function comparativoOrcadoRealizado(equips: Equipamento[]) {
  let orcadoComparado = 0;
  let realizadoComparado = 0;
  let linhasComparadas = 0;
  let linhasSemOrcamento = 0;
  let linhasSemRealizado = 0;
  for (const e of equips) {
    const orcado = valorOrcadoEquip(e);
    const realizado = valorRealizadoEquip(e);
    if (orcado === null) linhasSemOrcamento += 1;
    if (realizado === null) linhasSemRealizado += 1;
    if (orcado === null || realizado === null) continue;
    linhasComparadas += 1;
    orcadoComparado += orcado;
    realizadoComparado += realizado;
  }
  return {
    orcadoComparado,
    realizadoComparado,
    diferenca: orcadoComparado - realizadoComparado,
    linhasComparadas,
    linhasSemOrcamento,
    linhasSemRealizado,
  };
}

function itensQueCabemNoSaldo(equips: Equipamento[], saldo: number) {
  if (saldo <= 0) return { itens: 0, total: 0 };
  let total = 0;
  let itens = 0;
  const ordenados = equips
    .map((e) => ({ valor: valorOrcadoEquip(e) ?? Infinity }))
    .filter((e) => Number.isFinite(e.valor) && e.valor > 0)
    .sort((a, b) => a.valor - b.valor);
  for (const item of ordenados) {
    if (total + item.valor > saldo) break;
    total += item.valor;
    itens += 1;
  }
  return { itens, total };
}

function anoAquisicao(e: Equipamento) {
  return Number.isFinite(Number(e.previsaoAquisicao)) ? Number(e.previsaoAquisicao) : null;
}

function investimentosPorAno(equips: Equipamento[]) {
  const anos = [...new Set(equips.map(anoAquisicao))].sort((a, b) => {
    if (a === null) return 1;
    if (b === null) return -1;
    return a - b;
  });

  return anos.map((ano) => {
    const list = equips.filter((e) => anoAquisicao(e) === ano);
    const previsto = investimentoPorLista(list.filter((e) => e.ativo));
    const realizado = realizadoPorLista(list.filter((e) => !e.ativo));
    return {
      ano,
      previsto,
      realizado,
      total: investimentoPorLista(list),
    };
  });
}

function brl(n: number) {
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
}

const money = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

function vsOrcadoBadge(cotado: unknown, orcado: unknown) {
  const c = Number(cotado);
  const o = orcado != null && orcado !== "" ? Number(orcado) : NaN;
  if (!Number.isFinite(o) || o <= 0) {
    return <span className="text-xs text-muted-foreground">Sem referência</span>;
  }
  if (!Number.isFinite(c)) return <span className="text-muted-foreground">—</span>;
  const pct = ((c - o) / o) * 100;
  if (Math.abs(pct) < 0.5) {
    return <span className="text-xs text-muted-foreground">No orçado</span>;
  }
  if (c > o) {
    return <span className="text-xs font-medium text-amber-800 dark:text-amber-400">+{pct.toFixed(1)}% acima</span>;
  }
  return <span className="text-xs font-medium text-emerald-800 dark:text-emerald-400">{pct.toFixed(1)}% abaixo</span>;
}

export function AdminPanel() {
  const router = useRouter();
  const qc = useQueryClient();
  const [hospitalId, setHospitalId] = useState<string>("");
  const [equipAnoFilter, setEquipAnoFilter] = useState("todos");
  const [equipStatusFilter, setEquipStatusFilter] = useState("todos");
  const [cnpjFilter, setCnpjFilter] = useState("");
  const [compareOpen, setCompareOpen] = useState(false);
  const [compareA, setCompareA] = useState("");
  const [compareB, setCompareB] = useState("");
  const [itemEdit, setItemEdit] = useState<null | {
    itemId: string;
    fornecedorNome: string;
    equipNome: string;
    precoUnitario: string;
    prazoEntrega: string;
    condicoesPagamento: string;
    condicoesPagamentoDetalhe: string;
    observacoes: string;
  }>(null);
  const [openEq, setOpenEq] = useState(false);
  const [editing, setEditing] = useState<Equipamento | null>(null);

  const formState = useMemo(
    () => ({
      nome: "",
      descricao: "",
      quantidade: "1",
      precoUnitarioOrcado: "",
      valorRealizado: "",
    }),
    [],
  );
  const [draft, setDraft] = useState(formState);

  const hospitals = useQuery({
    queryKey: ["admin", "hospitals"],
    queryFn: async () => {
      const res = await fetch("/api/admin/hospitais");
      if (!res.ok) throw new Error("Falha ao carregar hospitais.");
      return (await res.json()) as Hospital[];
    },
  });

  const hid = hospitalId || hospitals.data?.[0]?.id || "";

  const equipamentos = useQuery({
    queryKey: ["admin", "equipamentos", hid],
    queryFn: async () => {
      if (!hid) return [];
      const res = await fetch(`/api/admin/equipamentos?hospitalId=${encodeURIComponent(hid)}`);
      if (!res.ok) throw new Error("Falha ao carregar equipamentos.");
      return (await res.json()) as Equipamento[];
    },
    enabled: !!hid,
  });

  const cotacoes = useQuery({
    queryKey: ["admin", "cotacoes", cnpjFilter, hid],
    queryFn: async () => {
      const p = new URLSearchParams();
      if (hid) p.set("hospitalId", hid);
      if (cnpjFilter.trim()) p.set("cnpj", cnpjFilter.trim());
      const qs = p.toString();
      const res = await fetch(`/api/admin/cotacoes${qs ? `?${qs}` : ""}`);
      if (!res.ok) throw new Error("Falha ao carregar cotações.");
      return (await res.json()) as CotacaoRow[];
    },
    enabled: !!hid,
  });

  const relatorioConsolidado = useMemo((): ReturnType<typeof montarRelatorioConsolidado> => {
    if (!hid) return { colunas: [], linhas: [] };
    return montarRelatorioConsolidado(hid, equipamentos.data ?? [], cotacoes.data ?? []);
  }, [hid, equipamentos.data, cotacoes.data]);

  const saveEquip = useMutation({
    mutationFn: async () => {
      const pDigits = sanitizeBrlCentDigits(draft.precoUnitarioOrcado);
      const orcadoNum = pDigits === "" ? null : centsDigitStringToNumber(pDigits);
      const realizadoDigits = sanitizeBrlCentDigits(draft.valorRealizado);
      const realizadoNum = realizadoDigits === "" ? null : centsDigitStringToNumber(realizadoDigits);
      const body: Record<string, unknown> = {
        hospitalId: hid,
        nome: draft.nome.trim(),
        descricao: draft.descricao.trim(),
        quantidade: Number(draft.quantidade) || 1,
        valorRealizado: realizadoNum,
      };
      if (editing) {
        body.precoUnitarioOrcado = orcadoNum;
        const res = await fetch(`/api/admin/equipamentos/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Falha ao atualizar.");
        return res.json();
      }
      if (orcadoNum != null) body.precoUnitarioOrcado = orcadoNum;
      const res = await fetch("/api/admin/equipamentos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Falha ao criar.");
      return res.json();
    },
    onSuccess: () => {
      toast.success(editing ? "Equipamento atualizado." : "Equipamento criado.");
      setOpenEq(false);
      setEditing(null);
      setDraft(formState);
      void qc.invalidateQueries({ queryKey: ["admin", "equipamentos", hid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteEquip = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/equipamentos/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao remover.");
    },
    onSuccess: () => {
      toast.success("Removido.");
      void qc.invalidateQueries({ queryKey: ["admin", "equipamentos", hid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setAtivoEquipamento = useMutation({
    mutationFn: async ({ id, ativo }: { id: string; ativo: boolean }) => {
      const res = await fetch(`/api/admin/equipamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo, publicarCotacao: ativo }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar status.");
    },
    onSuccess: (_, { ativo }) => {
      toast.success(
        ativo ? "Item voltou à lista da pré-cotação." : "Marcado como já adquirido — não aparece mais no convite para fornecedores.",
      );
      void qc.invalidateQueries({ queryKey: ["admin", "equipamentos", hid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const setPublicarCotacaoEquipamento = useMutation({
    mutationFn: async ({ id, publicarCotacao }: { id: string; publicarCotacao: boolean }) => {
      const res = await fetch(`/api/admin/equipamentos/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ publicarCotacao }),
      });
      if (!res.ok) throw new Error("Falha ao atualizar publicação.");
    },
    onSuccess: (_, { publicarCotacao }) => {
      toast.success(publicarCotacao ? "Item publicado para cotação." : "Item removido da cotação pública.");
      void qc.invalidateQueries({ queryKey: ["admin", "equipamentos", hid] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const deleteCotacao = useMutation({
    mutationFn: async (id: string) => {
      const res = await fetch(`/api/admin/cotacoes/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Falha ao excluir cotação.");
    },
    onSuccess: () => {
      toast.success("Cotação excluída.");
      void qc.invalidateQueries({ queryKey: ["admin", "cotacoes", cnpjFilter] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const dashFinanceiro = useMemo(() => {
    const list = equipamentos.data ?? [];
    const ativos = list.filter((e) => e.ativo);
    const adquiridos = list.filter((e) => !e.ativo);
    const foraDoConvite = ativos.filter((e) => !e.publicarCotacao);
    const comparativo = comparativoOrcadoRealizado(adquiridos);
    const saldoDisponivel = Math.max(0, comparativo.diferenca);
    return {
      previsto: investimentoPorLista(ativos),
      realizado: realizadoPorLista(adquiridos),
      orcadoAdquiridos: investimentoPorLista(adquiridos),
      comparativo,
      saldoDisponivel,
      itensCobertosPeloSaldo: itensQueCabemNoSaldo(foraDoConvite, saldoDisponivel),
      porAno: investimentosPorAno(list),
    };
  }, [equipamentos.data]);

  const anosEquipamentos = useMemo(() => {
    const anos = [...new Set((equipamentos.data ?? []).map(anoAquisicao).filter((ano): ano is number => ano !== null))];
    return anos.sort((a, b) => a - b);
  }, [equipamentos.data]);

  const equipamentosFiltrados = useMemo(() => {
    const ano = equipAnoFilter === "todos" ? null : Number(equipAnoFilter);
    return (equipamentos.data ?? []).filter((eq) => {
      const anoOk = ano === null || anoAquisicao(eq) === ano;
      const statusOk =
        equipStatusFilter === "todos" ||
        (equipStatusFilter === "ativos" && eq.ativo) ||
        (equipStatusFilter === "adquiridos" && !eq.ativo);
      return anoOk && statusOk;
    });
  }, [equipAnoFilter, equipStatusFilter, equipamentos.data]);

  const equipamentosAtivosFiltrados = equipamentosFiltrados
    .filter((e) => e.ativo)
    .sort((a, b) => Number(b.publicarCotacao) - Number(a.publicarCotacao));
  const equipamentosAdquiridosFiltrados = equipamentosFiltrados.filter((e) => !e.ativo);
  const equipamentosPublicadosCount = equipamentosAtivosFiltrados.filter((e) => e.publicarCotacao).length;
  const mostrarAtivos = equipStatusFilter !== "adquiridos";
  const mostrarAdquiridos = equipStatusFilter !== "ativos";

  const patchCotacaoItem = useMutation({
    mutationFn: async () => {
      if (!itemEdit) return;
      const preco = centsDigitStringToNumber(itemEdit.precoUnitario);
      const prazo = Number(itemEdit.prazoEntrega);
      if (!Number.isFinite(preco) || preco <= 0) throw new Error("Preço unitário inválido.");
      if (!Number.isFinite(prazo) || prazo < 1) throw new Error("Prazo inválido.");
      const res = await fetch(`/api/admin/cotacao-itens/${itemEdit.itemId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          precoUnitario: preco,
          prazoEntrega: prazo,
          condicoesPagamento: itemEdit.condicoesPagamento,
          condicoesPagamentoDetalhe: itemEdit.condicoesPagamentoDetalhe,
          observacoes: itemEdit.observacoes,
        }),
      });
      if (!res.ok) throw new Error("Falha ao salvar linha.");
    },
    onSuccess: () => {
      toast.success("Valores da cotação atualizados.");
      setItemEdit(null);
      void qc.invalidateQueries({ queryKey: ["admin", "cotacoes", cnpjFilter] });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.replace("/admin/login");
    router.refresh();
  }

  if (hospitals.isLoading) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-4 px-4 py-20">
        <div className="size-12 animate-pulse rounded-2xl bg-primary/15" />
        <p className="text-sm text-muted-foreground">Carregando painel…</p>
      </div>
    );
  }
  if (!hospitals.data?.length) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <p className="font-medium text-foreground">Nenhum hospital no banco ainda.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Recarregue a página — o sistema tenta criar o hospital de demonstração automaticamente. Se persistir, rode{" "}
          <code className="rounded bg-muted px-1">npx prisma migrate deploy</code> no servidor.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl flex-1 space-y-8 px-4 py-8 sm:py-10">
      <header className="flex flex-col gap-4 rounded-3xl border border-border/60 bg-card/80 px-5 py-6 shadow-sm sm:flex-row sm:items-center sm:justify-between sm:px-8">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Painel do hospital</h1>
          <p className="mt-1 text-sm text-muted-foreground">Convites, catálogo de equipamentos e cotações recebidas.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "inline-flex rounded-full")}>
            Ver site público
          </Link>
          <Button variant="secondary" className="rounded-full" onClick={() => void logout()}>
            Sair
          </Button>
        </div>
      </header>

      {hid ? (
        <details className="group rounded-3xl border border-primary/25 bg-gradient-to-br from-primary/[0.07] via-card to-card text-sm text-card-foreground shadow-md">
          <summary className="cursor-pointer list-none rounded-3xl px-5 py-5 outline-none transition-colors hover:bg-primary/[0.04] focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-8 [&::-webkit-details-marker]:hidden">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle className="text-lg">Dashboard financeiro</CardTitle>
                <CardDescription className="mt-1">
                  Totais financeiros em sanfona para liberar espaço ao relatório consolidado.
                </CardDescription>
              </div>
              <div className="flex flex-col gap-1 sm:items-end">
                <p className="text-xs font-medium text-muted-foreground">Orçado × realizado</p>
                <p
                  className={cn(
                    "text-lg font-semibold tabular-nums",
                    dashFinanceiro.comparativo.diferenca >= 0
                      ? "text-emerald-800 dark:text-emerald-300"
                      : "text-amber-800 dark:text-amber-300",
                  )}
                >
                  {dashFinanceiro.comparativo.diferenca >= 0 ? "Economia " : "Acima "}
                  {brl(Math.abs(dashFinanceiro.comparativo.diferenca))}
                </p>
                <span className="text-xs font-medium text-primary group-open:hidden">Abrir detalhes</span>
                <span className="hidden text-xs font-medium text-primary group-open:inline">Recolher detalhes</span>
              </div>
            </div>
          </summary>
          <CardContent className="space-y-6 pb-5">
            {equipamentos.isLoading ? (
              <div className="h-24 animate-pulse rounded-xl bg-muted/60" />
            ) : (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                  <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-primary">
                      <Target className="size-4 shrink-0" aria-hidden />
                      Previsto (a adquirir)
                    </div>
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Itens previstos</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{dashFinanceiro.previsto.linhas}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Unidades (soma das qtd.)</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{dashFinanceiro.previsto.unidadesTotal}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{brl(dashFinanceiro.previsto.total)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {dashFinanceiro.previsto.linhasSemOrcamento > 0
                        ? `${dashFinanceiro.previsto.linhasSemOrcamento} item(ns) sem valor orçado (não entram na soma em R$)`
                        : "Todos os itens têm valor orçado para o total em R$."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-emerald-800 dark:text-emerald-400">
                      <PackageCheck className="size-4 shrink-0" aria-hidden />
                      Realizado (adquiridos)
                    </div>
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Itens já comprados</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{dashFinanceiro.realizado.linhas}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Unidades (soma das qtd.)</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">{dashFinanceiro.realizado.unidadesTotal}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">{brl(dashFinanceiro.realizado.total)}</p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {dashFinanceiro.realizado.linhasSemValor > 0
                        ? `${dashFinanceiro.realizado.linhasSemValor} item(ns) sem valor realizado`
                        : "Todos os itens adquiridos têm valor realizado."}
                    </p>
                  </div>
                  <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground/90">
                      <CircleDollarSign className="size-4 shrink-0" aria-hidden />
                      Projeto (previsto + realizado)
                    </div>
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Itens no catálogo</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">
                          {dashFinanceiro.previsto.linhas + dashFinanceiro.realizado.linhas}
                        </dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Unidades totais</dt>
                        <dd className="text-lg font-semibold tabular-nums text-foreground">
                          {dashFinanceiro.previsto.unidadesTotal + dashFinanceiro.realizado.unidadesTotal}
                        </dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
                      {brl(dashFinanceiro.previsto.total + dashFinanceiro.realizado.total)}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">Visão consolidada do catálogo deste hospital.</p>
                  </div>
                  <div
                    className={cn(
                      "rounded-2xl border p-5 shadow-sm sm:col-span-2 xl:col-span-1",
                      dashFinanceiro.comparativo.diferenca >= 0
                        ? "border-emerald-200 bg-emerald-50/80 dark:border-emerald-900/60 dark:bg-emerald-950/25"
                        : "border-amber-200 bg-amber-50/80 dark:border-amber-900/60 dark:bg-amber-950/25",
                    )}
                  >
                    <div
                      className={cn(
                        "flex items-center gap-2 text-sm font-medium",
                        dashFinanceiro.comparativo.diferenca >= 0
                          ? "text-emerald-800 dark:text-emerald-300"
                          : "text-amber-800 dark:text-amber-300",
                      )}
                    >
                      <CircleDollarSign className="size-4 shrink-0" aria-hidden />
                      Orçado × realizado
                    </div>
                    <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-sm">
                      <div>
                        <dt className="text-muted-foreground">Orçado adquirido</dt>
                        <dd className="font-semibold tabular-nums">{brl(dashFinanceiro.comparativo.orcadoComparado)}</dd>
                      </div>
                      <div>
                        <dt className="text-muted-foreground">Realizado</dt>
                        <dd className="font-semibold tabular-nums">{brl(dashFinanceiro.comparativo.realizadoComparado)}</dd>
                      </div>
                    </dl>
                    <p className="mt-3 text-3xl font-semibold tabular-nums tracking-tight">
                      {brl(Math.abs(dashFinanceiro.comparativo.diferenca))}
                    </p>
                    <p className="mt-1 text-xs font-medium">
                      {dashFinanceiro.comparativo.diferenca >= 0 ? "Economizado" : "Acima do orçado"}
                    </p>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {dashFinanceiro.comparativo.linhasComparadas === 0
                        ? "Informe valor realizado nos itens adquiridos para calcular a economia."
                        : dashFinanceiro.saldoDisponivel > 0
                          ? `Saldo cobre até ${dashFinanceiro.itensCobertosPeloSaldo.itens} item(ns) fora do convite (${brl(dashFinanceiro.itensCobertosPeloSaldo.total)}).`
                          : "Sem saldo positivo para puxar itens fora do convite."}
                    </p>
                  </div>
                </div>
                {dashFinanceiro.porAno.length > 0 ? (
                  <div className="rounded-2xl border border-border/70 bg-card/90 p-5 shadow-sm">
                    <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-sm font-medium text-foreground">Investimentos por ano</p>
                        <p className="text-xs text-muted-foreground">
                          Quebra do previsto, realizado e total conforme o ano de aquisição do catálogo.
                        </p>
                      </div>
                    </div>
                    <div className="mt-4 overflow-x-auto rounded-lg border">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Ano</TableHead>
                            <TableHead className="text-right">Itens</TableHead>
                            <TableHead className="text-right">Unidades</TableHead>
                            <TableHead className="text-right">Previsto</TableHead>
                            <TableHead className="text-right">Realizado</TableHead>
                            <TableHead className="text-right">Total</TableHead>
                            <TableHead className="text-right">Sem orçamento</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dashFinanceiro.porAno.map((row) => (
                            <TableRow key={row.ano ?? "sem-ano"}>
                              <TableCell className="font-medium">{row.ano ?? "Sem ano"}</TableCell>
                              <TableCell className="text-right tabular-nums">{row.total.linhas}</TableCell>
                              <TableCell className="text-right tabular-nums">{row.total.unidadesTotal}</TableCell>
                              <TableCell className="text-right tabular-nums">{brl(row.previsto.total)}</TableCell>
                              <TableCell className="text-right tabular-nums">{brl(row.realizado.total)}</TableCell>
                              <TableCell className="text-right font-medium tabular-nums">{brl(row.total.total)}</TableCell>
                              <TableCell className="text-right tabular-nums text-muted-foreground">
                                {row.total.linhasSemOrcamento}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                ) : null}
                {dashFinanceiro.previsto.total + dashFinanceiro.realizado.total > 0 ? (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-muted-foreground">Proporção realizado vs. total</p>
                    <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                      <div
                        className="bg-emerald-600/90 dark:bg-emerald-500"
                        style={{
                          width: `${Math.min(100, Math.round((dashFinanceiro.realizado.total / (dashFinanceiro.previsto.total + dashFinanceiro.realizado.total)) * 100))}%`,
                        }}
                        title="Realizado"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {Math.round((dashFinanceiro.realizado.total / (dashFinanceiro.previsto.total + dashFinanceiro.realizado.total)) * 100)}% do
                      valor consolidado já está na base de adquiridos (por valores realizados cadastrados).
                    </p>
                  </div>
                ) : null}
              </>
            )}
          </CardContent>
        </details>
      ) : null}

      <div className="max-w-md">
        <div className="space-y-2">
          <Label>Hospital</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            value={hid}
            onChange={(e) => setHospitalId(e.target.value)}
          >
            {hospitals.data.map((h) => (
              <option key={h.id} value={h.id}>
                {h.nome} — {h.cidade}/{h.uf}
              </option>
            ))}
          </select>
        </div>
      </div>

      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Equipamentos</CardTitle>
            <CardDescription>
              Use o checkbox &quot;Publicar&quot; para definir quais itens da lista de compras aparecem no convite para
              cotação. &quot;Já adquirido&quot; tira o item da lista sem apagar o histórico.
            </CardDescription>
          </div>
          <Dialog
            open={openEq}
            onOpenChange={(o) => {
              setOpenEq(o);
              if (!o) {
                setEditing(null);
                setDraft(formState);
              }
            }}
          >
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editing ? "Editar equipamento" : "Novo equipamento"}</DialogTitle>
              </DialogHeader>
              <div className="grid gap-3 py-2">
                <div className="space-y-2">
                  <Label>Nome</Label>
                  <Input value={draft.nome} onChange={(e) => setDraft((d) => ({ ...d, nome: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Descrição</Label>
                  <Textarea rows={2} value={draft.descricao} onChange={(e) => setDraft((d) => ({ ...d, descricao: e.target.value }))} />
                </div>
                <div className="space-y-2">
                  <Label>Quantidade</Label>
                  <Input
                    inputMode="numeric"
                    className="max-w-[140px]"
                    value={draft.quantidade}
                    onChange={(e) => setDraft((d) => ({ ...d, quantidade: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Valor unitário orçado (R$)</Label>
                  <BrlMoneyInput
                    placeholder="0,00"
                    className="max-w-[220px]"
                    valueDigits={draft.precoUnitarioOrcado}
                    onDigitsChange={(precoUnitarioOrcado) => setDraft((d) => ({ ...d, precoUnitarioOrcado }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Opcional. Digite só números; a formatação em reais é automática. Não aparece para o fornecedor — use
                    para comparar com as cotações recebidas.
                  </p>
                </div>
                <div className="space-y-2">
                  <Label>Valor realizado/fechado (R$)</Label>
                  <BrlMoneyInput
                    placeholder="0,00"
                    className="max-w-[220px]"
                    valueDigits={draft.valorRealizado}
                    onDigitsChange={(valorRealizado) => setDraft((d) => ({ ...d, valorRealizado }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Preencha quando o item for adquirido. Este valor alimenta a economia orçado × realizado.
                  </p>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpenEq(false)}>
                  Cancelar
                </Button>
                <Button type="button" disabled={saveEquip.isPending || !draft.nome.trim()} onClick={() => saveEquip.mutate()}>
                  Salvar
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          <Button
            type="button"
            onClick={() => {
              setEditing(null);
              setDraft(formState);
              setOpenEq(true);
            }}
          >
            Novo equipamento
          </Button>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-3 rounded-2xl border border-border/70 bg-muted/25 p-4 sm:grid-cols-[minmax(0,1fr)_180px_180px] sm:items-end">
            <div>
              <p className="text-sm font-medium text-foreground">Filtros da lista</p>
              <p className="text-xs text-muted-foreground">
                Mostrando {equipamentosFiltrados.length} de {(equipamentos.data ?? []).length} equipamento(s).
              </p>
            </div>
            <div className="space-y-2">
              <Label>Ano</Label>
              <Select value={equipAnoFilter} onValueChange={(v) => setEquipAnoFilter(v ?? "todos")}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os anos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os anos</SelectItem>
                  {anosEquipamentos.map((ano) => (
                    <SelectItem key={ano} value={String(ano)}>
                      {ano}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select value={equipStatusFilter} onValueChange={(v) => setEquipStatusFilter(v ?? "todos")}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos os status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="ativos">Na pré-cotação</SelectItem>
                  <SelectItem value="adquiridos">Já adquiridos</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {mostrarAtivos ? (
          <div className="space-y-2">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-end sm:justify-between">
              <p className="text-sm font-medium text-foreground">Lista de compras</p>
              <p className="text-xs text-muted-foreground">
                {equipamentosPublicadosCount} de {equipamentosAtivosFiltrados.length} item(ns) publicados para cotação.
              </p>
            </div>
            <div className="overflow-x-auto rounded-lg border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Publicar</TableHead>
                    <TableHead>Nome</TableHead>
                    <TableHead className="w-20 text-right">Qtd</TableHead>
                    <TableHead className="w-24 text-right">Ano</TableHead>
                    <TableHead className="w-28 text-right">Orçado (un.)</TableHead>
                    <TableHead className="w-28 text-right">Orçado total</TableHead>
                    <TableHead>Setor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {equipamentosAtivosFiltrados.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                        Nenhum item ativo encontrado para os filtros selecionados.
                      </TableCell>
                    </TableRow>
                  ) : null}
                  {equipamentosAtivosFiltrados.map((eq) => (
                      <TableRow
                        key={eq.id}
                        className={cn(
                          !eq.publicarCotacao &&
                            "border-amber-200 bg-amber-50/80 text-amber-950 hover:bg-amber-100/80 dark:border-amber-900/60 dark:bg-amber-950/25 dark:text-amber-100 dark:hover:bg-amber-950/35",
                        )}
                      >
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Checkbox
                              aria-label={`Publicar ${eq.nome} para cotação`}
                              checked={eq.publicarCotacao}
                              disabled={setPublicarCotacaoEquipamento.isPending}
                              onCheckedChange={(v) =>
                                setPublicarCotacaoEquipamento.mutate({ id: eq.id, publicarCotacao: v === true })
                              }
                            />
                            <span
                              className={cn(
                                "text-xs",
                                eq.publicarCotacao
                                  ? "text-muted-foreground"
                                  : "rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-900 dark:bg-amber-900/40 dark:text-amber-100",
                              )}
                            >
                              {eq.publicarCotacao ? "Sim" : "Não"}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell
                          className={cn(
                            "max-w-[220px] font-medium",
                            !eq.publicarCotacao && "text-amber-950 dark:text-amber-100",
                          )}
                        >
                          <span className="block">{eq.nome}</span>
                          {eq.nomeOriginal ? (
                            <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{eq.nomeOriginal}</span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{eq.quantidade}</TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {eq.previsaoAquisicao || "—"}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {money(eq.precoUnitarioOrcado)}
                        </TableCell>
                        <TableCell className="text-right text-sm tabular-nums text-muted-foreground">
                          {money(eq.valorTotalOrcado)}
                        </TableCell>
                        <TableCell className="max-w-[140px] text-sm text-muted-foreground">{eq.setorHospitalar || "—"}</TableCell>
                        <TableCell className="text-right">
                          <div className="flex flex-wrap justify-end gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => {
                                setEditing(eq);
                                setDraft({
                                  nome: eq.nome,
                                  descricao: eq.descricao,
                                  quantidade: String(eq.quantidade),
                                  precoUnitarioOrcado: reaisToCentsDigitString(eq.precoUnitarioOrcado),
                                  valorRealizado: reaisToCentsDigitString(eq.valorRealizado),
                                });
                                setOpenEq(true);
                              }}
                            >
                              Editar
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              disabled={setAtivoEquipamento.isPending}
                              onClick={() => {
                                if (confirm("Marcar como já adquirido? O item sai do convite para novas cotações.")) {
                                  setAtivoEquipamento.mutate({ id: eq.id, ativo: false });
                                }
                              }}
                            >
                              Já adquirido
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => {
                                if (confirm("Remover este equipamento do cadastro?")) deleteEquip.mutate(eq.id);
                              }}
                            >
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </div>
          </div>
          ) : null}

          {mostrarAdquiridos ? (
            <div className="space-y-2">
              <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">Já adquiridos (fora do convite)</p>
              <div className="overflow-x-auto rounded-lg border border-dashed border-emerald-300 dark:border-emerald-900/70">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead className="w-20 text-right">Qtd</TableHead>
                      <TableHead className="w-24 text-right">Ano</TableHead>
                      <TableHead className="w-28 text-right">Orçado (un.)</TableHead>
                      <TableHead className="w-28 text-right">Orçado total</TableHead>
                      <TableHead className="w-28 text-right">Realizado</TableHead>
                      <TableHead>Setor</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {equipamentosAdquiridosFiltrados.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={8} className="text-center text-sm text-muted-foreground">
                          Nenhum item já adquirido encontrado para os filtros selecionados.
                        </TableCell>
                      </TableRow>
                    ) : null}
                    {equipamentosAdquiridosFiltrados.map((eq) => (
                        <TableRow
                          key={eq.id}
                          className="border-emerald-200 bg-emerald-50/80 text-emerald-950 hover:bg-emerald-100/80 dark:border-emerald-900/60 dark:bg-emerald-950/25 dark:text-emerald-100 dark:hover:bg-emerald-950/35"
                        >
                          <TableCell className="max-w-[220px] font-medium text-emerald-950 dark:text-emerald-100">
                            <span className="block">{eq.nome}</span>
                            {eq.nomeOriginal ? (
                              <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{eq.nomeOriginal}</span>
                            ) : null}
                          </TableCell>
                          <TableCell className="text-right tabular-nums">{eq.quantidade}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{eq.previsaoAquisicao || "—"}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{money(eq.precoUnitarioOrcado)}</TableCell>
                          <TableCell className="text-right text-sm tabular-nums">{money(eq.valorTotalOrcado)}</TableCell>
                          <TableCell className="text-right text-sm font-medium tabular-nums">{money(eq.valorRealizado)}</TableCell>
                          <TableCell className="max-w-[140px] text-sm">{eq.setorHospitalar || "—"}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex flex-wrap justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setEditing(eq);
                                  setDraft({
                                    nome: eq.nome,
                                    descricao: eq.descricao,
                                    quantidade: String(eq.quantidade),
                                    precoUnitarioOrcado: reaisToCentsDigitString(eq.precoUnitarioOrcado),
                                    valorRealizado: reaisToCentsDigitString(eq.valorRealizado),
                                  });
                                  setOpenEq(true);
                                }}
                              >
                                Editar
                              </Button>
                              <Button
                                size="sm"
                                variant="secondary"
                                disabled={setAtivoEquipamento.isPending}
                                onClick={() => setAtivoEquipamento.mutate({ id: eq.id, ativo: true })}
                              >
                                Voltar à pré-cotação
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => {
                                  if (confirm("Remover este equipamento do cadastro?")) deleteEquip.mutate(eq.id);
                                }}
                              >
                                Excluir
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <details className="group rounded-3xl border border-border/60 bg-card text-sm text-card-foreground shadow-sm">
        <summary className="cursor-pointer list-none rounded-3xl px-5 py-5 outline-none transition-colors hover:bg-muted/40 focus-visible:ring-3 focus-visible:ring-ring/50 sm:px-8 [&::-webkit-details-marker]:hidden">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="text-lg">Relatório consolidado</CardTitle>
              <CardDescription className="mt-1">
                Todas as cotações deste hospital em uma única tabela, recolhida para liberar espaço no painel.
              </CardDescription>
            </div>
            <div className="flex flex-col gap-1 sm:items-end">
              <p className="text-xs font-medium text-muted-foreground">Resumo</p>
              <p className="text-sm font-semibold tabular-nums text-foreground">
                {relatorioConsolidado.colunas.length} proposta(s) · {relatorioConsolidado.linhas.length} item(ns)
              </p>
              <span className="text-xs font-medium text-primary group-open:hidden">Abrir relatório</span>
              <span className="hidden text-xs font-medium text-primary group-open:inline">Recolher relatório</span>
            </div>
          </div>
        </summary>
        <CardContent className="pb-5">
          {!hid || cotacoes.isLoading ? (
            <div className="h-32 animate-pulse rounded-xl bg-muted/50" />
          ) : relatorioConsolidado.colunas.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Ainda não há cotações para este hospital. Quando os fornecedores enviarem propostas, elas aparecerão aqui
              e na lista abaixo.
            </p>
          ) : (
            <div className="max-h-[min(72vh,680px)] overflow-auto rounded-lg border">
              <Table className="min-w-max text-sm">
                <TableHeader>
                  <TableRow className="bg-muted/80 hover:bg-muted/80">
                    <TableHead className="sticky left-0 z-20 min-w-[220px] max-w-[280px] border-r bg-muted/95 shadow-sm">
                      Equipamento
                    </TableHead>
                    {relatorioConsolidado.colunas.map((cot) => (
                      <TableHead key={cot.id} className="min-w-[120px] max-w-[160px] whitespace-normal align-bottom text-xs font-semibold leading-tight">
                        <span className="line-clamp-2">{truncLabel(cot.fornecedorNome, 36)}</span>
                        <span className="mt-1 block font-normal text-muted-foreground">
                          {new Date(cot.createdAt).toLocaleString("pt-BR", { dateStyle: "short", timeStyle: "short" })}
                        </span>
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {relatorioConsolidado.linhas.map((row) => (
                    <TableRow key={row.equipamentoId} className="border-border/50">
                      <TableCell className="sticky left-0 z-[1] max-w-[280px] border-r bg-card align-top font-medium whitespace-normal shadow-sm">
                        <span className="block leading-snug">{row.nome}</span>
                        <span className="mt-1 block text-xs font-normal text-muted-foreground">
                          Qtd {row.quantidade} · Orçado {money(row.orcado)}
                        </span>
                      </TableCell>
                      {relatorioConsolidado.colunas.map((cot) => {
                        const cel = row.porCotacao[cot.id];
                        return (
                          <TableCell key={cot.id} className="min-w-[120px] align-top text-right tabular-nums">
                            {cel ? (
                              <div className="space-y-0.5">
                                <div className="font-semibold text-foreground">{money(cel.precoUnitario)}</div>
                                <div className="text-xs text-muted-foreground">{cel.prazoEntrega} dias</div>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        );
                      })}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </details>

      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Cotações recebidas</CardTitle>
          <CardDescription>
            Lista filtrada pelo hospital selecionado acima. Filtre por CNPJ, edite valores cotados, compare duas
            propostas ou exclua uma cotação inteira. “Vs orçado” usa o valor unitário orçado no cadastro do equipamento.
            PDFs de até{" "}
            {(MAX_PDF_BYTES / (1024 * 1024)).toFixed(0)} MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex max-w-md gap-2">
            <Input
              placeholder="CNPJ do fornecedor"
              className="max-w-[220px] tabular-nums"
              value={cnpjFilter}
              onChange={(e) => setCnpjFilter(formatCnpjInput(e.target.value))}
            />
            <Button type="button" variant="secondary" onClick={() => void cotacoes.refetch()}>
              Filtrar
            </Button>
          </div>

          {(cotacoes.data?.length ?? 0) >= 2 ? (
            <div className="rounded-xl border border-primary/15 bg-primary/[0.04] p-4">
              <p className="mb-3 text-sm font-medium text-foreground">Comparar duas cotações (preço unitário)</p>
              <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                <div className="min-w-[min(100%,220px)] flex-1 space-y-1.5">
                  <Label className="text-xs">Primeira cotação</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={compareA}
                    onChange={(e) => setCompareA(e.target.value)}
                  >
                    <option value="">Selecione…</option>
                    {cotacoes.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {rotuloCotacao(c)}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="min-w-[min(100%,220px)] flex-1 space-y-1.5">
                  <Label className="text-xs">Segunda cotação</Label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
                    value={compareB}
                    onChange={(e) => setCompareB(e.target.value)}
                  >
                    <option value="">Selecione…</option>
                    {cotacoes.data?.map((c) => (
                      <option key={c.id} value={c.id}>
                        {rotuloCotacao(c)}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  type="button"
                  variant="secondary"
                  disabled={!compareA || !compareB || compareA === compareB}
                  onClick={() => setCompareOpen(true)}
                >
                  Abrir comparação
                </Button>
              </div>
            </div>
          ) : null}

          <div className="space-y-6">
            {cotacoes.data?.map((c) => (
              <div key={c.id} className="rounded-xl border bg-muted/10 p-4">
                <div className="flex flex-col justify-between gap-2 sm:flex-row sm:items-start">
                  <div>
                    <p className="font-medium">{c.fornecedorNome}</p>
                    <p className="text-sm text-muted-foreground">
                      CNPJ {c.fornecedorCnpj} · {c.representanteNome} · {c.email}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.createdAt).toLocaleString("pt-BR")} · {c.convite.hospital.nome}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <a
                      href={`/api/admin/cotacoes/${c.id}/pdf`}
                      download
                      className={cn(buttonVariants({ size: "sm", variant: "outline" }), "inline-flex")}
                    >
                      Baixar PDF
                    </a>
                    <Button
                      type="button"
                      size="sm"
                      variant="destructive"
                      disabled={deleteCotacao.isPending}
                      onClick={() => {
                        if (
                          confirm(
                            "Excluir esta cotação permanentemente? O PDF será removido e não poderá ser desfeito.",
                          )
                        ) {
                          deleteCotacao.mutate(c.id);
                        }
                      }}
                    >
                      Excluir cotação
                    </Button>
                  </div>
                </div>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipamento</TableHead>
                      <TableHead className="text-right">Orçado (un.)</TableHead>
                      <TableHead className="text-right">Cotado (un.)</TableHead>
                      <TableHead>Vs orçado</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Obs.</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.itens.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.equipamento.nome}</TableCell>
                        <TableCell className="text-right tabular-nums">{money(it.equipamento.precoUnitarioOrcado)}</TableCell>
                        <TableCell className="text-right tabular-nums font-medium">{money(it.precoUnitario)}</TableCell>
                        <TableCell>{vsOrcadoBadge(it.precoUnitario, it.equipamento.precoUnitarioOrcado)}</TableCell>
                        <TableCell>{it.prazoEntrega} dias</TableCell>
                        <TableCell className="text-sm">
                          {it.condicoesPagamento}
                          {it.condicoesPagamentoDetalhe ? ` — ${it.condicoesPagamentoDetalhe}` : ""}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{it.observacoes || "—"}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              setItemEdit({
                                itemId: it.id,
                                fornecedorNome: c.fornecedorNome,
                                equipNome: it.equipamento.nome,
                                precoUnitario: reaisToCentsDigitString(it.precoUnitario),
                                prazoEntrega: String(it.prazoEntrega),
                                condicoesPagamento: it.condicoesPagamento,
                                condicoesPagamentoDetalhe: it.condicoesPagamentoDetalhe ?? "",
                                observacoes: it.observacoes ?? "",
                              })
                            }
                          >
                            Editar linha
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ))}
            {!cotacoes.data?.length ? <p className="text-sm text-muted-foreground">Nenhuma cotação ainda.</p> : null}
          </div>
        </CardContent>
      </Card>

      <Dialog open={compareOpen} onOpenChange={setCompareOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Comparação lado a lado</DialogTitle>
          </DialogHeader>
          {(() => {
            const ca = cotacoes.data?.find((x) => x.id === compareA);
            const cb = cotacoes.data?.find((x) => x.id === compareB);
            if (!ca || !cb) {
              return <p className="text-sm text-muted-foreground">Selecione duas cotações válidas.</p>;
            }
            const rows = linhasComparacao(ca, cb);
            return (
              <div className="space-y-3 py-2">
                <p className="text-xs text-muted-foreground">
                  <span className="font-medium text-foreground">{ca.fornecedorNome}</span> ×{" "}
                  <span className="font-medium text-foreground">{cb.fornecedorNome}</span>
                </p>
                <div className="overflow-x-auto rounded-lg border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Equipamento</TableHead>
                        <TableHead className="max-w-[140px] text-right text-xs font-normal">
                          {truncLabel(ca.fornecedorNome)}
                        </TableHead>
                        <TableHead className="max-w-[140px] text-right text-xs font-normal">
                          {truncLabel(cb.fornecedorNome)}
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {rows.map((r) => (
                        <TableRow key={r.eqId}>
                          <TableCell className="font-medium">{r.nome}</TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {r.ia ? money(r.ia.precoUnitario) : "—"}
                          </TableCell>
                          <TableCell className="text-right tabular-nums text-sm">
                            {r.ib ? money(r.ib.precoUnitario) : "—"}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            );
          })()}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setCompareOpen(false)}>
              Fechar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!itemEdit} onOpenChange={(o) => !o && setItemEdit(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar linha da cotação</DialogTitle>
          </DialogHeader>
          {itemEdit ? (
            <div className="grid gap-3 py-2">
              <p className="text-sm text-muted-foreground">
                {itemEdit.fornecedorNome} · <span className="font-medium text-foreground">{itemEdit.equipNome}</span>
              </p>
              <div className="space-y-2">
                <Label>Preço unitário cotado (R$)</Label>
                <BrlMoneyInput
                  valueDigits={itemEdit.precoUnitario}
                  onDigitsChange={(precoUnitario) => setItemEdit((s) => (s ? { ...s, precoUnitario } : s))}
                />
              </div>
              <div className="space-y-2">
                <Label>Prazo de entrega (dias)</Label>
                <Input
                  inputMode="numeric"
                  className="max-w-[140px]"
                  value={itemEdit.prazoEntrega}
                  onChange={(e) => setItemEdit((s) => (s ? { ...s, prazoEntrega: e.target.value } : s))}
                />
              </div>
              <div className="space-y-2">
                <Label>Condição de pagamento</Label>
                <Select
                  value={itemEdit.condicoesPagamento}
                  onValueChange={(v) =>
                    setItemEdit((s) => (s ? { ...s, condicoesPagamento: v || s.condicoesPagamento } : s))
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {PAGAMENTO_OPCOES.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Detalhe do pagamento</Label>
                <Input
                  value={itemEdit.condicoesPagamentoDetalhe}
                  onChange={(e) => setItemEdit((s) => (s ? { ...s, condicoesPagamentoDetalhe: e.target.value } : s))}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  rows={3}
                  value={itemEdit.observacoes}
                  onChange={(e) => setItemEdit((s) => (s ? { ...s, observacoes: e.target.value } : s))}
                />
              </div>
            </div>
          ) : null}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setItemEdit(null)}>
              Cancelar
            </Button>
            <Button type="button" disabled={patchCotacaoItem.isPending || !itemEdit} onClick={() => patchCotacaoItem.mutate()}>
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
