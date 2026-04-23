import Link from "next/link";
import { INSTITUICAO_PROPOSTA } from "@/lib/instituicao-publica";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border/50 bg-gradient-to-b from-muted/30 to-muted/50 py-10">
      <div className="mx-auto w-full max-w-[min(100%,1800px)] px-4 text-center sm:px-6 lg:px-8">
        <p className="text-sm font-medium text-foreground/90">{INSTITUICAO_PROPOSTA.razaoSocial}</p>
        <p className="mt-1 text-xs text-muted-foreground sm:text-sm">
          Canal exclusivo para pré-cotação de equipamentos — respostas rápidas, sem burocracia.
        </p>
        <div className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-xs text-muted-foreground">
          <Link href="/" className="hover:text-foreground">
            Início
          </Link>
          <Link href="/c/demo-convite-local" className="hover:text-foreground">
            Convite demonstração
          </Link>
          <Link href="/admin/login" className="hover:text-foreground">
            Acesso hospital
          </Link>
        </div>
      </div>
    </footer>
  );
}
