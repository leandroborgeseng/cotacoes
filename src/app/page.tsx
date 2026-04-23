import Image from "next/image";
import Link from "next/link";
import { ClipboardList, FileCheck2, Link2, Package, Sparkles } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { INSTITUICAO_PROPOSTA } from "@/lib/instituicao-publica";
import { ensureDemoInvite } from "@/lib/ensure-demo-invite";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

async function resumoItensPretendidos() {
  try {
    await ensureDemoInvite();
    const where = {
      ativo: true,
      hospital: { cnpj: INSTITUICAO_PROPOSTA.cnpj },
    } as const;
    const [agg, linhas] = await Promise.all([
      prisma.equipamento.aggregate({ where, _sum: { quantidade: true } }),
      prisma.equipamento.count({ where }),
    ]);
    const unidades = agg._sum.quantidade ?? 0;
    return { linhas, unidades };
  } catch {
    return { linhas: 0, unidades: 0 };
  }
}

const passos = [
  {
    icon: Link2,
    titulo: "Abra o link",
    texto: "Você recebe um convite exclusivo do hospital — funciona no celular na feira ou no escritório.",
  },
  {
    icon: ClipboardList,
    titulo: "Marque e preencha",
    texto: "Indique o que fornece, valores e prazos. Só aparece o que você escolheu na hora da proposta.",
  },
  {
    icon: FileCheck2,
    titulo: "Anexe e envie",
    texto: "Proposta em PDF (até 10 MB) e pronto: sua cotação chega segura para a equipe de compras.",
  },
] as const;

export default async function Home() {
  const { linhas, unidades } = await resumoItensPretendidos();

  return (
    <div className="flex flex-1 flex-col">
      <section className="relative overflow-hidden px-4 pb-16 pt-10 sm:pb-20 sm:pt-14">
        <div className="mx-auto max-w-4xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-3xl border border-border/60 bg-card/90 px-8 py-6 shadow-lg shadow-primary/5 backdrop-blur-sm sm:px-12 sm:py-8">
              <Image
                src={INSTITUICAO_PROPOSTA.logoSrc}
                alt={INSTITUICAO_PROPOSTA.logoAlt}
                width={560}
                height={160}
                className="mx-auto h-auto max-h-24 w-full max-w-md object-contain sm:max-h-28"
                priority
              />
            </div>
          </div>
          <p className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:text-sm">
            <Sparkles className="size-3.5 shrink-0 sm:size-4" aria-hidden />
            Pré-cotação hospitalar
          </p>
          <h1 className="mt-5 text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl md:text-5xl">
            Sua proposta em poucos minutos, com clareza e confiança
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-pretty text-base text-muted-foreground sm:text-lg">
            Canal oficial para fornecedores responderem à pré-cotação do{" "}
            <span className="font-medium text-foreground/90">{INSTITUICAO_PROPOSTA.razaoSocial}</span>. Sem
            planilhas complicadas: você marca os itens, informa preços e envia o PDF da proposta.
          </p>
          {linhas > 0 ? (
            <div className="mx-auto mt-6 flex max-w-md flex-col items-center gap-2 rounded-2xl border border-primary/20 bg-primary/[0.06] px-5 py-4 text-center sm:max-w-lg sm:flex-row sm:justify-center sm:gap-4 sm:py-4">
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Package className="size-5" aria-hidden />
              </span>
              <p className="text-sm leading-relaxed text-foreground/95 sm:text-left sm:text-base">
                <span className="font-semibold tabular-nums text-foreground">{linhas}</span>{" "}
                {linhas === 1 ? "item" : "itens"} na lista que o hospital pretende cotar
                {unidades !== linhas ? (
                  <>
                    , totalizando{" "}
                    <span className="font-semibold tabular-nums text-foreground">{unidades}</span> unidades.
                  </>
                ) : (
                  "."
                )}
              </p>
            </div>
          ) : null}
          <div className="mt-10 flex flex-col items-stretch justify-center gap-3 sm:flex-row sm:items-center">
            <Link
              href="/c/demo-convite-local"
              className={cn(buttonVariants({ size: "lg" }), "h-12 rounded-full px-8 text-base shadow-md shadow-primary/20")}
            >
              Preencher cotação
            </Link>
            <Link
              href="/admin/login"
              className={cn(
                buttonVariants({ variant: "outline", size: "lg" }),
                "h-12 rounded-full border-2 px-8 text-base bg-background/80",
              )}
            >
              Sou do hospital — entrar
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-border/50 bg-card/40 px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-5xl">
          <h2 className="text-center text-xl font-semibold tracking-tight sm:text-2xl">Como funciona</h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-muted-foreground sm:text-base">
            Três passos pensados para quem está na correria do dia a dia ou na feira.
          </p>
          <ul className="mt-10 grid gap-5 sm:grid-cols-3">
            {passos.map(({ icon: Icon, titulo, texto }) => (
              <li key={titulo}>
                <Card className="h-full border-border/70 shadow-sm transition-shadow hover:shadow-md">
                  <CardContent className="flex flex-col gap-3 p-6 pt-6">
                    <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/12 text-primary">
                      <Icon className="size-5" aria-hidden />
                    </span>
                    <h3 className="font-semibold text-foreground">{titulo}</h3>
                    <p className="text-pretty text-sm leading-relaxed text-muted-foreground">{texto}</p>
                  </CardContent>
                </Card>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section className="px-4 py-14 sm:py-16">
        <div className="mx-auto max-w-3xl rounded-3xl border border-primary/15 bg-gradient-to-br from-primary/[0.07] to-transparent px-6 py-10 text-center sm:px-10">
          <h2 className="text-lg font-semibold sm:text-xl">Dúvidas sobre destino da proposta?</h2>
          <p className="mt-3 text-pretty text-sm text-muted-foreground sm:text-base">
            Na primeira tela do convite você vê a razão social, CNPJ e endereço para conferência antes de enviar
            qualquer documento.
          </p>
        </div>
      </section>
    </div>
  );
}
