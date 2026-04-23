"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INSTITUICAO_PROPOSTA } from "@/lib/instituicao-publica";

export function SiteTopNav() {
  const path = usePathname() ?? "";
  const onConvite = path.startsWith("/c/");
  const onAdmin = path.startsWith("/admin");

  return (
    <header className="sticky top-0 z-50 border-b border-border/40 bg-background/90 shadow-[0_1px_0_rgba(0,0,0,0.04)] backdrop-blur-md">
      <div className="mx-auto flex w-full max-w-[min(100%,1800px)] items-center justify-between gap-3 px-3 py-2.5 sm:px-6 sm:py-3 lg:px-8">
        <Link href="/" className="group flex min-w-0 items-center gap-2.5 sm:gap-3">
          <Image
            src={INSTITUICAO_PROPOSTA.logoSrc}
            alt={INSTITUICAO_PROPOSTA.logoAlt}
            width={200}
            height={56}
            className="h-9 w-auto shrink-0 object-contain object-left transition-transform group-hover:scale-[1.02] sm:h-10"
            priority={path === "/"}
          />
          <div className="hidden min-w-0 sm:block">
            <p className="truncate text-xs font-semibold text-foreground sm:text-sm">Pré-cotação hospitalar</p>
            <p className="truncate text-[11px] text-muted-foreground sm:text-xs">Fornecedores · São Joaquim</p>
          </div>
        </Link>
        <nav className="flex shrink-0 items-center gap-1.5 sm:gap-2">
          <Link
            href="/c/demo-convite-local"
            className={cn(
              buttonVariants({ variant: onConvite ? "default" : "ghost", size: "sm" }),
              "rounded-full px-3 text-xs sm:px-4 sm:text-sm",
            )}
          >
            Preencher cotação
          </Link>
          <Link
            href="/admin/login"
            className={cn(
              buttonVariants({ variant: onAdmin ? "default" : "secondary", size: "sm" }),
              "rounded-full px-3 text-xs sm:px-4 sm:text-sm",
            )}
          >
            Área hospital
          </Link>
        </nav>
      </div>
    </header>
  );
}
