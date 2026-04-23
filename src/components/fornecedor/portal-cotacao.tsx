"use client";

import { useMutation, useQuery } from "@tanstack/react-query";
import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { condicaoPagamentoEnum, cotacaoPublicaPayload } from "@/lib/schemas/cotacao-publica";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { INSTITUICAO_PROPOSTA } from "@/lib/instituicao-publica";
import { MAX_PDF_BYTES } from "@/lib/pdf-constants";
import { cn } from "@/lib/utils";

type ConviteApi = {
  convite: { id: string; token: string; titulo: string; textoIntro: string };
  hospital: { id: string; nome: string; cnpj: string; cidade: string; uf: string };
  equipamentos: Array<{
    id: string;
    nome: string;
    descricao: string;
    quantidade: number;
    categoria: string;
    criticidade: string;
  }>;
};

const topoSchema = z.object({
  fornecedorNome: z.string().min(2, "Informe o nome da empresa."),
  fornecedorCnpj: z.string().min(8, "CNPJ muito curto."),
  representanteNome: z.string().min(2, "Informe o representante."),
  telefone: z.string().min(8, "Telefone muito curto."),
  email: z.string().email("E-mail inválido."),
  feira: z.boolean(),
  feiraNome: z.string().optional(),
  stand: z.string().optional(),
  feiraLocalizacao: z.string().optional(),
});

type TopoForm = z.infer<typeof topoSchema>;

type ItemDraft = {
  precoUnitario: string;
  prazoEntrega: string;
  condicoesPagamento: z.infer<typeof condicaoPagamentoEnum>;
  condicoesPagamentoDetalhe: string;
  observacoes: string;
};

const emptyItem = (): ItemDraft => ({
  precoUnitario: "",
  prazoEntrega: "",
  condicoesPagamento: "A_VISTA",
  condicoesPagamentoDetalhe: "",
  observacoes: "",
});

