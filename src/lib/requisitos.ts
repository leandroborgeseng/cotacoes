import type { Prisma } from "@/generated/prisma/client";

export function requisitosToText(value: Prisma.JsonValue): string {
  if (value === null || value === undefined) return "";
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  if (Array.isArray(value)) {
    return value
      .map((item) => {
        if (typeof item === "string") return item;
        if (item && typeof item === "object" && "texto" in item && typeof (item as { texto: unknown }).texto === "string") {
          return (item as { texto: string }).texto;
        }
        if (item && typeof item === "object" && "descricao" in item && typeof (item as { descricao: unknown }).descricao === "string") {
          return (item as { descricao: string }).descricao;
        }
        return JSON.stringify(item);
      })
      .filter(Boolean)
      .join(" | ");
  }
  if (typeof value === "object") {
    return JSON.stringify(value);
  }
  return "";
}

export function normalizeRequisitosJson(raw: unknown): Prisma.InputJsonValue {
  if (raw === null || raw === undefined) return [];
  if (Array.isArray(raw)) return raw as Prisma.InputJsonValue;
  if (typeof raw === "string") {
    const t = raw.trim();
    if (!t) return [];
    try {
      const parsed: unknown = JSON.parse(t);
      return normalizeRequisitosJson(parsed) as Prisma.InputJsonValue;
    } catch {
      return [t];
    }
  }
  if (typeof raw === "object") {
    return raw as Prisma.InputJsonValue;
  }
  return [String(raw)];
}
