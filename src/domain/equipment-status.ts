export const EQUIPMENT_STATUSES = ["rascunho", "pronto_para_cotacao", "enviado", "cotado"] as const;

export type EquipmentStatus = (typeof EQUIPMENT_STATUSES)[number];

export const EquipmentStatusValues = {
  rascunho: "rascunho",
  pronto_para_cotacao: "pronto_para_cotacao",
  enviado: "enviado",
  cotado: "cotado",
} as const satisfies Record<EquipmentStatus, EquipmentStatus>;

export const STATUS_LABEL: Record<EquipmentStatus, string> = {
  rascunho: "Rascunho",
  pronto_para_cotacao: "Pronto p/ cotação",
  enviado: "Enviado",
  cotado: "Cotado",
};