function PortalStepIndicator({ step }: { step: 1 | 2 | 3 }) {
  const items = [
    { n: 1 as const, label: "Dados e itens" },
    { n: 2 as const, label: "Valores" },
    { n: 3 as const, label: "PDF e envio" },
  ];
  return (
    <div className="mb-8 flex flex-wrap items-center justify-center gap-y-2 sm:gap-x-1">
      {items.map((it, i) => (
        <div key={it.n} className="flex items-center">
          {i > 0 ? (
            <span className="mx-1 hidden text-muted-foreground/50 sm:mx-2 sm:inline" aria-hidden>
              ·
            </span>
          ) : null}
          <span
            className={cn(
              "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium sm:text-sm",
              step === it.n
                ? "border-primary bg-primary text-primary-foreground shadow-md"
                : "border-border/80 bg-card/90 text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full text-[10px] tabular-nums sm:size-6 sm:text-xs",
                step === it.n ? "bg-primary-foreground/20" : "bg-muted",
              )}
            >
              {it.n}
            </span>
            {it.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function PortalCotacao({ token }: { token: string }) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [selected, setSelected] = useState<Record<string, boolean>>({});
  const [itemsDraft, setItemsDraft] = useState<Record<string, ItemDraft>>({});
  const [pdf, setPdf] = useState<File | null>(null);

  const q = useQuery({
    queryKey: ["convite", token],
    queryFn: async () => {
      const res = await fetch(`/api/public/convite/${encodeURIComponent(token)}`);
      if (!res.ok) throw new Error("Convite não encontrado");
      return (await res.json()) as ConviteApi;
    },
  });

  const form = useForm<TopoForm>({
    resolver: zodResolver(topoSchema),
    defaultValues: {
      fornecedorNome: "",
      fornecedorCnpj: "",
      representanteNome: "",
      telefone: "",
      email: "",
      feira: false,
      feiraNome: "",
      stand: "",
      feiraLocalizacao: "",
    },
  });

  const feira = useWatch({ control: form.control, name: "feira", defaultValue: false });

  const selectedList = useMemo(() => {
    if (!q.data) return [];
    return q.data.equipamentos.filter((e) => selected[e.id]);
  }, [q.data, selected]);

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);

  const mutation = useMutation({
    mutationFn: async () => {
      const topo = form.getValues();
      const itens = selectedList.map((eq) => {
        const d = itemsDraft[eq.id] ?? emptyItem();
        return {
          equipamentoId: eq.id,
          precoUnitario: Number(d.precoUnitario.replace(",", ".")),
          prazoEntrega: Number(d.prazoEntrega),
          condicoesPagamento: d.condicoesPagamento,
          condicoesPagamentoDetalhe: d.condicoesPagamentoDetalhe,
          observacoes: d.observacoes,
        };
      });

      const payload = {
        token,
        ...topo,
        itens,
      };

      const parsed = cotacaoPublicaPayload.safeParse(payload);
      if (!parsed.success) {
        throw new Error("Validação: verifique os campos.");
      }
      if (!pdf) {
        throw new Error("PDF obrigatório.");
      }
      if (pdf.size > MAX_PDF_BYTES) {
        throw new Error("PDF acima de 10MB.");
      }
      if (pdf.type !== "application/pdf") {
        throw new Error("Envie apenas PDF.");
      }

      const fd = new FormData();
      fd.set("payload", JSON.stringify(parsed.data));
      fd.set("pdf", pdf);
      const res = await fetch("/api/public/cotacao", { method: "POST", body: fd });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error?.toString?.() ?? "Falha ao enviar.");
      }
      return res.json();
    },
    onSuccess: () => {
      toast.success("Cotação enviada com sucesso!");
      setStep(1);
      form.reset();
      setSelected({});
      setItemsDraft({});
      setPdf(null);
    },
    onError: (e: Error) => toast.error(e.message),
  });

  function toggleEquip(id: string, v: boolean) {
    setSelected((s) => ({ ...s, [id]: v }));
    setItemsDraft((d) => {
      const next = { ...d };
      if (v && !next[id]) next[id] = emptyItem();
      return next;
    });
  }

  function firstFormErrorMessage(): string | undefined {
    const errs = form.formState.errors;
    const keys = Object.keys(errs) as (keyof typeof errs)[];
    for (const k of keys) {
      const m = errs[k]?.message;
      if (typeof m === "string" && m) return m;
    }
    return undefined;
  }

  async function goStep2() {
    const valid = await form.trigger();
    if (!valid) {
      const detail = firstFormErrorMessage();
      toast.error("Corrija os dados do fornecedor para continuar.", {
        description: detail ?? "Verifique nome, CNPJ, representante, telefone e e-mail.",
      });
      return;
    }
    const n = Object.values(selected).filter(Boolean).length;
    if (n < 1) {
      toast.error("Selecione ao menos um equipamento.");
      return;
    }
    if (form.getValues("feira")) {
      const fn = form.getValues("feiraNome")?.trim();
      const st = form.getValues("stand")?.trim();
      if (!fn || !st) {
        toast.error("Preencha nome da feira e stand.");
        return;
      }
    }
    setStep(2);
  }

  function goStep3() {
    for (const eq of selectedList) {
      const d = itemsDraft[eq.id] ?? emptyItem();
      const preco = Number(d.precoUnitario.replace(",", "."));
      const prazo = Number(d.prazoEntrega);
      if (!Number.isFinite(preco) || preco <= 0) {
        toast.error(`Preço inválido: ${eq.nome}`);
        return;
      }
      if (!Number.isFinite(prazo) || prazo < 1) {
        toast.error(`Prazo inválido: ${eq.nome}`);
        return;
      }
    }
    setStep(3);
  }

  if (q.isLoading) {
    return (
      <div className="mx-auto flex max-w-md flex-col items-center gap-5 px-4 py-24">
        <div className="size-14 animate-pulse rounded-2xl bg-primary/15" />
        <div className="space-y-2 text-center">
          <p className="text-sm font-medium text-foreground">Preparando seu convite…</p>
          <p className="text-xs text-muted-foreground">Só um instante.</p>
        </div>
      </div>
    );
  }
  if (q.isError || !q.data) {
    return (
      <div className="mx-auto max-w-lg space-y-4 px-4 py-12 text-center">
        <p className="font-medium text-destructive">Convite não encontrado ou inativo.</p>
        <p className="text-pretty text-sm text-muted-foreground">
          O token <span className="rounded bg-muted px-1.5 py-0.5 font-mono text-foreground">{token}</span> não existe
          neste banco ou o convite foi desativado. Use o link enviado pelo hospital ou gere um novo no painel admin.
        </p>
        <p className="text-pretty text-xs text-muted-foreground">
          O link <code className="rounded bg-muted px-1">demo-convite-local</code> é criado automaticamente na primeira
          visita após as migrações. Se o erro persistir, confira <code className="rounded bg-muted px-1">DATABASE_URL</code>{" "}
          e se as tabelas existem (<code className="rounded bg-muted px-1">npx prisma migrate deploy</code>).
        </p>
      </div>
    );
  }

  const { convite } = q.data;

  return (
    <div className="mx-auto max-w-4xl space-y-6 px-4 py-8 pb-28 sm:py-10">
      <PortalStepIndicator step={step} />

      <header className="overflow-hidden rounded-3xl border border-border/60 bg-card/95 px-5 py-6 shadow-md shadow-primary/5 sm:px-8 sm:py-8">
        <p className="text-center text-xs font-semibold uppercase tracking-widest text-primary">Pré-cotação hospitalar</p>
        <h1 className="mt-2 text-balance text-center text-xl font-semibold tracking-tight text-foreground sm:text-2xl">
          {convite.titulo}
        </h1>
        <p className="mx-auto mt-2 max-w-2xl text-center text-sm text-muted-foreground">
          Confira abaixo para quem endereçar sua proposta e leia o texto do processo com calma.
        </p>
        <div className="mx-auto mt-6 max-w-xl rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/[0.06] to-transparent px-4 py-5 text-left text-sm sm:px-5">
          <p className="mb-3 text-center text-xs font-semibold text-primary">Destinatário da sua proposta</p>
          <dl className="space-y-3 text-foreground/95">
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Razão social</dt>
              <dd className="font-medium leading-snug">{INSTITUICAO_PROPOSTA.razaoSocial}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">CNPJ</dt>
              <dd className="tabular-nums">{INSTITUICAO_PROPOSTA.cnpj}</dd>
            </div>
            <div>
              <dt className="text-xs font-medium text-muted-foreground">Endereço</dt>
              <dd className="leading-snug text-pretty">{INSTITUICAO_PROPOSTA.endereco}</dd>
            </div>
          </dl>
        </div>
      </header>

      <Card className="rounded-3xl border-border/60 shadow-sm">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Sobre este processo</CardTitle>
          <CardDescription className="text-pretty text-base leading-relaxed text-muted-foreground">
            {convite.textoIntro}
          </CardDescription>
        </CardHeader>
      </Card>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div key="s1" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <Card className="rounded-3xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Seus dados</CardTitle>
                <CardDescription>Quem está respondendo neste convite — usamos para contato em caso de dúvida.</CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2 sm:col-span-2">
                  <Label>Nome da empresa</Label>
                  <Input {...form.register("fornecedorNome")} />
                  {form.formState.errors.fornecedorNome ? (
                    <p className="text-xs text-destructive">{form.formState.errors.fornecedorNome.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>CNPJ</Label>
                  <Input {...form.register("fornecedorCnpj")} />
                  {form.formState.errors.fornecedorCnpj ? (
                    <p className="text-xs text-destructive">{form.formState.errors.fornecedorCnpj.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Representante</Label>
                  <Input {...form.register("representanteNome")} />
                  {form.formState.errors.representanteNome ? (
                    <p className="text-xs text-destructive">{form.formState.errors.representanteNome.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Telefone</Label>
                  <Input {...form.register("telefone")} />
                  {form.formState.errors.telefone ? (
                    <p className="text-xs text-destructive">{form.formState.errors.telefone.message}</p>
                  ) : null}
                </div>
                <div className="space-y-2">
                  <Label>Email</Label>
                  <Input type="email" {...form.register("email")} />
                  {form.formState.errors.email ? (
                    <p className="text-xs text-destructive">{form.formState.errors.email.message}</p>
                  ) : null}
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <Checkbox id="feira" checked={feira} onCheckedChange={(v) => form.setValue("feira", v === true)} />
                  <Label htmlFor="feira">Estarei presente na Feira Hospitalar</Label>
                </div>
                {feira ? (
                  <>
                    <div className="space-y-2">
                      <Label>Nome da feira</Label>
                      <Input {...form.register("feiraNome")} />
                    </div>
                    <div className="space-y-2">
                      <Label>Número do stand</Label>
                      <Input {...form.register("stand")} />
                    </div>
                    <div className="space-y-2 sm:col-span-2">
                      <Label>Localização (opcional)</Label>
                      <Input {...form.register("feiraLocalizacao")} />
                    </div>
                  </>
                ) : null}
              </CardContent>
            </Card>

            <Card className="mt-6 rounded-3xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Equipamentos do convite</CardTitle>
                <CardDescription>
                  Marque o que você realmente fornece. Esta lista tem{" "}
                  <span className="font-semibold text-foreground/80">{q.data.equipamentos.length}</span> itens. Na próxima
                  etapa você informa preço e prazo só dos selecionados.
                </CardDescription>
                {selectedCount > 0 ? (
                  <p className="text-xs font-medium text-primary">{selectedCount} item(ns) selecionado(s)</p>
                ) : null}
              </CardHeader>
              <CardContent className="max-h-[min(70vh,560px)] overflow-auto rounded-b-3xl">
                <Table>
                  <TableHeader>
                    <TableRow className="border-border/60 bg-muted/40 hover:bg-muted/40">
                      <TableHead className="w-12">Forneço</TableHead>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead className="text-right">Qtd</TableHead>
                      <TableHead>Categoria</TableHead>
                      <TableHead>Criticidade</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {q.data.equipamentos.map((eq) => (
                      <TableRow key={eq.id}>
                        <TableCell>
                          <Checkbox checked={!!selected[eq.id]} onCheckedChange={(v) => toggleEquip(eq.id, v === true)} />
                        </TableCell>
                        <TableCell className="font-medium">{eq.nome}</TableCell>
                        <TableCell className="max-w-[200px] text-sm text-muted-foreground">{eq.descricao}</TableCell>
                        <TableCell className="text-right">{eq.quantidade}</TableCell>
                        <TableCell className="text-sm">{eq.categoria || "—"}</TableCell>
                        <TableCell className="text-sm">{eq.criticidade || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="mt-10 flex flex-col items-stretch gap-3 sm:flex-row sm:justify-end">
              <Button type="button" size="lg" className="h-12 min-w-[220px] rounded-full text-base shadow-md" onClick={goStep2}>
                Continuar para proposta
              </Button>
            </div>
          </motion.div>
        ) : null}

        {step === 2 ? (
          <motion.div key="s2" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <Card className="rounded-3xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Valores da sua proposta</CardTitle>
                <CardDescription>Um bloco por item selecionado. Use ponto ou vírgula no preço.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {selectedList.map((eq) => {
                  const d = itemsDraft[eq.id] ?? emptyItem();
                  return (
                    <div key={eq.id} className="rounded-2xl border border-border/50 bg-muted/25 p-4 sm:p-5">
                      <div className="mb-3 text-base font-semibold text-foreground">{eq.nome}</div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label>Preço unitário (R$)</Label>
                          <Input
                            inputMode="decimal"
                            value={d.precoUnitario}
                            onChange={(e) =>
                              setItemsDraft((x) => ({ ...x, [eq.id]: { ...d, precoUnitario: e.target.value } }))
                            }
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Prazo (dias)</Label>
                          <Input
                            inputMode="numeric"
                            value={d.prazoEntrega}
                            onChange={(e) =>
                              setItemsDraft((x) => ({ ...x, [eq.id]: { ...d, prazoEntrega: e.target.value } }))
                            }
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Condições de pagamento</Label>
                          <Select
                            value={d.condicoesPagamento}
                            onValueChange={(v) =>
                              setItemsDraft((x) => ({
                                ...x,
                                [eq.id]: { ...d, condicoesPagamento: v as ItemDraft["condicoesPagamento"] },
                              }))
                            }
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="A_VISTA">À vista</SelectItem>
                              <SelectItem value="FATURADO_30_60_90">30/60/90 (faturado)</SelectItem>
                              <SelectItem value="OUTRO">Outro (detalhar)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Detalhe / livre (ex.: 30/60/90, faturado)</Label>
                          <Input
                            value={d.condicoesPagamentoDetalhe}
                            onChange={(e) =>
                              setItemsDraft((x) => ({ ...x, [eq.id]: { ...d, condicoesPagamentoDetalhe: e.target.value } }))
                            }
                            placeholder="Opcional se já escolheu no menu"
                          />
                        </div>
                        <div className="space-y-2 sm:col-span-2">
                          <Label>Observações do item</Label>
                          <Textarea
                            rows={2}
                            value={d.observacoes}
                            onChange={(e) => setItemsDraft((x) => ({ ...x, [eq.id]: { ...d, observacoes: e.target.value } }))}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" className="rounded-full sm:min-w-[120px]" onClick={() => setStep(1)}>
                Voltar
              </Button>
              <Button type="button" size="lg" className="h-12 rounded-full px-8 shadow-md" onClick={goStep3}>
                Continuar para anexo
              </Button>
            </div>
          </motion.div>
        ) : null}

        {step === 3 ? (
          <motion.div key="s3" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-4">
            <Card className="rounded-3xl border-border/60 shadow-sm">
              <CardHeader>
                <CardTitle className="text-lg">Proposta em PDF</CardTitle>
                <CardDescription>Anexe o arquivo oficial da sua empresa (obrigatório, até 10 MB, somente PDF).</CardDescription>
              </CardHeader>
              <CardContent>
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={(e) => setPdf(e.target.files?.[0] ?? null)}
                  className="cursor-pointer"
                />
                {pdf ? <p className="mt-2 text-sm text-muted-foreground">Selecionado: {pdf.name}</p> : null}
              </CardContent>
            </Card>
            <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-between">
              <Button type="button" variant="outline" className="rounded-full sm:min-w-[120px]" onClick={() => setStep(2)}>
                Voltar
              </Button>
              <Button type="button" size="lg" className="h-12 rounded-full px-8 shadow-md" disabled={mutation.isPending} onClick={() => mutation.mutate()}>
                {mutation.isPending ? "Enviando…" : "Enviar cotação"}
              </Button>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
