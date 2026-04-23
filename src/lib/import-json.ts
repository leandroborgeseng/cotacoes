import type { Prisma } from "@/generated/prisma/client";
import { decimalFromNumber, totalFromUnit } from "@/lib/money";
import { normalizeRequisitosJson } from "@/lib/requisitos";

type RawRecord = Record<string, unknown>;

function pickString(obj: RawRecord, keys: string[]): string {
  for (const key of keys) {
    const v = obj[key];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function pickImportRef(obj: RawRecord): string | null {
  const s = pickString(obj, ["id", "import_id", "import_ref", "codigo", "external_id"]);
  return s || null;
}

function resolveQuantity(raw: RawRecord): number {
  const keys = ["quantidade", "qty", "qtd"];
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    const v = raw[key];
    if (v === null || v === undefined) return 1;
    if (typeof v === "number" && Number.isFinite(v)) return Math.max(1, Math.floor(v));
    if (typeof v === "string" && v.trim()) {
      const n = Number(v.trim().replace(",", "."));
      if (Number.isFinite(n)) return Math.max(1, Math.floor(n));
    }
    return 1;
  }
  return 1;
}

function resolveValorUnitario(raw: RawRecord): number {
  const keys = ["valor_estimado", "valorEstimado", "valor_unitario", "preco_estimado", "valor"];
  for (const key of keys) {
    if (!Object.prototype.hasOwnProperty.call(raw, key)) continue;
    const v = raw[key];
    if (v === null || v === undefined) return 0;
    if (typeof v === "number" && Number.isFinite(v)) return Math.max(0, v);
    if (typeof v === "string" && v.trim()) {
      const n = Number(v.trim().replace(",", "."));
      if (Number.isFinite(n)) return Math.max(0, n);
    }
    return 0;
  }
  return 0;
}

export function extractImportArray(parsed: unknown): unknown[] {
  if (Array.isArray(parsed)) return parsed;
  if (parsed && typeof parsed === "object") {
    const o = parsed as RawRecord;
    const keys = ["equipamentos", "equipment", "equipments", "items", "data", "lista"];
    for (const k of keys) {
      const v = o[k];
      if (Array.isArray(v)) return v;
    }
  }
  return [];
}

export type ImportEquipmentRow = {
  import_ref: string | null;
  nome_padronizado: string;
  nome_original: string;
  tipo: string;
  categoria: string;
  subcategoria: string;
  setor_hospitalar: string;
  anvisa_classe: string;
  criticidade: string;
  descricao_original: string;
  descricao_editavel: string;
  requisitos_minimos: Prisma.InputJsonValue;
  quantidade: number;
  valor_estimado: Prisma.Decimal;
  valor_total_estimado: Prisma.Decimal;
};

export function mapRawToEquipmentCreateData(raw: RawRecord): ImportEquipmentRow | null {
  const nome = pickString(raw, ["nome_padronizado", "nomePadronizado", "nome", "titulo", "item"]);
  if (!nome) return null;

  const nomeOriginal = pickString(raw, ["nome_original", "nomeOriginal"]);
  const tipo = pickString(raw, ["tipo", "type"]);
  const categoria = pickString(raw, ["categoria", "category"]) || "Sem categoria";
  const subcategoria = pickString(raw, ["subcategoria", "subCategoria", "sub_category"]);
  const setorHospitalar = pickString(raw, ["setor_hospitalar", "setorHospitalar", "setor"]);
  const anvisaClasse = pickString(raw, ["anvisa_classe", "anvisaClasse", "classe_anvisa"]);
  const criticidade = pickString(raw, ["criticidade", "criticity", "prioridade"]);

  const descFromLegacy = pickString(raw, ["descricao_original", "descricaoOriginal", "descricao", "description"]);
  const descricao_original = descFromLegacy || nomeOriginal;
  const descEditavelDirect = pickString(raw, ["descricao_editavel", "descricaoEditavel"]);
  const descricao_editavel = descEditavelDirect || descricao_original || nome;

  const quantidade = resolveQuantity(raw);
  const valorUnit = resolveValorUnitario(raw);
  const requisitos = normalizeRequisitosJson(raw.requisitos_minimos ?? raw.requisitosMinimos ?? raw.requisitos);

  const valor_estimado = decimalFromNumber(valorUnit);
  const valor_total_estimado = totalFromUnit(quantidade, valor_estimado);

  return {
    import_ref: pickImportRef(raw),
    nome_padronizado: nome,
    nome_original: nomeOriginal,
    tipo,
    categoria,
    subcategoria,
    setor_hospitalar: setorHospitalar,
    anvisa_classe: anvisaClasse,
    criticidade,
    descricao_original,
    descricao_editavel,
    requisitos_minimos: requisitos,
    quantidade,
    valor_estimado,
    valor_total_estimado,
  };
}
