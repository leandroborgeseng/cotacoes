import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

export default function Home() {
  return (
    <div className="mx-auto flex min-h-[80vh] max-w-2xl flex-col justify-center gap-8 px-4 py-16">
      <div className="space-y-3 text-center">
        <p className="text-xs font-medium uppercase tracking-wider text-primary">Pré-cotação hospitalar</p>
        <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Portal para fornecedores</h1>
        <p className="text-sm text-muted-foreground md:text-base">
          Fornecedores acessam um link exclusivo, marcam os equipamentos que fornecem, enviam preços e anexam a proposta em PDF. O hospital acompanha tudo no painel interno.
        </p>
      </div>

      <Card className="border-border/80 shadow-sm">
        <CardHeader>
          <CardTitle className="text-base">Como testar localmente</CardTitle>
          <CardDescription>
            Após migrar o banco e rodar o seed, use o link de demonstração (token fixo no seed).
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <Link href="/c/demo-convite-local" className={cn(buttonVariants({ size: "lg" }), "rounded-full justify-center")}>
            Abrir convite demo
          </Link>
          <Link
            href="/admin/login"
            className={cn(buttonVariants({ size: "lg", variant: "outline" }), "rounded-full justify-center")}
          >
            Painel administrativo
          </Link>
        </CardContent>
      </Card>

      <p className="text-center text-xs text-muted-foreground">
        Variáveis: <code className="rounded bg-muted px-1 py-0.5">DATABASE_URL</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5">ADMIN_PASSWORD</code>,{" "}
        <code className="rounded bg-muted px-1 py-0.5">ADMIN_JWT_SECRET</code> (mín. 16 caracteres).
      </p>
    </div>
  );
}
