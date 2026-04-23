"use client";

import { useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { FileSpreadsheet } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function EquipmentExportButton() {
  const searchParams = useSearchParams();
  const href = useMemo(() => {
    const sp = new URLSearchParams(searchParams.toString());
    const qs = sp.toString();
    return `/api/cotacao/export${qs ? `?${qs}` : ""}`;
  }, [searchParams]);

  return (
    <a href={href} className={cn(buttonVariants({ variant: "default" }), "inline-flex")}>
      <FileSpreadsheet className="mr-2 size-4" />
      Gerar planilha para fornecedores
    </a>
  );
}
