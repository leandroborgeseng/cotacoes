import type { Prisma } from "@/generated/prisma/client";

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
  };
}
