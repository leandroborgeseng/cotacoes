import type { EquipmentStatus } from "@/domain/equipment-status";

export type EquipmentRowDTO = {
  id: string;
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
  quantidade: number;
  valor_estimado: number;
  valor_total_estimado: number;
  status: EquipmentStatus;
  ativo: boolean;
  observacoes: string;
  createdAt: string;
};
