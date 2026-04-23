"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { MAX_PDF_BYTES } from "@/lib/pdf-constants";

type Hospital = { id: string; nome: string; cnpj: string; cidade: string; uf: string };
type Equipamento = {
  id: string;
  nome: string;
  descricao: string;
  quantidade: number;
  ativo: boolean;
  importRef?: string;
  nomeOriginal?: string;
  setorHospitalar?: string;
  requisitosMinimos?: string;
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
  convite: { hospital: { nome: string } };
  itens: Array<{
    id: string;
    precoUnitario: unknown;
    prazoEntrega: number;
    condicoesPagamento: string;
    condicoesPagamentoDetalhe: string;
    observacoes: string;
    equipamento: { nome: string };
  }>;
};

const money = (v: unknown) => {
  const n = typeof v === "string" ? Number(v) : Number(v);
  if (!Number.isFinite(n)) return "—";
  return n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
};

export function AdminPanel() {
  const router = useRouter();
  const qc = useQueryClient();
  const [hospitalId, setHospitalId] = useState<string>("");
  const [cnpjFilter, setCnpjFilter] = useState("");
  const [openEq, setOpenEq] = useState(false);
  const [editing, setEditing] = useState<Equipamento | null>(null);
  const [jsonImport, setJsonImport] = useState("");

  const formState = useMemo(
    () => ({
      nome: "",
      descricao: "",
      quantidade: "1",
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
    queryKey: ["admin", "cotacoes", cnpjFilter],
    queryFn: async () => {
      const q = cnpjFilter.trim() ? `?cnpj=${encodeURIComponent(cnpjFilter.trim())}` : "";
      const res = await fetch(`/api/admin/cotacoes${q}`);
      if (!res.ok) throw new Error("Falha ao carregar cotações.");
      return (await res.json()) as CotacaoRow[];
    },
  });

  const createConvite = useMutation({
    mutationFn: async () => {
      const res = await fetch("/api/admin/convites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hospitalId: hid }),
      });
      if (!res.ok) throw new Error("Falha ao criar convite.");
      return (await res.json()) as { token: string };
    },
    onSuccess: (data) => {
      const url = `${typeof window !== "undefined" ? window.location.origin : ""}/c/${data.token}`;
      void navigator.clipboard.writeText(url).catch(() => {});
      toast.success("Link copiado para a área de transferência.", { description: url });
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const saveEquip = useMutation({
    mutationFn: async () => {
      const body = {
        hospitalId: hid,
        nome: draft.nome.trim(),
        descricao: draft.descricao.trim(),
        quantidade: Number(draft.quantidade) || 1,
      };
      if (editing) {
        const res = await fetch(`/api/admin/equipamentos/${editing.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Falha ao atualizar.");
        return res.json();
      }
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

  const importJson = useMutation({
    mutationFn: async () => {
      const parsed = JSON.parse(jsonImport) as unknown;
      const arr = Array.isArray(parsed) ? parsed : (parsed as { equipamentos?: unknown }).equipamentos;
      if (!Array.isArray(arr)) throw new Error("JSON deve ser um array de equipamentos.");
      for (const row of arr) {
        const o = row as Record<string, unknown>;
        const nome =
          String(o.nome_padronizado ?? o.nomePadronizado ?? o.nome ?? "").trim() ||
          String(o.nome_original ?? o.nomeOriginal ?? "").trim();
        if (!nome) continue;
        const res = await fetch("/api/admin/equipamentos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ hospitalId: hid, ...o }),
        });
        if (!res.ok) throw new Error(`Falha ao importar: ${nome}`);
      }
    },
    onSuccess: () => {
      toast.success("Importação concluída.");
      setJsonImport("");
      void qc.invalidateQueries({ queryKey: ["admin", "equipamentos", hid] });
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

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
        <div className="flex items-end">
          <Button type="button" className="w-full" onClick={() => createConvite.mutate()} disabled={!hid || createConvite.isPending}>
            Gerar novo link de convite
          </Button>
        </div>
      </div>

      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="text-lg">Equipamentos</CardTitle>
            <CardDescription>Catálogo deste hospital — o que os fornecedores veem no convite.</CardDescription>
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
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label>
              Importar JSON (array simples ou enriquecido: nome_padronizado, descricao_editavel, setor_hospitalar,
              requisitos_minimos, id, etc.)
            </Label>
            <Textarea
              rows={4}
              value={jsonImport}
              onChange={(e) => setJsonImport(e.target.value)}
              placeholder='[{"id":"eq_001","nome_padronizado":"...","setor_hospitalar":"UTI"}]'
            />
            <Button type="button" variant="secondary" size="sm" disabled={!jsonImport.trim() || importJson.isPending} onClick={() => importJson.mutate()}>
              Importar
            </Button>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Setor</TableHead>
                  <TableHead>Qtd</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {equipamentos.data?.map((eq) => (
                  <TableRow key={eq.id}>
                    <TableCell className="max-w-[220px] font-medium">
                      <span className="block">{eq.nome}</span>
                      {eq.nomeOriginal ? (
                        <span className="mt-0.5 block text-xs font-normal text-muted-foreground">{eq.nomeOriginal}</span>
                      ) : null}
                    </TableCell>
                    <TableCell className="max-w-[140px] text-sm text-muted-foreground">{eq.setorHospitalar || "—"}</TableCell>
                    <TableCell>{eq.quantidade}</TableCell>
                    <TableCell className="text-right space-x-2">
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setEditing(eq);
                          setDraft({
                            nome: eq.nome,
                            descricao: eq.descricao,
                            quantidade: String(eq.quantidade),
                          });
                          setOpenEq(true);
                        }}
                      >
                        Editar
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => {
                          if (confirm("Remover este equipamento?")) deleteEquip.mutate(eq.id);
                        }}
                      >
                        Excluir
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardHeader>
          <CardTitle className="text-lg">Cotações recebidas</CardTitle>
          <CardDescription>
            Filtre por CNPJ parcial do fornecedor. PDFs de até {(MAX_PDF_BYTES / (1024 * 1024)).toFixed(0)} MB.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex max-w-md gap-2">
            <Input placeholder="CNPJ do fornecedor" value={cnpjFilter} onChange={(e) => setCnpjFilter(e.target.value)} />
            <Button type="button" variant="secondary" onClick={() => void cotacoes.refetch()}>
              Filtrar
            </Button>
          </div>
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
                  <a
                    href={`/api/admin/cotacoes/${c.id}/pdf`}
                    download
                    className={cn(buttonVariants({ size: "sm", variant: "outline" }), "inline-flex")}
                  >
                    Baixar PDF
                  </a>
                </div>
                <Table className="mt-4">
                  <TableHeader>
                    <TableRow>
                      <TableHead>Equipamento</TableHead>
                      <TableHead>Preço unit.</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Pagamento</TableHead>
                      <TableHead>Obs.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {c.itens.map((it) => (
                      <TableRow key={it.id}>
                        <TableCell>{it.equipamento.nome}</TableCell>
                        <TableCell>{money(it.precoUnitario)}</TableCell>
                        <TableCell>{it.prazoEntrega} dias</TableCell>
                        <TableCell className="text-sm">
                          {it.condicoesPagamento}
                          {it.condicoesPagamentoDetalhe ? ` — ${it.condicoesPagamentoDetalhe}` : ""}
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-sm text-muted-foreground">{it.observacoes || "—"}</TableCell>
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
    </div>
  );
}
