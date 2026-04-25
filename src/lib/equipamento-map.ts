import { Prisma } from "@/generated/prisma/client";

/** Normaliza rótulos de criticidade para exibição em pt-BR. */
export function normalizarCriticidade(v: string): string {
  const s = v.trim().toLowerCase();
  if (s === "media" || s === "média") return "média";
  if (s === "baixa") return "baixa";
  if (s === "alta") return "alta";
  return v.trim();
}

function str(o: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = o[k];
    if (typeof v === "string" && v.trim()) return v.trim();
  }
  return "";
}

function parseDecimalOrNull(raw: unknown): Prisma.Decimal | null {
  if (raw === null || raw === undefined || raw === "") return null;
  if (typeof raw === "number") {
    return Number.isFinite(raw) && raw >= 0 ? new Prisma.Decimal(raw) : null;
  }
  let s = String(raw).trim();
  if (s.includes(",") && s.includes(".")) {
    s = s.replace(/\./g, "").replace(",", ".");
  } else {
    s = s.replace(",", ".");
  }
  const n = Number(s);
  if (!Number.isFinite(n) || n < 0) return null;
  return new Prisma.Decimal(n);
}

/** Valor unitário orçado (R$) a partir de import JSON; null se ausente ou inválido. */
export function parsePrecoUnitarioOrcado(o: Record<string, unknown>): Prisma.Decimal | null {
  return parseDecimalOrNull(
    o.precoUnitarioOrcado ??
      o.preco_unitario_orcado ??
      o.valor_estimado ??
      o.valor_unitario_orcado,
  );
}

function parseValorTotalOrcado(o: Record<string, unknown>): Prisma.Decimal | null {
  return parseDecimalOrNull(o.valorTotalOrcado ?? o.valor_total_orcado);
}

function parsePrevisaoAquisicao(o: Record<string, unknown>): number | null {
  const raw = o.previsaoAquisicao ?? o.previsao_aquisicao;
  if (raw === null || raw === undefined || raw === "") return null;
  const n = Math.floor(Number(raw));
  return Number.isFinite(n) ? n : null;
}

function requisitosToString(o: Record<string, unknown>): string {
  const raw = o.requisitos_minimos ?? o.requisitosMinimos;
  if (Array.isArray(raw)) {
    return JSON.stringify(raw.map((x) => String(x)));
  }
  if (typeof raw === "string") return raw.trim();
  return "";
}

/**
 * Converte uma linha de importação (JSON simples ou enriquecido) em dados Prisma para Equipamento.
 */
export function equipamentoFromImportRow(
  o: Record<string, unknown>,
  hospitalId: string,
): Prisma.EquipamentoCreateManyInput {
  const nome =
    str(o, "nome_padronizado", "nomePadronizado", "nome") || str(o, "nome_original", "nomeOriginal");
  const descricao = str(o, "descricao_editavel", "descricaoEditavel", "descricao");
  const qRaw = o.quantidade ?? o.qtd;
  const quantidade =
    qRaw === null || qRaw === undefined || qRaw === ""
      ? 1
      : Math.max(1, Math.floor(Number(qRaw)) || 1);
  const categoria = str(o, "categoria");
  const criticidade = normalizarCriticidade(str(o, "criticidade") || "média");
  const importRef = str(o, "id", "importRef");
  const nomeOriginal = str(o, "nome_original", "nomeOriginal");
  const subcategoria = str(o, "subcategoria");
  const setorHospitalar = str(o, "setor_hospitalar", "setorHospitalar");
  const anvisaClasse = str(o, "anvisa_classe", "anvisaClasse");
  const tipo = str(o, "tipo");
  const requisitosMinimos = requisitosToString(o);
  const precoUnitarioOrcado = parsePrecoUnitarioOrcado(o);
  const valorTotalOrcado = parseValorTotalOrcado(o);
  const previsaoAquisicao = parsePrevisaoAquisicao(o);
  const justificativa = str(o, "justificativa");

  return {
    hospitalId,
    nome,
    descricao,
    quantidade,
    categoria,
    criticidade,
    importRef,
    nomeOriginal,
    subcategoria,
    setorHospitalar,
    anvisaClasse,
    tipo,
    requisitosMinimos,
    precoUnitarioOrcado,
    valorTotalOrcado,
    previsaoAquisicao,
    justificativa,
  };
}
