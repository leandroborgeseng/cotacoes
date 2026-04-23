"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { INSTITUICAO_PROPOSTA } from "@/lib/instituicao-publica";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      if (!res.ok) {
        const j = await res.json().catch(() => ({}));
        throw new Error(j.error ?? "Falha no login.");
      }
      toast.success("Bem-vindo ao painel.");
      router.replace("/admin");
      router.refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Erro.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-4 py-14">
      <div className="mb-8 text-center">
        <Link href="/" className="inline-block rounded-2xl border border-border/60 bg-card/90 p-5 shadow-md transition hover:shadow-lg">
          <Image
            src={INSTITUICAO_PROPOSTA.logoSrc}
            alt={INSTITUICAO_PROPOSTA.logoAlt}
            width={280}
            height={80}
            className="mx-auto h-14 w-auto object-contain sm:h-16"
          />
        </Link>
        <p className="mt-4 text-sm text-muted-foreground">Acesso restrito à equipe do hospital</p>
      </div>

      <Card className="w-full max-w-md rounded-3xl border-border/60 shadow-lg">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-xl">Painel interno</CardTitle>
          <CardDescription>Digite a senha de administrador para gerenciar convites, equipamentos e cotações.</CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-5" onSubmit={onSubmit}>
            <div className="space-y-2">
              <Label htmlFor="pw">Senha</Label>
              <Input
                id="pw"
                type="password"
                autoComplete="current-password"
                className="h-11 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
            <Button type="submit" className="h-11 w-full rounded-full text-base" size="lg" disabled={loading}>
              {loading ? "Entrando…" : "Entrar no painel"}
            </Button>
            <p className="text-center text-xs text-muted-foreground">
              <Link href="/" className="underline-offset-4 hover:text-foreground hover:underline">
                Voltar ao início
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
