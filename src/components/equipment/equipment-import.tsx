"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import { importEquipmentsFromJsonText } from "@/app/actions/equipment";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function EquipmentImport() {
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [fileName, setFileName] = useState<string | null>(null);

  async function onFile(files: FileList | null) {
    const file = files?.[0];
    if (!file) return;
    setFileName(file.name);
    const text = await file.text();
    startTransition(async () => {
      const res = await importEquipmentsFromJsonText(text);
      if (!res.ok) {
        toast.error(res.error);
        return;
      }
      toast.success(`${res.inserted} equipamento(s) importado(s).`);
      router.refresh();
      if (inputRef.current) inputRef.current.value = "";
      setFileName(null);
    });
  }

  return (
    <Card className="border-border/60 bg-gradient-to-br from-card via-card to-primary/5 shadow-sm">
      <CardHeader>
        <CardTitle className="text-base">Importação JSON</CardTitle>
        <CardDescription>
          Envie um JSON com array na raiz ou objeto com <span className="font-mono">equipamentos</span>. Campos suportados incluem{" "}
          <span className="font-mono">id</span>, <span className="font-mono">nome_original</span>,{" "}
          <span className="font-mono">nome_padronizado</span>, <span className="font-mono">tipo</span>, categoria, subcategoria,{" "}
          <span className="font-mono">setor_hospitalar</span>, <span className="font-mono">anvisa_classe</span>,{" "}
          <span className="font-mono">criticidade</span>, <span className="font-mono">requisitos_minimos</span>;{" "}
          <span className="font-mono">quantidade</span> e <span className="font-mono">valor_estimado</span> podem ser{" "}
          <span className="font-mono">null</span> (usamos 1 e R$ 0,00). Exemplo:{" "}
          <a className="underline underline-offset-4" href="/equipamentos-exemplo.json">
            /equipamentos-exemplo.json
          </a>
          .
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1 space-y-2">
          <Label htmlFor="json-upload">Arquivo</Label>
          <Input
            id="json-upload"
            ref={inputRef}
            className="hidden"
            type="file"
            accept="application/json,.json"
            disabled={pending}
            onChange={(e) => void onFile(e.target.files)}
          />
          {fileName ? <p className="text-xs text-muted-foreground">Processando: {fileName}</p> : null}
        </div>
        <Button type="button" variant="secondary" disabled={pending} onClick={() => inputRef.current?.click()}>
          <Upload className="mr-2 size-4" />
          Selecionar JSON
        </Button>
      </CardContent>
    </Card>
  );
}
